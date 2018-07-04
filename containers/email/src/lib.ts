import * as walk from 'klaw';
import * as match from 'micromatch';
import { join } from 'path';

/**
 * Generate array of all filepaths below root
 */
export function collectPaths (root: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const paths: string[] = [];
    walk(root)
      .on('error', (err: Error) => reject(err))
      .on('data', (path: string) => paths.push(path))
      .on('end', () => resolve(paths));
  });
}

/**
 * Expand globs relative to a root directory
 */
export function matchAttachmentGlobs (globs: string[], root: string) {
  const absoluteGlobs = globs.map((glob: string) => join(root, glob));
  const matchGlobs = (paths: string[]) => match(paths, absoluteGlobs);

  return collectPaths(root).then(matchGlobs);
}