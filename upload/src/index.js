import fs from 'fs-extra';
import match from 'micromatch';
import path from 'path';

export const {
  STEMN_API_HOST = 'stemn.com',
  STEMN_API_PORT = 80,
  STEMN_PIPELINE_ID,
  STEMN_PIPELINE_PARAMS_INPUT,
  STEMN_PIPELINE_ROOT = '/pipeline',
  STEMN_PIPELINE_TMP = '/pipeline/.stemn',
  STEMN_PIPELINE_TOKEN,
} = process.env;

const pipeStream = ({ source, destination }) => new Promise((resolve, reject) => source
  .pipe(destination)
  .on('end', resolve)
  .on('error', reject));

const getFiles = () => {
  return fs.readJson(path.join(STEMN_PIPELINE_TMP, 'changes')).then((changes) => {
    const inputs = JSON.parse(STEMN_PIPELINE_PARAMS_INPUT);
    return match(changes, inputs);
  });
};

const zipFiles = (files) => {

  const archive = archiver('zip', { zlib: { level: 9 } });

  files.forEach((name) => {
    const filePath = path.join(STEMN_PIPELINE_ROOT, name);
    archive.append(fs.createReadStream(filePath), { name });
  });

  archive.directory();
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
