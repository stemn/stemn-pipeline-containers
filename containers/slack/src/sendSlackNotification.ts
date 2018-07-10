import { log } from '@stemn/pipeline-logger';
import request from 'axios';

export interface ISlackEnv extends NodeJS.ProcessEnv {
  STEMN_PARAM_SLACK_CHANNEL: string;
  STEMN_PARAM_SLACK_MESSAGE: string;
  STEMN_PARAM_SLACK_URL: string;
}

export async function sendSlackNotification () {
  const {
    STEMN_PARAM_SLACK_CHANNEL: channel,
    STEMN_PARAM_SLACK_MESSAGE: text,
    STEMN_PARAM_SLACK_URL: url,
  } = <ISlackEnv> process.env;

  const data = {
    username: 'stemnbot',
    icon_emoji: ':female-astronaut:',
    channel,
    text,
  };

  const response = await request.post(url, data);
  if (response.status !== 200) {
    log(`Failed to send Slack message: Received ${response.status} ${response.statusText}`);
    throw new Error('Failed to send Slack message');
  }

  return response;
}
