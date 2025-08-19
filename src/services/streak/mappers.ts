import { JobPosting } from '../../types';
import { StreakBoxCreateRequest, StreakFieldKeys } from '../../types';

export function buildBoxRequestFromJob(params: {
  job: JobPosting;
  pipelineKey: string;
  fieldKeys?: StreakFieldKeys;
  defaultStageKey?: string;
}): StreakBoxCreateRequest {
  const { job, pipelineKey, fieldKeys, defaultStageKey } = params;

  const name = job.company || job.title;

  const fields: Record<string, unknown> = {};
  if (fieldKeys?.jobTitle) fields[fieldKeys.jobTitle] = job.title;
  if (fieldKeys?.source) fields[fieldKeys.source] = job.source;
  if (fieldKeys?.location && job.location) fields[fieldKeys.location] = job.location;
  if (fieldKeys?.website) fields[fieldKeys.website] = job.url;

  const notes = job.description ?? undefined;

  return {
    name,
    pipelineKey,
    stageKey: defaultStageKey,
    notes,
    fields,
  };
}
