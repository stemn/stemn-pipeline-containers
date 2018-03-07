import archiver from 'archiver';
import { readJson } from 'fs-extra';
import match from 'micromatch';
import { join } from 'path';
import request from 'request-promise';

export const {
  STEMN_API_HOST = '993f9417.ngrok.io',
  STEMN_API_PORT = 80,
  STEMN_PIPELINE_ID,
  STEMN_PIPELINE_PARAMS_INPUT,
  STEMN_PIPELINE_ROOT,
  STEMN_PIPELINE_TMP,
  STEMN_PIPELINE_TOKEN,
} = process.env;

const pipeStream = ({ source, destination }) => new Promise((resolve, reject) => source
  .pipe(destination)
  .on('end', resolve)
  .on('error', reject));

const getFiles = () => {

  return readJson(join(STEMN_PIPELINE_TMP, 'changes')).then((changes) => {

    const inputs = STEMN_PIPELINE_PARAMS_INPUT
      ? JSON.parse(STEMN_PIPELINE_PARAMS_INPUT)
      : '**';

      return match(changes, inputs);
  });
};

const zipFiles = (files) => {

  const archive = archiver('zip', { zlib: { level: 9 } });

  console.log('Uploading:\n', files.join('\n'));

  // remove '/pipeline' prefix from zip file paths
  const stripPipelinePrefix = (path) => path.replace(new RegExp(`^${STEMN_PIPELINE_ROOT}`, 'g'), '');

  files.forEach((file) => archive.file(file, { name: stripPipelinePrefix(file) }));
  archive.finalize();

  return archive;
};

export const upload = (files) => {

  const source = zipFiles(files);

  const destination = request({
    uri: `http://${STEMN_API_HOST}:${STEMN_API_PORT}/api/v1/pipelines/${STEMN_PIPELINE_ID}`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STEMN_PIPELINE_TOKEN}`,
      'Content-Disposition': `attachment;filename=${STEMN_PIPELINE_ID}.zip`,
      'Content-Type': 'application/zip',
    }
  });

  return pipeStream({ source, destination });
};

module.exports = getFiles().then(upload);
