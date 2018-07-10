import request from 'axios';

export interface ISlackEnv extends NodeJS.ProcessEnv {
  STEMN_PARAM_SLACK_CHANNEL: string;
  STEMN_PARAM_SLACK_MESSAGE: string;
  STEMN_PARAM_SLACK_URL: string;
}

export function sendSlackNotification () {
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

  return request.post(url, data).then((res) => {
    if (res.status !== 200) {
      console.log(`Failed to send Slack message: Received ${res.status} ${res.statusText}`);
      throw new Error('Failed to send Slack message');
    }
    return res;
  });
}
