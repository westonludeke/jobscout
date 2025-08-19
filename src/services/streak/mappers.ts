import { JobPosting } from '../../types';
import { StreakBoxCreateRequest, StreakFieldKeys } from '../../types';

// Location dropdown mappings (field 1001)
const LOCATION_MAPPINGS: Record<string, string> = {
  'remote': '9007',
  'Remote': '9007',
  'REMOTE': '9007',
  'semi-remote': '9009',
  'Semi-remote': '9009',
  'SEMI-REMOTE': '9009',
  'austin': '9001',
  'Austin': '9001',
  'dallas': '9002',
  'Dallas': '9002',
  'houston': '9003',
  'Houston': '9003',
  'los angeles': '9004',
  'Los Angeles': '9004',
  'LA': '9004',
  'mexico city': '9005',
  'Mexico City': '9005',
  'nyc': '9006',
  'NYC': '9006',
  'new york city': '9011',
  'New York City': '9011',
  'san francisco': '9008',
  'San Francisco': '9008',
  'sf': '9010',
  'SF': '9010',
  'phoenix': '9012',
  'Phoenix': '9012',
  'mountain view': '9013',
  'Mountain View': '9013',
};

// Source tag mappings (field 1002)
const SOURCE_MAPPINGS: Record<string, string> = {
  'hiringcafe': '9011',
  'HiringCafe': '9011',
  'HIRINGCAFE': '9011',
  'workatastartup': '9014',
  'WorkAtAStartup': '9014',
  'WORKATASTARTUP': '9014',
  'ycjobs': '9035',
  'YC Jobs': '9035',
  'Y Combinator': '9035',
  'unknown': '9036',
  'Unknown': '9036',
};

function mapLocationToDropdownKey(location: string | null): string | undefined {
  if (!location) return undefined;
  
  // Direct match
  if (LOCATION_MAPPINGS[location]) {
    return LOCATION_MAPPINGS[location];
  }
  
  // Case-insensitive match
  const lowerLocation = location.toLowerCase();
  for (const [key, value] of Object.entries(LOCATION_MAPPINGS)) {
    if (key.toLowerCase() === lowerLocation) {
      return value;
    }
  }
  
  // Default to "Unknown" if no match found
  return '9014';
}

function mapSourceToTagKey(source: string): string {
  // Direct match
  if (SOURCE_MAPPINGS[source]) {
    return SOURCE_MAPPINGS[source];
  }
  
  // Case-insensitive match
  const lowerSource = source.toLowerCase();
  for (const [key, value] of Object.entries(SOURCE_MAPPINGS)) {
    if (key.toLowerCase() === lowerSource) {
      return value;
    }
  }
  
  // Default to "Unknown" if no match found
  return '9036';
}

export function buildBoxRequestFromJob(params: {
  job: JobPosting;
  pipelineKey: string;
  fieldKeys?: StreakFieldKeys;
  defaultStageKey?: string;
}): StreakBoxCreateRequest {
  const { job, pipelineKey, fieldKeys, defaultStageKey } = params;

  const name = job.company || job.title;

  const fields: Record<string, unknown> = {};
  
  if (fieldKeys?.jobTitle) {
    fields[fieldKeys.jobTitle] = job.title;
  }
  
  if (fieldKeys?.source) {
    const sourceKey = mapSourceToTagKey(job.source);
    fields[fieldKeys.source] = sourceKey;
  }
  
  if (fieldKeys?.location && job.location) {
    const locationKey = mapLocationToDropdownKey(job.location);
    if (locationKey) {
      fields[fieldKeys.location] = locationKey;
    }
  }
  
  if (fieldKeys?.website) {
    fields[fieldKeys.website] = job.url;
  }

  const notes = job.description ?? undefined;

  return {
    name,
    pipelineKey,
    stageKey: defaultStageKey,
    notes,
    fields,
  };
}
