export function maskKey(value: string, visible: number = 4): string {
  const v = value ?? '';
  if (v.length <= visible) return '*'.repeat(v.length);
  return `${'*'.repeat(Math.max(0, v.length - visible))}${v.slice(-visible)}`;
}

export function summarizeConfig(config: {
  env: {
    browserbaseApiKey: string;
    streakApiKey: string;
    streakPipelineKey: string;
    streakDefaultStageKey?: string;
    streakFieldKeys?: Record<string, string | undefined>;
  };
  options: unknown;
}) {
  const { env, options } = config;
  const summary = {
    env: {
      browserbaseApiKey: maskKey(env.browserbaseApiKey),
      streakApiKey: maskKey(env.streakApiKey),
      streakPipelineKey: maskKey(env.streakPipelineKey),
      streakDefaultStageKey: env.streakDefaultStageKey,
      streakFieldKeys: env.streakFieldKeys,
    },
    options,
  };
  return summary;
}
