import { basename, join } from 'path';

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export function resolveLocalStorageDirSegment(dir: string): string {
  const segment = basename(dir.trim());
  if (segment !== dir.trim() || !SAFE_SEGMENT.test(segment)) {
    throw new Error('Invalid LOCAL_STORAGE_PATH');
  }
  return segment;
}

export function resolveResultsCsvPath(
  cwd: string,
  localStorageDir: string,
  outputFileName: string,
): string {
  const subdir = resolveLocalStorageDirSegment(localStorageDir);
  const name = basename(outputFileName);
  if (name !== outputFileName || !/^[a-zA-Z0-9._-]+\.csv$/.test(name)) {
    throw new Error('Invalid outputFileName');
  }
  return join(cwd, subdir, name);
}
