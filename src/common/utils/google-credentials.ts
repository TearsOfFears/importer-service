import { readFileSync } from 'fs';
import { resolve } from 'path';
import { GOOGLE_CREDENTIALS_PATH } from '../constants/constant';

export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export function loadServiceAccountCredentials(): ServiceAccountCredentials {
  const pathEnv = GOOGLE_CREDENTIALS_PATH;

  let raw: string;
  if (pathEnv) {
    raw = readFileSync(resolve(pathEnv), 'utf8');
  } else {
    throw new Error(
      'Set GOOGLE_CREDENTIALS_PATH (path to service account JSON) or GOOGLE_CREDENTIALS_JSON',
    );
  }
  const parsed = JSON.parse(raw) as ServiceAccountCredentials;
  if (parsed.private_key && typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}
