import crypto from 'crypto';

export function generateStableIdFromString(input: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex').slice(0, 32);
}
