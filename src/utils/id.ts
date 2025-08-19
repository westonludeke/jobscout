import crypto from 'crypto';

export function generateRunId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function generateSessionAlias(): string {
  const adjectives = ['brisk', 'calm', 'eager', 'keen', 'lively', 'swift'];
  const nouns = ['falcon', 'otter', 'lynx', 'sparrow', 'orca', 'puma'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}-${Math.floor(Math.random() * 1000)}`;
}
