import { basename } from 'path';

/**
 *  Mock files
 */
const mockFiles: { [ key: string ]: string } = {
  '/pipeline/test.txt': 'foo bar baz',
  '/pipeline/girtbysea.txt': 'bar',
  '/pipeline/motor.stl': 'motor file',
};

/**
 * Mocked fs-extra functions
 */
const mockPathExists = (filepath: string) => Promise.resolve(filepath in mockFiles);
const mockStat = (filepath: string) => ({ size: Buffer.from(mockFiles[filepath]).length });

/**
 * Mocked sendEmail functions
 */
const mockEncode = (filepath: string) => Promise.resolve({
  filename: basename(filepath),
  content: Buffer.from(mockFiles[filepath]).toString('base64'),
});

jest.mock('fs-extra', () => ({
  pathExists: jest.fn(mockPathExists),
  stat: jest.fn(mockStat),
}))

jest.mock('../sendEmail', () => {
  const module = require('../sendEmail');
  return {
    ...module,
    encodeSendGridAttachment: jest.fn(mockEncode),
  };
});

import { sendEmail } from "../sendEmail";
const nock = require('nock');

beforeAll(() => {
  // Emails to hit
  const emails = ['admin@stemn.com'];

  // Common env variables
  Object.assign(process.env, {
    STEMN_PIPELINE_PARAMS_TO: JSON.stringify(emails),
    STEMN_PIPELINE_PARAMS_BODY: '# hey\n\n from the stemn pipeline',
    STEMN_SENDGRID_AUTH: 'D3ADB33F',
  });

  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

describe('sending an email with no attachments', () => {
  let requestBody: any;
  let response: any;

  beforeAll(async () => {
    nock('https://api.sendgrid.com')
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .post('/v3/mail/send')
      .reply(200, (uri: string, body: string ) => {
        requestBody = JSON.parse(body);
      });

     response = await sendEmail();
  });

  it('succeeds with 200', () => expect(response.status).toBe(200));
  it('sends an email with no attachments', () => expect(requestBody.attachments).toBe([]));
})

describe('sending email with attachment', async () => {
  let requestBody: any;

  beforeAll(async () => {
    // Extend with attachments
    Object.assign(process.env, {
      STEMN_PIPELINE_PARAMS_ATTACHMENTS: JSON.stringify(Object.keys(mockFiles)),
    });

    nock('https://api.sendgrid.com')
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .post('/v3/mail/send')
      .reply(200, (uri: string, body: string ) => {
        requestBody = JSON.parse(body);
      });

    return await sendEmail();
  })

  afterAll(() => {
    delete process.env['STEMN_PIPELINE_PARAMS_ATTACHMENTS'];
  });

  it('correctly encodes attachments', () => {
    const convertToExpected = ((obj: any, {filename, content}: { filename: string, content: string }) => {
      const env: any = {};
      env[filename] = Buffer.from(content, 'base64').toString('ascii');
      return Object.assign(obj, env);
    });

    const attachments = requestBody.attachments.map(convertToExpected);
    return expect(attachments).toMatchObject(mockFiles);
  });
});

describe('sending email with attachment', () => {
  beforeAll(() => {
    // Extend with attachments and max attachment
    Object.assign(process.env, {
      STEMN_PIPELINE_PARAMS_ATTACHMENTS: JSON.stringify(Object.keys(mockFiles)),
      STEMN_MAX_ATTACHMENTS: 1,
    });
  });

  afterAll(() => {
    delete process.env['STEMN_PIPELINE_PARAMS_ATTACHMENTS'];
    delete process.env['STEMN_MAX_ATTACHMENTS'];
  });

  it('fails when attachment limit exceeded', () => {
    return expect(sendEmail()).toThrow(new RegExp('Attachment limit exceeded'));
  });

});