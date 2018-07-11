import { log } from '@stemn/pipeline-logger';
import request, { AxiosResponse } from 'axios';
import * as Bluebird from 'bluebird';
import { openSync, pathExists, readFile, stat } from 'fs-extra';
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
function getPipelineFiles (root: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const paths: string[] = [];
    walk(root)
      .on('error', (err: Error) => reject(err))
      .on('data', (path: string) => paths.push(path))
      .on('end', () => resolve(paths));
  });
}

/**
 * Expand globs relative to a root directory
 */
async function matchAttachmentGlobs (globs: string[], root: string) {
  const absoluteGlobs: string[] = globs.map((glob: string) => join(root, glob));
  const pipelineFiles: string[] = await getPipelineFiles(root);

  const attachments = match(pipelineFiles, absoluteGlobs);
  return attachments;
}

/**
 * Check the combined attachments do not exceed the specified limit
 */
export async function checkWithinAttachmentLimit (filepaths: string[], limit: number) {
  const getFileSize = (filepath: string) => stat(filepath).then((stats) => stats.size);

  const sizes: number[] = await Bluebird.map(filepaths, getFileSize);
  const isWithinLimit = sizes.reduce((acc, size) => acc + size, 0) <= limit;
  return isWithinLimit;
}

/**
 * Encode attachment to base64 and create sendgrid attachement object
 */
export async function encodeSendGridAttachment (filepath: string) {
  const filedata: Buffer = await readFile(openSync(filepath, 'r'));
  return {
    filename: basename(filepath),
    content: filedata.toString('base64'),
  };
}

/**
 * Determine valid attachments, ensure attachment set within size limit then encode to sendgrid attachment object
 */
export async function encodeAttachments (filepaths: string[], limit: number) {
  const paths: string[] = await Bluebird.filter(filepaths, pathExists);
  const isWithinAttachmentLimit = await checkWithinAttachmentLimit(paths, limit);

  return isWithinAttachmentLimit
    ? Bluebird.map(paths, encodeSendGridAttachment)
    : Promise.reject(new Error('Attachment limit exceeded'));
}

/**
 * Render markdown content to html, create sendgrid content object with plaintext fallback
 */
export function renderSendGridContent (content: string) {
  return [{
    type: 'text/html',
    value: md.render(content),
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
