import { sendSlackNotification } from "../index";
import { AxiosResponse } from "axios";
const nock = require('nock');

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

describe('sending a Slack Notification', () => {
  const url = 'https://www.slack.com/bigtoken';
  const channel = 'stemn';
  const text = 'test';

  let requestBody: any;
  let response: AxiosResponse;

  beforeAll(async () => {
    const env = {
      STEMN_PARAM_SLACK_CHANNEL: channel,
      STEMN_PARAM_SLACK_MESSAGE: text,
      STEMN_PARAM_SLACK_URL: url,
    };
    Object.assign(process.env, env);

    nock(/.*/)
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .post(/.*/)
      .reply(200,  (uri: string, body: string) => {
        requestBody = JSON.parse(body);
      });

    response = await sendSlackNotification();
  });
  
  it('requests the correct domain', () => expect(response.config.url).toBe(url));
  it('succeeds with a 200', () => expect(response.status).toBe(200));
  it('has the correct channel', () => expect(requestBody.channel).toBe(channel));
  it('has the correct text', () => expect(requestBody.text).toBe(text));
});
