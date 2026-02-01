export const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  '.env',
  '.env.local',
  '.env.production',
  '.dev.vars',
  '.DS_Store',
  'dist',
  'build',
  '.wrangler',
  '.hono',
  'Thumbs.db',
  '.idea',
  '.vscode',
];

export const shouldIgnore = (path: string): boolean => {
  const parts = path.split('/');
  return parts.some((part) => IGNORE_PATTERNS.includes(part));
};
