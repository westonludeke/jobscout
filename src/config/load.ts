import { z } from 'zod';
import { AppConfig, EnvironmentConfig, JobSource, RuntimeOptions } from '../types';

const jobSourcesAll: JobSource[] = ['hiringcafe', 'workatastartup', 'ycjobs'];

const EnvSchema = z.object({
  BROWSERBASE_API_KEY: z.string().min(1, 'BROWSERBASE_API_KEY is required'),
  STREAK_API_KEY: z.string().min(1, 'STREAK_API_KEY is required'),
  STREAK_PIPELINE_KEY: z.string().min(1, 'STREAK_PIPELINE_KEY is required'),
  DEFAULT_KEYWORDS: z.string().optional(),
  DEFAULT_LOCATION: z.string().optional(),
  DEFAULT_SALARY_MIN: z.string().optional(),
});

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseNumber(value?: string | number): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export interface CliArgsInput {
  keywords?: string | string[];
  remoteOnly?: boolean;
  location?: string;
  salaryMin?: string | number;
  dryRun?: boolean;
  sources?: JobSource[];
}

export function loadAppConfig(cli: CliArgsInput): AppConfig {
  const parsedEnv = EnvSchema.safeParse(process.env);
  if (!parsedEnv.success) {
    const message = parsedEnv.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${message}`);
  }

  const envRaw = parsedEnv.data;

  const env: EnvironmentConfig = {
    browserbaseApiKey: envRaw.BROWSERBASE_API_KEY,
    streakApiKey: envRaw.STREAK_API_KEY,
    streakPipelineKey: envRaw.STREAK_PIPELINE_KEY,
  };

  const keywordsFromCli = Array.isArray(cli.keywords) ? cli.keywords : parseCsv(cli.keywords);
  const defaultKeywords = parseCsv(envRaw.DEFAULT_KEYWORDS);

  const runtime: RuntimeOptions = {
    keywords: keywordsFromCli.length > 0 ? keywordsFromCli : defaultKeywords,
    remoteOnly: cli.remoteOnly ?? false,
    location: cli.location ?? envRaw.DEFAULT_LOCATION,
    minimumSalaryUsd: parseNumber(cli.salaryMin) ?? parseNumber(envRaw.DEFAULT_SALARY_MIN),
    dryRun: cli.dryRun ?? false,
    sources: (cli.sources && cli.sources.length > 0 ? cli.sources : jobSourcesAll),
  };

  return { env, options: runtime };
}
