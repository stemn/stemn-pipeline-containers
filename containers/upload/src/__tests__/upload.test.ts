import { readJson } from 'fs-extra';

import { getFiles } from '..';

jest.mock('fs-extra');

describe('File upload functionality', () => {

  it('returns changes listed in the /pipeline/.stemn/changes file', async () => {

    const changes = [
      '/pipeline/readme.md',
      '/pipeline/input.txt',
    ];

    readJson.mockResolvedValue(changes);

    const changedFiles = await getFiles();
    expect(changedFiles).toMatchObject(changes);
  });

});
