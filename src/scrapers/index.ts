export * from './hiringcafe';

import { SearchCriteria, JobPosting } from '../types';
import { HiringCafeScraper } from './hiringcafe';

import { BrowserSession } from '../services/browserbase';

export interface Scraper {
  name: string;
  scrape: (criteria: SearchCriteria, session?: BrowserSession) => Promise<JobPosting[]>;
}

export const SCRAPERS: Record<string, Scraper> = {
  hiringcafe: {
    name: 'Hiring Cafe',
    scrape: async (criteria: SearchCriteria, session?: BrowserSession) => {
      const scraper = new HiringCafeScraper();
      const sessionToUse = session || {
        sessionId: 'mock-session',
        alias: 'mock-alias',
        runId: 'mock-run',
        browserbaseSession: null,
      };
      return scraper.execute({ input: criteria, session: sessionToUse });
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
