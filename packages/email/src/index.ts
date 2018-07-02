import * as request from 'axios';
import Bluebird from 'bluebird';
import { open, pathExists, read, stat } from 'fs-extra';
import Markdown from 'markdown-it';
import { basename, join } from 'path';

const md = Markdown({
  html: true,
  linkify: true,
  typographer: true,
});

/**
 * Check the combined attachments do not exceed the specified limit
 */
function withinAttachmentLimit (filepaths: string[], limit: number) {
  return Bluebird.map(filepaths, (fp: string) => stat(fp).size)
    .then((sizes: number[]) => sizes.reduce((acc, size) => acc + size, 0) <= limit);
}

/**
 * Encode attachement to base64 and create sendgrid attachement object
 */
function encodeAttachment (filepath: string) {
  return open(filepath)
    .then(read)
    .then((data: Buffer) => ({ filename: basename(filepath), content: data.toString('base64') }))
    .catch((e: Error) => console.log(e.message)); // tslint:disable-line:no-console
}

function encodeAttachments (filepaths: string[], limit: number) {
  return Bluebird.filter(filepaths, pathExists).then((paths) => {
    return withinAttachmentLimit(paths, limit)
      .then((within: boolean) => {
        if (!within) {
          throw new Error('Attachment limit exceeded');
        }
        return Bluebird.map(paths, encodeAttachment);
      });
  });
}

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
    STEMN_PIPELINE_PARAMS_BODY: emailContent,
    STEMN_PIPELINE_PARAMS_ATTACHMENTS: attachmentFiles,
    STEMN_PIPELINE_PARAMS_MAX_ATTACHMENTS: attachementLimit = 30e6,
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

  const attachmentPaths: string[] = JSON.parse(<string> attachmentFiles).map((path) => join(pipelineRoot, path));
  const attachments = encodeAttachments(attachmentPaths, attachementLimit);
  const content = ;

  request.post('https://api.sendgrid.com/v3/mail/send', {
    headers: { Authorization: 'Bearer ${ sendgridAuth }' },
    data: {
      from: stemnEmail,
      'reply-to': { email: stemnEmail },
      subject,
      content: renderContent(emailContent),
      personalizations,
      attachments,
    }
  });

}
