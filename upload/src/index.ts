import * as archiver from 'archiver';
import { readJson } from 'fs-extra';
import * as match from 'micromatch';
import { join } from 'path';
import request from 'request-promise';

const {
  STEMN_API_HOST = 'test',
  STEMN_API_PORT = 3000,
  STEMN_PIPELINE_ID,
  STEMN_PIPELINE_PARAMS_INPUT,
  STEMN_PIPELINE_ROOT = '/pipeline',
  STEMN_PIPELINE_TMP = '/pipeline/.stemn',
  STEMN_PIPELINE_TOKEN,
} = process.env;

const getFiles = () => {

  return readJson(join(STEMN_PIPELINE_TMP, 'changes')).then((changes) => {

    const inputs = STEMN_PIPELINE_PARAMS_INPUT
      ? JSON.parse(STEMN_PIPELINE_PARAMS_INPUT)
      : '**';

    return match(changes, inputs);
  });
};

const zipFiles = (files: string[]) => {

  const archive = archiver('zip', { zlib: { level: 9 } });

  console.log('Uploading:\n', files.join('\n')); // tslint:disable-line

  // remove '/pipeline' prefix from zip file paths
  const stripPipelinePrefix = (path: string) => path.replace(new RegExp(`^${STEMN_PIPELINE_ROOT}`, 'g'), '');

  files.forEach((file) => archive.file(file, { name: stripPipelinePrefix(file) }));
  archive.finalize();

  return archive;
};

const upload = (files: string[]) => {

  const source = zipFiles(files);

  const destination = request({
    uri: `http://${STEMN_API_HOST}:${STEMN_API_PORT}/api/v1/pipelines/${STEMN_PIPELINE_ID}`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STEMN_PIPELINE_TOKEN}`,
      'Content-Disposition': `attachment;filename=${STEMN_PIPELINE_ID}.zip`,
      'Content-Type': 'application/zip',
    },
  });

  return new Promise((resolve, reject) => source
    .pipe(destination)
    .on('end', resolve)
    .on('error', reject));
};

module.exports = getFiles().then(upload);