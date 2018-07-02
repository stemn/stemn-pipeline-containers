import Bluebird from 'bluebird';
import { openSync, pathExists, readFile, stat } from 'fs-extra';
import walk from 'klaw';
import Markdown from 'markdown-it';
import match from 'micromatch';
import { basename, join } from 'path';
import requestPromise from 'request-promise';

const md = Markdown({
  html: true,
  linkify: true,
  typographer: true,
});

/**
 * Check the combined attachments do not exceed the specified limit
 */
function withinAttachmentLimit (filepaths: string[], limit: number) {
  const getFileSize = (fp: string) => stat(fp).then((stats) => stats.size);
  return Bluebird.map(filepaths, getFileSize)
    .then((sizes: number[]) => sizes.reduce((acc, size) => acc + size, 0) <= limit);
}

/**
 * Encode attachment to base64 and create sendgrid attachement object
 */
function encodeAttachment (filepath: string) {
  const fd = openSync(filepath, 'r');
  return readFile(fd)
    .then((data: Buffer) => ({ filename: basename(filepath), content: data.toString('base64') }))
    .catch((e: Error) => console.log(e.message)); // tslint:disable-line:no-console
}

/**
 * Determine valid attachments, ensure attachment set within size limit then encode to sendgrid attachment object
 */
function encodeAttachments (filepaths: string[], limit: number) {
  return Bluebird.filter(filepaths, pathExists).then((paths: string[]) => {
    return withinAttachmentLimit(paths, limit)
      .then((within: boolean) => {
        if (!within) {
          throw new Error('Attachment limit exceeded');
        }
        return Bluebird.map(paths, encodeAttachment);
      });
  });
}

/**
 * Expand globs relative to the pipeline root
 */
function matchAttachmentGlobs (globs: string[], root: string) {
  const absoluteGlobs = globs.map((glob: string) => join(root, glob));
  const matchGlobs = (paths: string[]) => match(paths, absoluteGlobs);

  const collectPaths = () => <Promise<string[]>> new Promise((resolve, reject) => {
    const paths: string[] = [];
    walk(root)
      .on('error', (err) => reject(err))
      .on('data', (path: string) => paths.push(path))
      .on('end', () => resolve(paths));
  });

  return collectPaths().then(matchGlobs);
}

/**
 * Render markdown content to html, create sendgrid content object with plaintext fallback
 */
function renderContent (content: string) {
  const htmlContent = {
    type: 'text/html',
    value: md.render(content),
  };
  const plaintext = {
    type: 'text/plaintext',
    value: content,
  };
  return [htmlContent, plaintext];
}

export function sendEmail () {

  const {
    STEMN_PIPELINE_ROOT: pipelineRoot,
    STEMN_PIPELINE_PARAMS_TO: emailRecipients,
    STEMN_PIPELINE_PARAMS_SUBJECT: subject = 'Update from Stemn pipeline',
    STEMN_PIPELINE_PARAMS_STEMN_EMAIL: stemnEmail = 'bot@stemn.com',
    STEMN_PIPELINE_PARAMS_BODY: emailContent = '',
    STEMN_PIPELINE_PARAMS_ATTACHMENTS: attachmentFiles,
    STEMN_PIPELINE_PARAMS_MAX_ATTACHMENTS: attachmentLimit = 30e6,
    STEMN_PIPELINE_SENDGRID_AUTH: sendgridAuth,
  } = process.env;

  if (!pipelineRoot) {
    throw new Error('Pipeline root not defined');
  }

  if (!sendgridAuth) {
    throw new Error('SendGrid token not defined');
  }

  const toEmails: string[] = JSON.parse(<string> emailRecipients);
  const personalizations = toEmails.map((email) => ({ to: { email } }));

  const generateAttachments = () => {
    const globs: string[] = JSON.parse(<string> attachmentFiles);
    return matchAttachmentGlobs(globs, pipelineRoot)
      .then((matches) => encodeAttachments(matches, Number(attachmentLimit)));
  };

  const attachments = attachmentFiles ? generateAttachments() : [];
  const content = renderContent(emailContent);

  requestPromise.post('https://api.sendgrid.com/v3/mail/send', {
    headers: { Authorization: `Bearer ${ sendgridAuth }` },
    json: true,
    body: {
      from: stemnEmail,
      'reply-to': { email: stemnEmail },
      subject,
      content,
      personalizations,
      attachments,
    },
  });

}
