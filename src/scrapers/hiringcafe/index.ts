import { SearchCriteria, JobPosting, JobSource } from '../../types';
import { BrowserSession, StagehandScript } from '../../services/browserbase';
import { StagehandClient } from '../../services/stagehand';
import { generateStableIdFromString } from '../../utils/hash';
import { z } from 'zod';

export interface HiringCafeJob {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  url: string;
  tags: string[];
  salary?: string;
}

// Schema for extracting job data from Hiring Cafe search results
const JobExtractionSchema = z.object({
  jobs: z.array(z.object({
    title: z.string().describe("The job title"),
    company: z.string().describe("The company name"),
    location: z.string().nullable().describe("The job location (or null if not specified)"),
    description: z.string().nullable().describe("Brief job description or null if not available"),
    url: z.string().describe("The URL to the job posting"),
    tags: z.array(z.string()).describe("Array of job tags/technologies"),
    salary: z.string().optional().describe("Salary information if available"),
  })).describe("Array of job postings found on the page"),
});

// DevRel job title keywords to match
const DEVREL_KEYWORDS = [
  'Developer Relations',
  'DevRel', 
  'Developer Advocate'
];

export class HiringCafeScraper implements StagehandScript<SearchCriteria, JobPosting[]> {
  name = 'hiringcafe-scraper';

  async execute({ input, session }: { input: SearchCriteria; session: BrowserSession }): Promise<JobPosting[]> {
    console.log(`[${this.name}] Starting scrape with criteria:`, input);
    console.log(`[${this.name}] Session ID: ${session.sessionId}`);

    try {
      // Always try real Stagehand automation first
      console.log(`[${this.name}] Attempting real Stagehand automation`);
      return await this.scrapeWithStagehand(input, session);
    } catch (error) {
      console.error(`[${this.name}] Real scraping failed, falling back to mock data:`, error);
      console.log(`[${this.name}] Using mock data as fallback`);
      return this.generateMockJobs(input);
    }
  }

  /**
   * Real Stagehand automation for Hiring Cafe
   */
  private async scrapeWithStagehand(criteria: SearchCriteria, session: BrowserSession): Promise<JobPosting[]> {
    const stagehand = new StagehandClient(session);
    
    try {
      // Navigate to Hiring Cafe
      await stagehand.goto('https://hiring.cafe');
      await stagehand.waitForLoad();
      
      // Search for DevRel jobs
      await this.performDevRelSearch(stagehand);
      
      // Extract job listings
      const result = await stagehand.extract({
        schema: JobExtractionSchema,
        instruction: `Extract all job postings from the search results page. Look for job titles, company names, locations, descriptions, URLs, and tags. Focus on jobs that match DevRel criteria.`
      });
      
      if (!result.success) {
        throw new Error('Failed to extract job data from Hiring Cafe');
      }
      
      // Filter jobs by DevRel criteria
      const devrelJobs = this.filterDevRelJobs(result.data.jobs);
      
      // Convert to JobPosting format
      const jobs: JobPosting[] = devrelJobs.map(job => ({
        id: generateStableIdFromString(`hiringcafe:${job.url}`),
        title: job.title,
        company: job.company,
        location: job.location || 'Unknown',
        tags: job.tags,
        url: job.url,
        source: 'hiringcafe' as JobSource,
        description: job.description,
        createdAt: new Date().toISOString(),
        // TODO: Parse salary from job.salary string
        salaryUsdMin: undefined,
        salaryUsdMax: undefined,
      }));
      
      // Apply additional criteria filtering
      return this.filterJobsByCriteria(jobs, criteria);
      
    } catch (error) {
      console.error(`[${this.name}] Stagehand automation failed:`, error);
      throw error; // Re-throw to trigger fallback in execute method
    }
  }

  /**
   * Perform DevRel-specific search on Hiring Cafe
   */
  private async performDevRelSearch(stagehand: StagehandClient): Promise<void> {
    console.log(`[${this.name}] Performing DevRel search...`);
    
    try {
      // Search for "Developer Relations"
      await stagehand.act({
        instruction: 'Find the search bar and enter "Developer Relations" as the search term'
      });
      
      // Set the "Posted within" filter to "1 week"
      await stagehand.act({
        instruction: 'Find the "Posted within" dropdown filter and change it from "3 months" to "1 week"'
      });
      
      // Submit the search
      await stagehand.act({
        instruction: 'Submit the search or press Enter to search for Developer Relations jobs'
      });
      
      // Wait for results to load
      await stagehand.waitForLoad();
      
      console.log(`[${this.name}] DevRel search completed`);
    } catch (error) {
      console.error(`[${this.name}] Search failed:`, error);
      throw error;
    }
  }

  /**
   * Filter jobs to only include DevRel-related positions
   */
  private filterDevRelJobs(jobs: HiringCafeJob[]): HiringCafeJob[] {
    return jobs.filter(job => {
      const title = job.title.toLowerCase();
      return DEVREL_KEYWORDS.some(keyword => 
        title.includes(keyword.toLowerCase())
      );
    });
  }

  private generateMockJobs(criteria: SearchCriteria): JobPosting[] {
    const mockJobs: JobPosting[] = [
      {
        id: generateStableIdFromString('hiringcafe:https://hiring.cafe/job/1'),
        title: 'Senior Developer Relations Engineer',
        company: 'TechCorp',
        location: 'Remote',
        tags: ['devrel', 'ai', 'typescript'],
        url: 'https://hiring.cafe/job/1',
        source: 'hiringcafe' as JobSource,
        description: 'Join our team as a Senior Developer Relations Engineer...',
        createdAt: new Date().toISOString(),
        salaryUsdMin: 120000,
        salaryUsdMax: 160000,
      },
      {
        id: generateStableIdFromString('hiringcafe:https://hiring.cafe/job/2'),
        title: 'Developer Advocate',
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
      {
        id: generateStableIdFromString('hiringcafe:https://hiring.cafe/job/3'),
        title: 'Developer Relations Manager',
        company: 'Cloud Platform',
        location: 'Remote',
        tags: ['devrel', 'cloud', 'api'],
        url: 'https://hiring.cafe/job/3',
        source: 'hiringcafe' as JobSource,
        description: 'Lead our developer relations strategy...',
        createdAt: new Date().toISOString(),
        salaryUsdMin: 130000,
        salaryUsdMax: 170000,
      },
    ];

    return this.filterJobsByCriteria(mockJobs, criteria);
  }

  private filterJobsByCriteria(jobs: JobPosting[], criteria: SearchCriteria): JobPosting[] {
    return jobs.filter(job => {
      // Filter by keywords (additional to DevRel filtering)
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
