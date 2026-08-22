import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  DISCORD_TOKEN: requireEnv('DISCORD_TOKEN'),
  DISCORD_CLIENT_ID: requireEnv('DISCORD_CLIENT_ID'),
  DISCORD_GUILD_ID: requireEnv('DISCORD_GUILD_ID'),
  SUPABASE_URL: requireEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('SUPABASE_ANON_KEY'),
  HF_TOKEN: requireEnv('HF_TOKEN'),
  HF_REPO: optionalEnv('HF_REPO', 'dobietdc/bot-artwork'),
  HF_ARTWORK_URL: optionalEnv(
    'HF_ARTWORK_URL',
    'https://huggingface.co/datasets/dobietdc/bot-artwork/resolve/main'
  ),
} as const;
