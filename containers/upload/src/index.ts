import * as archiver from 'archiver';
import { readJson } from 'fs-extra';
import * as match from 'micromatch';
import fetch from 'node-fetch';
import { join } from 'path';

const {
  STEMN_API_HOST = 'api.stemn',
  STEMN_API_PORT = 3000,
  STEMN_API_PROTOCOL = 'http',
  STEMN_PIPELINE_ID,
  STEMN_PIPELINE_PARAMS_INPUT,
  STEMN_PIPELINE_ROOT = '/pipeline',
  STEMN_PIPELINE_TMP = '/pipeline/.stemn',
  STEMN_PIPELINE_TOKEN,
} = <any> process.env;

export async function getFiles () {

  const changes: string[] = await readJson(join(STEMN_PIPELINE_TMP, 'changes'));

  const inputs = STEMN_PIPELINE_PARAMS_INPUT
    ? JSON.parse(STEMN_PIPELINE_PARAMS_INPUT)
    : '**';

  return match(changes, inputs);
};

export function upload (files: string[]) {
  return fetch(`${STEMN_API_PROTOCOL}://${STEMN_API_HOST}:${STEMN_API_PORT}/api/v1/pipelines/${STEMN_PIPELINE_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STEMN_PIPELINE_TOKEN}`,
      'Content-Disposition': `attachment;filename=${STEMN_PIPELINE_ID}.zip`,
      'Content-Type': 'application/zip',
    },
    body: zipFiles(files),
  });
};

function zipFiles (files: string[]) {

  const archive = archiver('zip', { zlib: { level: 9 } });

  // remove '/pipeline/' prefix from zip file paths
  const stripPipelinePrefix = (path: string) => path.replace(new RegExp(`^${STEMN_PIPELINE_ROOT}/`, 'g'), '');

  console.log('Uploading:\n', files.map(stripPipelinePrefix).join('\n')); // tslint:disable-line

  files.forEach((file) => archive.file(file, { name: stripPipelinePrefix(file) }));
  archive.finalize();

  return archive;
};
