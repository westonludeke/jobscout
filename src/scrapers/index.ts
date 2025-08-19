export * from './hiringcafe';

import { SearchCriteria, JobPosting } from '../types';
import { scrapeHiringCafe } from './hiringcafe';

export interface Scraper {
  name: string;
  scrape: (criteria: SearchCriteria) => Promise<JobPosting[]>;
}

export const SCRAPERS: Record<string, Scraper> = {
  hiringcafe: {
    name: 'Hiring Cafe',
    scrape: scrapeHiringCafe,
  },
  // TODO: Add other scrapers
  // workatastartup: { name: 'WorkAtAStartup', scrape: scrapeWorkAtAStartup },
  // ycjobs: { name: 'YC Jobs', scrape: scrapeYCJobs },
};

export function getScraper(source: string): Scraper | undefined {
  return SCRAPERS[source];
}

export function listAvailableScrapers(): string[] {
  return Object.keys(SCRAPERS);
}
