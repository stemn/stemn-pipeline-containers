import * as request from 'axios';

export function sendSlackNotification () {

  const {
    STEMN_PARAM_SLACK_CHANNEL,
    STEMN_PARAM_SLACK_MESSAGE,
    STEMN_PARAM_SLACK_URL,
  } = process.env;

  const data = {
    username: 'stemnbot',
    icon_emoji: ':female-astronaut:',
    channel: STEMN_PARAM_SLACK_CHANNEL,
    text: STEMN_PARAM_SLACK_MESSAGE,
  };

  request.post(STEMN_PARAM_SLACK_URL, data);
}
