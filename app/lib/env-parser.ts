export interface EnvVar {
  key: string;
  value: string;
}

const ENV_FILE_NAMES = ['.env', '.env.local', '.env.production', '.env.development', '.dev.vars'];

export const isEnvFile = (name: string): boolean => {
  const basename = name.split('/').pop() || name;
  return ENV_FILE_NAMES.includes(basename) || /^\.env\.\w+$/.test(basename);
};

export const parseEnvFile = (content: string): EnvVar[] => {
  const vars: EnvVar[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) vars.push({ key, value });
  }
  return vars;
};
