export const {
  STEMN_PIPELINE_ID,
  STEMN_PIPELINE_PARAMS_TO,
  STEMN_PIPELINE_PARAMS_SUBJECT,
  STEMN_PIPELINE_PARAMS_BODY,
  STEMN_PIPELINE_PARAMS_ATTACHMENTS,
  STEMN_PIPELINE_ROOT,
  STEMN_PIPELINE_TMP,
  STEMN_PIPELINE_TOKEN,
} = process.env;

const sendEmail = () => {

  console.log({
    STEMN_PIPELINE_ID,
    STEMN_PIPELINE_PARAMS_TO,
    STEMN_PIPELINE_PARAMS_SUBJECT,
    STEMN_PIPELINE_PARAMS_BODY,
    STEMN_PIPELINE_PARAMS_ATTACHMENTS,
    STEMN_PIPELINE_TOKEN,
  });

};

module.exports = sendEmail();