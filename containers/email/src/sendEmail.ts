import { log } from '@stemn/pipeline-logger';
import request, { AxiosResponse } from 'axios';
import * as Bluebird from 'bluebird';
import { readFile, stat } from 'fs-extra';
import * as walk from 'klaw-sync';
import * as Markdown from 'markdown-it';
import * as match from 'micromatch';
import { basename, join } from 'path';

export async function getFileSize (filepath: string): Promise<number> {
  const { size } = await stat(filepath);
  return size;
}

/**
 * Expand globs relative to a root directory
 */
async function matchAttachmentGlobs (globs: string[], root: string) {
  const absoluteGlobs: string[] = globs.map((glob: string) => join(root, glob));
  const pipelineFiles: string[] = walk(root, { nodir: true }).map((file) => file.path);

  const attachments = match(pipelineFiles, absoluteGlobs);
  return attachments;
}

/**
 * Encode attachment to base64 and create sendgrid attachement object
 */
async function encodeSendGridAttachment (filepath: string) {
  const filedata = await readFile(filepath);
  return {
    filename: basename(filepath),
    content: filedata.toString('base64'),
  };
}

/**
 * Determine valid attachments, ensure attachment set within size limit then encode to sendgrid attachment object
 */
async function encodeAttachments (filepaths: string[], limit: number) {
  const sizes: number[] = await Bluebird.map(filepaths, getFileSize);
  const isWithinAttachmentLimit = sizes.reduce((acc, size) => acc + size, 0) <= limit;

  if (!isWithinAttachmentLimit) {
    throw new Error('Attachment limit exceeded');
  }

  return Bluebird.map(filepaths, encodeSendGridAttachment);
}

/**
 * Render markdown content to html, create sendgrid content object with plaintext fallback
 */
function renderSendGridContent (content: string) {
  return [{
    type: 'text/html',
    value: Markdown({
      html: true,
      linkify: true,
      typographer: true,
    })
    .render(content),
  }, {
    type: 'text/plaintext',
    value: content,
  }];
}

/**
 * Create an array of encoded attachments globbed relative to the root
 */
async function generateAttachments (globs: string[], root: string, limit: number) {
  const matches = await matchAttachmentGlobs(globs, root);
  const attachments = await encodeAttachments(matches, Number(limit));
  return attachments;
}

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

export async function sendEmail (): Promise<AxiosResponse> {
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

  const emails: string[] = JSON.parse(emailRecipients);
  const personalizations = emails.map((email) => ({ to: { email } }));

  const attachmentGlobs: string[] = attachmentGlobJSON
    ? JSON.parse(attachmentGlobJSON)
    : [];

  const attachments = await generateAttachments(attachmentGlobs, pipelineRoot, attachmentLimit);
  const content = renderSendGridContent(emailContent);

  const response = await request.post('https://api.sendgrid.com/v3/mail/send', {
    headers: { Authorization: `Bearer ${sendgridAuth}` },
    data: {
      'from': stemnEmail,
      'reply-to': { email: stemnEmail },
      subject,
      content,
      personalizations,
      attachments,
    },
  });

  if (response.status !== 200) {
    log(`Failed to send email: Received ${response.status} ${response.statusText}`);
    throw new Error('Failed to send email via SendGrid');
  }

  return response;
}
