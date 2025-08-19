/**
 * Job-related domain types for Job Scout.
 */

export type JobSource = 'hiringcafe' | 'workatastartup' | 'ycjobs' | 'unknown';

/**
 * Criteria used to filter and find job postings across sources.
 */
export interface SearchCriteria {
  /** Keywords to match in title/description/tags. */
  keywords: string[];
  /** Restrict to remote-only roles if true. */
  remoteOnly?: boolean;
  /** Preferred location, e.g., "US", "Remote", "Berlin". */
  location?: string;
  /** Minimum salary requirement expressed in USD. */
  minimumSalaryUsd?: number;
}

/**
 * Normalized job posting used throughout the application.
 */
export interface JobPosting {
  /** Stable id, typically a hash of source + canonical url. */
  id: string;
  title: string;
  company: string;
  location: string | null;
  tags: string[];
  /** Canonical URL to the job posting. */
  url: string;
  source: JobSource;
  description: string | null;
  /** ISO timestamp string if available; otherwise set at scrape time. */
  createdAt: string;
  /** Optional salary range in USD. */
  salaryUsdMin?: number;
  salaryUsdMax?: number;
}

/**
 * Result of scraping a single source.
 */
export interface ScrapeResult {
  source: JobSource;
  /** Browserbase session id for replay/inspector. */
  sessionId?: string;
  /** Correlation id for the orchestrated run. */
  runId?: string;
  jobs: JobPosting[];
  /** Non-fatal errors encountered while scraping. */
  errors?: string[];
}
