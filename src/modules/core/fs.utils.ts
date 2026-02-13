import fs from 'fs';
import path from 'path';

/**
 * Ensure a directory exist. If the directory is absent, create it.
 * @param dirPath Directory being checked.
 * @returns Absolute directory path.
 */
export function ensureDir(dirPath: string): string {
  const absolute = path.resolve(dirPath);
  if (!fs.existsSync(absolute)) {
    fs.mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}