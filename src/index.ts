#!/usr/bin/env node

import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { loadAppConfig } from './config';
import { BrowserbaseClient } from './services/browserbase';
import { StreakClient } from './services/streak';
import { summarizeConfig } from './utils/log';
import { generateStableIdFromString } from './utils/hash';
import { getScraper, listAvailableScrapers } from './scrapers';
import type { JobPosting } from './types';

// Load environment variables
loadEnv();

const program = new Command();

program
  .name('jobscout')
  .description('Job Scout - Automated job search using Browserbase Stagehand and Streak CRM integration')
  .version('1.0.0');

program
  .option('-k, --keywords <keywords>', 'Comma-separated keywords to search for')
  .option('-r, --remote-only', 'Only search for remote jobs')
  .option('-l, --location <location>', 'Preferred location')
  .option('-s, --salary-min <amount>', 'Minimum salary requirement')
  .option('-d, --dry-run', 'Run without creating Streak boxes')
  .option('--list-pipelines', 'List Streak pipelines available for your API key')
  .option('--list-boxes', 'List boxes in the configured pipeline')
  .option('--verify-streak', 'Verify Streak API connectivity and pipeline access')
  .option('--create-test-box', 'Create a test Box in Streak (respects --dry-run)')
  .option('--test-hiringcafe', 'Test Hiring Cafe scraper with mock data')
  .option('--scrape-hiringcafe', 'Scrape Hiring Cafe with real browser automation')
  .option('--source <source>', 'Specific job source to scrape (e.g., hiringcafe)');

program.parse();

const options = program.opts();

const appConfig = loadAppConfig({
  keywords: options.keywords,
  remoteOnly: options.remoteOnly,
  location: options.location,
  salaryMin: options.salaryMin,
  dryRun: options.dryRun,
});

console.log('Job Scout starting...');
console.log('Resolved configuration (redacted):', JSON.stringify(summarizeConfig(appConfig), null, 2));

async function listPipelinesIfRequested() {
  if (!options.listPipelines) return;
  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
  const pipelines = await streak.listPipelines();
  console.log('Streak pipelines:', pipelines);
}

async function verifyStreakIfRequested() {
  if (!options.verifyStreak) return;
  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
  const pipeline = await streak.getPipeline(appConfig.env.streakPipelineKey);
  console.log('Streak pipeline verified:', pipeline);
}

async function listBoxesIfRequested() {
  if (!options.listBoxes) return;
  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
  const boxes = await streak.listBoxesForPipeline(appConfig.env.streakPipelineKey);
  console.log('Streak boxes:', boxes);
}

async function createTestBoxIfRequested() {
  if (!options.createTestBox) return;

  const testJob: JobPosting = {
    id: generateStableIdFromString('test-job:example-corp-devrel'),
    title: 'Example DevRel Engineer',
    company: 'Example Corp',
    location: 'Remote',
    tags: ['devrel', 'ai', 'typescript'],
    url: 'https://example.com/job/devrel-engineer',
    source: 'unknown',
    description: 'This is a test job created by Job Scout to validate Streak box creation.',
    createdAt: new Date().toISOString(),
    salaryUsdMin: 120000,
  };

  if (appConfig.options.dryRun) {
    const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
    const req = streak.buildBoxRequestFromJob(testJob, appConfig.env.streakPipelineKey, appConfig.env.streakDefaultStageKey, appConfig.env.streakFieldKeys);
    console.log('Dry run: would create Streak box with request:', req);
    return;
  }

  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
  const created = await streak.createBox(testJob, appConfig.env.streakPipelineKey, appConfig.env.streakDefaultStageKey, appConfig.env.streakFieldKeys);
  console.log('Created Streak box:', created);
}

async function testHiringCafeIfRequested() {
  if (!options.testHiringcafe) return;

  console.log('Testing Hiring Cafe scraper with mock data...');
  console.log('Available scrapers:', listAvailableScrapers());

  const scraper = getScraper('hiringcafe');
  if (!scraper) {
    console.error('Hiring Cafe scraper not found!');
    return;
  }

  try {
    const jobs = await scraper.scrape(appConfig.options);
    console.log(`Found ${jobs.length} jobs from Hiring Cafe:`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.company} - ${job.title} (${job.location})`);
      console.log(`   URL: ${job.url}`);
      console.log(`   Tags: ${job.tags.join(', ')}`);
      console.log(`   Salary: $${job.salaryUsdMin?.toLocaleString() || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Hiring Cafe scraper test failed:', error);
  }
}

async function scrapeHiringCafeIfRequested() {
  if (!options.scrapeHiringcafe) return;

  console.log('Scraping Hiring Cafe with real browser automation...');
  console.log('Available scrapers:', listAvailableScrapers());

  const scraper = getScraper('hiringcafe');
  if (!scraper) {
    console.error('Hiring Cafe scraper not found!');
    return;
  }

  const browserbase = new BrowserbaseClient(appConfig);
  let session: any = null;
  
  try {
    // Start a real Browserbase session
    session = await browserbase.startSession();
    console.log('Browserbase session established:', session.sessionId);

    // Run the scraper with the real session
    const jobs = await scraper.execute({ 
      input: appConfig.options, 
      session 
    });

    console.log(`Found ${jobs.length} jobs from Hiring Cafe (real scraping):`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.company} - ${job.title} (${job.location})`);
      console.log(`   URL: ${job.url}`);
      console.log(`   Tags: ${job.tags.join(', ')}`);
      console.log(`   Salary: $${job.salaryUsdMin?.toLocaleString() || 'N/A'}`);
      console.log('');
    });

    // Create Streak boxes if not in dry-run mode
    if (!appConfig.options.dryRun && jobs.length > 0) {
      console.log('Creating Streak boxes for found jobs...');
      const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
      
      for (const job of jobs) {
        try {
          const created = await streak.createBox(
            job, 
            appConfig.env.streakPipelineKey, 
            appConfig.env.streakDefaultStageKey, 
            appConfig.env.streakFieldKeys
          );
          console.log(`Created Streak box for ${job.company} - ${job.title}:`, created.name);
        } catch (error) {
          console.error(`Failed to create Streak box for ${job.company} - ${job.title}:`, error);
        }
      }
    } else if (appConfig.options.dryRun && jobs.length > 0) {
      console.log('Dry run mode: would create Streak boxes for found jobs');
      const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
      
      for (const job of jobs) {
        const req = streak.buildBoxRequestFromJob(
          job, 
          appConfig.env.streakPipelineKey, 
          appConfig.env.streakDefaultStageKey, 
          appConfig.env.streakFieldKeys
        );
        console.log(`Would create Streak box for ${job.company} - ${job.title}:`, req);
      }
    }

  } catch (error) {
    console.error('Hiring Cafe real scraping failed:', error);
  } finally {
    // Always close the session if it was created
    if (session) {
      await browserbase.closeSession(session);
      console.log('Browserbase session closed');
    }
  }
}

async function main() {
  await listPipelinesIfRequested();
  await verifyStreakIfRequested();
  await listBoxesIfRequested();
  await createTestBoxIfRequested();
  await testHiringCafeIfRequested();
  await scrapeHiringCafeIfRequested();

  // Only start a basic session if no specific operations were requested
  if (!options.listPipelines && !options.verifyStreak && !options.listBoxes && 
      !options.createTestBox && !options.testHiringcafe && !options.scrapeHiringcafe) {
    const browserbase = new BrowserbaseClient(appConfig);
    const session = await browserbase.startSession();
    console.log('Browserbase session established:', session);
    await browserbase.closeSession(session);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
