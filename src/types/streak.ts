/**
 * Minimal types for interacting with the Streak API.
 */

export interface StreakBoxCreateRequest {
  /** Display name of the box, e.g., "Acme — Senior DevRel". */
  name: string;
  /** Pipeline key where the box should be created. */
  pipelineKey: string;
  /** Optional stage key. */
  stageKey?: string;
  /** Optional notes/description. */
  notes?: string;
  /** Keyed by Streak field key -> value. */
  fields?: Record<string, unknown>;
}

export interface StreakBox {
  key: string;
  name: string;
  pipelineKey: string;
  stageKey?: string;
  fields?: Record<string, unknown>;
  createdTimestamp: number;
  lastUpdatedTimestamp: number;
}

/**
 * Logical mapping of our domain fields to Streak field keys.
 * The values should be Streak custom field keys configured in the target pipeline.
 */
export interface StreakFieldKeys {
  jobTitle?: string;
  source?: string;
  location?: string;
  website?: string;
}
