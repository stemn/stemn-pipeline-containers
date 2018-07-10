import request, { AxiosResponse } from 'axios';
import * as Bluebird from 'bluebird';
import * as fs from 'fs-extra';
import * as walk from 'klaw';
import * as Markdown from 'markdown-it';
import * as match from 'micromatch';
import { basename, join } from 'path';

const md = Markdown({
  html: true,
  linkify: true,
  typographer: true,
});

/**
 * Generate array of all filepaths below root
 */
function collectPaths (root: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const paths: string[] = [];
    const options = { fs };
    walk(root, options)
      .on('error', (err: Error) => reject(err))
      .on('data', (path: string) => paths.push(path))
      .on('end', () => resolve(paths));
  });
}

/**
 * Expand globs relative to a root directory
 */
function matchAttachmentGlobs (globs: string[], root: string) {
  const absoluteGlobs: string[] = globs.map((glob: string) => join(root, glob));
  const matchGlobs = (paths: string[]) => match(paths, absoluteGlobs);
  return collectPaths(root).then(matchGlobs);
}

/**
 * Check the combined attachments do not exceed the specified limit
 */
export function checkWithinAttachmentLimit (filepaths: string[], limit: number) {
  const getFileSize = (filepath: string) => fs.stat(filepath).then((stats) => stats.size);

  return Bluebird.map(filepaths, getFileSize)
    .then((sizes: number[]) => sizes.reduce((acc, size) => acc + size, 0) <= limit);
}

/**
 * Encode attachment to base64 and create sendgrid attachement object
 */
export function encodeSendGridAttachment (filepath: string) {
  const fd = fs.openSync(filepath, 'r');
  return fs.readFile(fd)
    .then((data: Buffer) => ({
      filename: basename(filepath),
      content: data.toString('base64'),
    }))
    .catch((e: Error) => console.log(e.message)); // tslint:disable-line:no-console
}

/**
 * Determine valid attachments, ensure attachment set within size limit then encode to sendgrid attachment object
 */
export function encodeAttachments (filepaths: string[], limit: number) {
  return Bluebird.filter(filepaths, fs.pathExists).then((paths: string[]) => {
    return checkWithinAttachmentLimit(paths, limit)
      .then((within: boolean) => within
        ? Bluebird.map(paths, encodeSendGridAttachment)
        : Promise.reject(new Error('Attachment limit exceeded'))
      );
  });
}

/**
 * Render markdown content to html, create sendgrid content object with plaintext fallback
 */
export function renderSendGridContent (content: string) {
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

/**
 * Create an array of encoded attachments globbed relative to the root 
 */
export function generateAttachments (globJSON: string, root: string, limit: number) {
  const globs: string[] = JSON.parse(globJSON);
  return matchAttachmentGlobs(globs, root)
    .then((matches) => encodeAttachments(matches, limit));
};

export interface IEmailEnv extends NodeJS.ProcessEnv {
  STEMN_PIPELINE_ROOT: string;
  STEMN_PIPELINE_PARAMS_TO: string;
  STEMN_PIPELINE_PARAMS_SUBJECT: string;
  STEMN_PIPELINE_PARAMS_STEMN_EMAIL: string;
  STEMN_PIPELINE_PARAMS_BODY: string;
  STEMN_PIPELINE_PARAMS_ATTACHMENTS?: string;
  STEMN_MAX_ATTACHMENTS: string;
  STEMN_SENDGRID_AUTH: string;
}

export function sendEmail (): Promise<AxiosResponse> {
  const {
    STEMN_PIPELINE_ROOT: pipelineRoot = '/pipeline',
    STEMN_PIPELINE_PARAMS_TO: emailRecipients,
    STEMN_PIPELINE_PARAMS_SUBJECT: subject = 'Update from Stemn pipeline',
    STEMN_PIPELINE_PARAMS_STEMN_EMAIL: stemnEmail = 'bot@stemn.com',
    STEMN_PIPELINE_PARAMS_BODY: emailContent = '',
    STEMN_PIPELINE_PARAMS_ATTACHMENTS: attachmentGlobJSON,
    STEMN_SENDGRID_AUTH: sendgridAuth,
    STEMN_MAX_ATTACHMENTS_SIZE,
  } = <IEmailEnv> process.env;

  const attachmentLimit: number = Number(STEMN_MAX_ATTACHMENTS_SIZE) || 30e6;

  const toEmails: string[] = JSON.parse(emailRecipients);
  const personalizations = toEmails.map((email) => ({ to: { email } }));

  const attachments = attachmentGlobJSON
    ? generateAttachments(attachmentGlobJSON, pipelineRoot, attachmentLimit)
    : [];

  const content = renderSendGridContent(emailContent);

  return request.post('https://api.sendgrid.com/v3/mail/send', {
    headers: { Authorization: `Bearer ${sendgridAuth}` },
    data: {
      from: stemnEmail,
      'reply-to': { email: stemnEmail },
      subject,
      content,
      personalizations,
      attachments,
    },
  }).then((res) => {
    if (res.status !== 200) {
      console.log(`Failed to send email: Received ${res.status} ${res.statusText}`)
      throw new Error('Failed to send email via SendGrid');
    }
    return res;
  });
}
