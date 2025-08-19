import { SearchCriteria, JobPosting, JobSource } from '../../types';
import { BrowserSession, StagehandScript } from '../../services/browserbase';
import { generateStableIdFromString } from '../../utils/hash';

export interface HiringCafeJob {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  url: string;
  tags: string[];
  salary?: string;
}

export class HiringCafeScraper implements StagehandScript<SearchCriteria, JobPosting[]> {
  name = 'hiringcafe-scraper';

  async execute({ input, session }: { input: SearchCriteria; session: BrowserSession }): Promise<JobPosting[]> {
    console.log(`[${this.name}] Starting scrape with criteria:`, input);
    console.log(`[${this.name}] Session ID: ${session.sessionId}`);

    try {
      // TODO: Implement actual browser automation with Stagehand
      // For now, return mock data to test the integration
      const mockJobs = this.generateMockJobs(input);
      
      console.log(`[${this.name}] Found ${mockJobs.length} jobs`);
      return mockJobs;
    } catch (error) {
      console.error(`[${this.name}] Scraping failed:`, error);
      throw error;
    }
  }

  private generateMockJobs(criteria: SearchCriteria): JobPosting[] {
    const mockJobs: JobPosting[] = [
      {
        id: generateStableIdFromString('hiringcafe:https://hiring.cafe/job/1'),
        title: 'Senior DevRel Engineer',
        company: 'TechCorp',
        location: 'Remote',
        tags: ['devrel', 'ai', 'typescript'],
        url: 'https://hiring.cafe/job/1',
        source: 'hiringcafe' as JobSource,
        description: 'Join our team as a Senior DevRel Engineer...',
        createdAt: new Date().toISOString(),
        salaryUsdMin: 120000,
        salaryUsdMax: 160000,
      },
      {
        id: generateStableIdFromString('hiringcafe:https://hiring.cafe/job/2'),
        title: 'AI Developer Advocate',
        company: 'AI Startup',
        location: 'San Francisco',
        tags: ['devrel', 'ai', 'python'],
        url: 'https://hiring.cafe/job/2',
        source: 'hiringcafe' as JobSource,
        description: 'Help developers build amazing AI applications...',
        createdAt: new Date().toISOString(),
        salaryUsdMin: 100000,
        salaryUsdMax: 140000,
      },
    ];

    // Filter by criteria
    return mockJobs.filter(job => {
      // Filter by keywords
      if (criteria.keywords.length > 0) {
        const jobText = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
        const hasKeyword = criteria.keywords.some(keyword => 
          jobText.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      // Filter by remote-only
      if (criteria.remoteOnly && job.location !== 'Remote') {
        return false;
      }

      // Filter by location
      if (criteria.location && job.location) {
        const jobLocation = job.location.toLowerCase();
        const targetLocation = criteria.location.toLowerCase();
        if (!jobLocation.includes(targetLocation) && targetLocation !== 'remote') {
          return false;
        }
      }

      // Filter by minimum salary
      if (criteria.minimumSalaryUsd && job.salaryUsdMin) {
        if (job.salaryUsdMin < criteria.minimumSalaryUsd) {
          return false;
        }
      }

      return true;
    });
  }
}

export async function scrapeHiringCafe(criteria: SearchCriteria): Promise<JobPosting[]> {
  const scraper = new HiringCafeScraper();
  // Note: This will be called with a real session when integrated with the orchestrator
  const mockSession: BrowserSession = {
    sessionId: 'mock-session',
    alias: 'mock-alias',
    runId: 'mock-run',
    browserbaseSession: null,
  };
  
  return scraper.execute({ input: criteria, session: mockSession });
}
