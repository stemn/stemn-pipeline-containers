import { getFiles, upload } from '../src';

void getFiles()
  .then(upload)
  .catch((err) => {
    console.log(err); // tslint:disable-line
    process.exit(3);
  });
