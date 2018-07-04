import { sendSlackNotification } from "../index";
import { AxiosResponse } from "axios";
const nock = require('nock');

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

describe('sending a Slack Notification', async () => {

  const url = 'https://www.slack.com/bigtoken';
  const channel = 'stemn';
  const text = 'test';

  const env = {
    STEMN_PARAM_SLACK_CHANNEL: channel,
    STEMN_PARAM_SLACK_MESSAGE: text,
    STEMN_PARAM_SLACK_URL: url,
  };
  Object.assign(process.env, env);

  let requestBody: any;
  let requestUrl: string;
  nock(new RegExp('.*'))
      .post(new RegExp('.*'))
      .reply(200)
      .on('request', (req, intercept, body) => {
        requestBody = body;
        requestUrl = req.url;
      })
  
  const response: AxiosResponse = await sendSlackNotification();
  
  it('requests the correct domain', () => expect(requestUrl).toBe(url));
  it('succeeds with a 200', () => expect(response.status).toBe(200));
  it('has the correct channel', () => expect(requestBody.channel).toBe(channel));
  it('has the correct text', () => expect(requestBody.text).toBe(text));
})
