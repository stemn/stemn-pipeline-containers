import { getFiles, upload } from '../src';

void getFiles()
  .then(upload)
  .catch(() => process.exit(3));
