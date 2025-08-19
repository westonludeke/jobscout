export * from './hiringcafe';

import { SearchCriteria, JobPosting } from '../types';
import { HiringCafeScraper } from './hiringcafe';

export interface Scraper {
  name: string;
  scrape: (criteria: SearchCriteria) => Promise<JobPosting[]>;
}

export const SCRAPERS: Record<string, Scraper> = {
  hiringcafe: {
    name: 'Hiring Cafe',
    scrape: async (criteria: SearchCriteria) => {
      const scraper = new HiringCafeScraper();
      const mockSession = {
        sessionId: 'mock-session',
        alias: 'mock-alias',
        runId: 'mock-run',
        browserbaseSession: null,
      };
      return scraper.execute({ input: criteria, session: mockSession });
    },
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
