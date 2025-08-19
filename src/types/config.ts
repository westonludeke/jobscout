import type { JobSource, SearchCriteria } from './job';
import type { StreakFieldKeys } from './streak';

/**
 * Environment variables required by the application.
 */
export interface EnvironmentConfig {
  browserbaseApiKey: string;
  streakApiKey: string;
  streakPipelineKey: string;
  streakDefaultStageKey?: string;
  streakFieldKeys?: StreakFieldKeys;
}

/**
 * Runtime options provided via CLI flags or defaults.
 */
export interface RuntimeOptions extends SearchCriteria {
  /** If true, skip creating Streak boxes and just log. */
  dryRun?: boolean;
  /** Which sources to enable for this run. */
  sources?: JobSource[];
}

/**
 * Full application configuration resolved at startup.
 */
export interface AppConfig {
  env: EnvironmentConfig;
  options: RuntimeOptions;
}
