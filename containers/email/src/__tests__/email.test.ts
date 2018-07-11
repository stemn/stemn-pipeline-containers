// const mockFs = () => undefined;
// mockFs.restore = () => undefined;

const mockFs = require('mock-fs');
import * as Markdown from 'markdown-it';
import * as nock from 'nock';

const { sendEmail } = require('../sendEmail');

// Mocked file objects
const mockedFiles = {
  '/pipeline/test.txt': 'foo bar baz',
  '/pipeline/girtbysea.txt': 'bar',
  '/pipeline/images/a.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
};

const markdown = Markdown({
  html: true,
  linkify: true,
  typographer: true,
});

const emails = ['admin@stemn.com'];
const emailContent = '# hey\n\n from the stemn pipeline';
const sendGridAuth = 'D3ADB33F';

beforeAll(() => {
  Object.assign(process.env, {
    STEMN_PIPELINE_PARAMS_TO: JSON.stringify(emails),
    STEMN_PIPELINE_PARAMS_BODY: emailContent,
    STEMN_SENDGRID_AUTH: sendGridAuth,
  });

  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

beforeEach(() => {
  mockFs(mockedFiles);
});

afterEach(() => {
  mockFs.restore();
});

describe('sending an email with no attachments', () => {
  let requestBody: any;
  let response: any;

  beforeAll(async () => {
    nock('https://api.sendgrid.com')
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .post('/v3/mail/send')
      .reply(200, (uri: string, body: string) => {
        requestBody = JSON.parse(body);
      });

    response = await sendEmail();
  });

  it('succeeds with 200', () => expect(response.status).toBe(200));
  it('requests with correct auth header', () => expect(requestBody.headers.Authorization).toBe(`Bearer ${ sendGridAuth }`));
  it('sends an email with no attachments', () => expect(requestBody.data.attachments).toEqual([]));
  it('correctly renders markdown', () => {

    const expected = [{
      type: 'text/html',
      value: markdown.render(emailContent),
    }, {
      type: 'text/plaintext',
      value: emailContent,
    }];

    expect(requestBody.data.content).toEqual(expected);
  });
});

describe('sending email with attachment', async () => {
  let requestBody: any;

  beforeAll(async () => {
    Object.assign(process.env, {
      STEMN_PIPELINE_PARAMS_ATTACHMENTS: JSON.stringify(['*.png']),
    });

    nock('https://api.sendgrid.com')
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .post('/v3/mail/send')
      .reply(200, (uri: string, body: string) => {
        requestBody = JSON.parse(body);
      });

    return sendEmail();
  });

  afterAll(() => {
    delete process.env.STEMN_PIPELINE_PARAMS_ATTACHMENTS;
  });

  it('correctly encodes attachments', () => {
    const convertToExpected = (obj: any, { filename, content }: { filename: string; content: string }) => {
      const env: any = {};
      env[filename] = Buffer.from(content, 'base64').toString('ascii');
      return { ...obj, ...env };
    };

    const attachments = requestBody.data.attachments.reduce(convertToExpected, {});
    return expect(attachments).toMatchObject(mockedFiles);
  });
});

describe('sending email with attachments that exceed limit', () => {
  beforeAll(() => {
    Object.assign(process.env, {
      STEMN_PIPELINE_PARAMS_ATTACHMENTS: JSON.stringify(['*.txt']),
      STEMN_MAX_ATTACHMENTS: 0,
    });

    nock('https://api.sendgrid.com')
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .post('/v3/mail/send')
      .reply(200);
  });

  afterAll(() => {
    delete process.env.STEMN_PIPELINE_PARAMS_ATTACHMENTS;
    delete process.env.STEMN_MAX_ATTACHMENTS;
  });

  it('fails when attachment limit exceeded', () => {
    return expect(sendEmail).toThrow(/Attachment limit exceeded/);
  });
});
