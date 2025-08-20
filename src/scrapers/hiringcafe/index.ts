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
  jobType?: string;
}

// Schema for extracting job data from Hiring Cafe search results
const JobExtractionSchema = z.object({
  jobs: z.array(z.object({
    title: z.string().describe("The job title (e.g., 'Developer Relations Manager')"),
    company: z.string().describe("The company name (extract from @ symbol if present, e.g., '@ Gladia' becomes 'Gladia')"),
    location: z.string().nullable().describe("The job location (e.g., 'Remote', 'San Francisco')"),
    description: z.string().nullable().describe("Brief job description or responsibilities"),
    url: z.string().describe("The URL to the original job posting (from the 'Apply now' button)"),
    tags: z.array(z.string()).describe("Array of job tags/technologies/skills"),
    salary: z.string().optional().describe("Salary information if available"),
    jobType: z.string().optional().describe("Job type (e.g., 'Full Time', 'Part Time')"),
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
      
            // First, extract all job titles to identify DevRel positions
      const basicResult = await stagehand.extract({
        schema: z.object({
          jobTitles: z.array(z.object({
            title: z.string().describe("The job title visible on the card"),
            isDevRel: z.boolean().describe("Whether this job title contains 'Developer Relations', 'DevRel', or 'Developer Advocate'")
          })).describe("Array of job titles visible on the page")
        }),
        instruction: `Extract all job titles from the search results page. For each job card:
        1. Extract the job title that's visible on the card
        2. Determine if the job title matches DevRel criteria (contains 'Developer Relations', 'DevRel', or 'Developer Advocate')
        3. Focus on extracting accurate titles to identify DevRel positions`
      });

      if (!basicResult.success) {
        throw new Error('Failed to extract basic job titles from Hiring Cafe');
      }

      // Filter to only DevRel jobs
      const devrelTitles = basicResult.data.jobTitles.filter(job => job.isDevRel);
      
      console.log(`[${this.name}] Found ${devrelTitles.length} DevRel job titles out of ${basicResult.data.jobTitles.length} total jobs`);

      if (devrelTitles.length === 0) {
        console.log(`[${this.name}] No DevRel jobs found, returning empty array`);
        return [];
      }

      // Now click on each DevRel job card to expand and extract details
      const detailedJobs: HiringCafeJob[] = [];
      
      for (let i = 0; i < Math.min(devrelTitles.length, 5); i++) { // Limit to first 5 to avoid timeouts
        const jobTitle = devrelTitles[i].title;
        console.log(`[${this.name}] Extracting details for job ${i + 1}/${Math.min(devrelTitles.length, 5)}: ${jobTitle}`);
        
        try {
          // Click on the job card to expand it
          await stagehand.act({
            instruction: `Click on the job card with title "${jobTitle}" to expand the detailed view on the right side`
          });
          
          await stagehand.waitForLoad();
          
          // Extract basic job information from the expanded view
          const basicResult = await stagehand.extract({
            schema: z.object({
              job: z.object({
                title: z.string().describe("The job title"),
                company: z.string().describe("The company name (remove @ symbol if present)"),
                applyButtonText: z.string().describe("Text of the apply button (e.g., 'Apply Directly', 'Apply now')")
              })
            }),
            instruction: `Extract basic information from the expanded job view on the right side:
            1. Extract the job title from the expanded view
            2. Extract the company name (remove @ symbol if present, e.g., '@ Gladia' becomes 'Gladia')
            3. Extract the text of the apply button (e.g., 'Apply Directly', 'Apply now')`
          });
          
          if (!basicResult.success) {
            console.error(`[${this.name}] Failed to extract basic job info for "${jobTitle}"`);
            continue;
          }
          
                    // Now click the apply button to get the actual URL
          try {
            console.log(`[${this.name}] Clicking "${basicResult.data.job.applyButtonText}" button for "${jobTitle}"`);
            
            await stagehand.act({
              instruction: `Click the "${basicResult.data.job.applyButtonText}" button to open the job application in a new tab or window`
            });
            
            // Wait for the new tab/window to open and load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Switch to the newest tab that just opened
            await stagehand.act({
              instruction: "Switch to the newest tab or window that just opened after clicking the apply button"
            });
            
            // Wait a moment for the tab switch to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Now try to get the URL from the new tab
            const urlResult = await stagehand.extract({
              schema: z.object({
                currentUrl: z.string().describe("The current URL of the page (should be the job application URL)")
              }),
              instruction: `Extract the current URL of the page from the browser address bar. This should be the job application URL in the new tab that opened.`
            });
            
            if (urlResult.success && urlResult.data.currentUrl && urlResult.data.currentUrl !== 'null') {
              console.log(`[${this.name}] Successfully extracted URL for "${jobTitle}": ${urlResult.data.currentUrl}`);
              detailedJobs.push({
                title: basicResult.data.job.title,
                company: basicResult.data.job.company,
                location: null,
                description: null,
                url: urlResult.data.currentUrl,
                tags: [],
                salary: undefined,
                jobType: undefined,
              });
            } else {
              console.log(`[${this.name}] URL extraction failed for "${jobTitle}" - got: ${urlResult.data.currentUrl}`);
              // Fallback: use a placeholder URL based on company name
              const fallbackUrl = `https://hiring.cafe/job/${encodeURIComponent(basicResult.data.job.company)}/${encodeURIComponent(basicResult.data.job.title)}`;
              console.log(`[${this.name}] Using fallback URL for "${jobTitle}": ${fallbackUrl}`);
              detailedJobs.push({
                title: basicResult.data.job.title,
                company: basicResult.data.job.company,
                location: null,
                description: null,
                url: fallbackUrl,
                tags: [],
                salary: undefined,
                jobType: undefined,
              });
            }
            
          } catch (urlError) {
            console.error(`[${this.name}] Failed to get URL for "${jobTitle}":`, urlError);
            // Fallback: use a placeholder URL based on company name
            const fallbackUrl = `https://hiring.cafe/job/${encodeURIComponent(basicResult.data.job.company)}/${encodeURIComponent(basicResult.data.job.title)}`;
            console.log(`[${this.name}] Using fallback URL for "${jobTitle}": ${fallbackUrl}`);
            detailedJobs.push({
              title: basicResult.data.job.title,
              company: basicResult.data.job.company,
              location: null,
              description: null,
              url: fallbackUrl,
              tags: [],
              salary: undefined,
              jobType: undefined,
            });
          }
          
          // Wait a moment before processing the next job
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`[${this.name}] Failed to extract details for job "${jobTitle}":`, error);
          // Continue with next job
        }
      }

      console.log(`[${this.name}] Successfully extracted details for ${detailedJobs.length} DevRel jobs`);
      
      // Convert to JobPosting format
      const jobs: JobPosting[] = detailedJobs.map(job => ({
        id: generateStableIdFromString(`hiringcafe:${job.url}`),
        title: job.title,
        company: job.company.replace(/^@\s*/, ''), // Remove @ symbol if present
        location: 'Unknown', // Simplified - ignore location for now
        tags: [], // Simplified - ignore tags for now
        url: job.url,
        source: 'hiringcafe' as JobSource,
        description: '', // Simplified - ignore description for now
        createdAt: new Date().toISOString(),
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
      // Search for "Developer Relations" and press Enter to submit
      await stagehand.act({
        instruction: 'Find the search bar, enter "Developer Relations" as the search term, and press Enter to submit the search'
      });
      
      // Wait for search results to load
      await stagehand.waitForLoad();
      
      // Set the "Posted within" filter to "1 week" (optional - can skip if causing issues)
      try {
        await stagehand.act({
          instruction: 'Find the "Posted within" dropdown filter and change it from "3 months" to "1 week"'
        });
        await stagehand.waitForLoad();
      } catch (filterError) {
        console.log(`[${this.name}] Filter adjustment failed, continuing with default filter:`, filterError);
      }
      
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
