#!/usr/bin/env node

import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { loadAppConfig } from './config';
import { BrowserbaseClient } from './services/browserbase';
import { StreakClient, buildBoxRequestFromJob } from './services/streak';
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
  .option('--test-hiringcafe', 'Test Hiring Cafe scraper with mock data');

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

async function listBoxesIfRequested() {
  if (!options.listBoxes) return;
  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
  const boxes = await streak.listBoxesForPipeline(appConfig.env.streakPipelineKey);
  console.log('Streak boxes:', boxes);
}

async function verifyStreakIfRequested() {
  if (!options.verifyStreak) return;
  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });
  const pipeline = await streak.getPipeline(appConfig.env.streakPipelineKey);
  console.log('Streak pipeline verified:', pipeline);
}

async function createTestBoxIfRequested() {
  if (!options.createTestBox) return;
  const streak = new StreakClient({ apiKey: appConfig.env.streakApiKey });

  const job: JobPosting = {
    id: generateStableIdFromString('test://jobscout/example').slice(0, 16),
    title: 'Example DevRel Engineer',
    company: 'Example Corp',
    location: 'Remote',
    tags: ['devrel', 'typescript'],
    url: 'https://example.com/job/devrel-engineer',
    source: 'unknown',
    description: 'This is a test job created by Job Scout to validate Streak box creation.',
    createdAt: new Date().toISOString(),
    salaryUsdMin: 100000,
    salaryUsdMax: 140000,
  };

  const boxReq = buildBoxRequestFromJob({
    job,
    pipelineKey: appConfig.env.streakPipelineKey,
    defaultStageKey: appConfig.env.streakDefaultStageKey,
    fieldKeys: appConfig.env.streakFieldKeys,
  });

  if (appConfig.options.dryRun) {
    console.log('Dry run: would create Streak box with request:', boxReq);
    return;
  }

  const created = await streak.createBox(boxReq);
  console.log('Created Streak box:', created);
}

async function testHiringCafeIfRequested() {
  if (!options.testHiringcafe) return;
  
  console.log('Testing Hiring Cafe scraper...');
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

async function main() {
  await listPipelinesIfRequested();
  await verifyStreakIfRequested();
  await listBoxesIfRequested();
  await createTestBoxIfRequested();
  await testHiringCafeIfRequested();

  const browserbase = new BrowserbaseClient(appConfig);
  const session = await browserbase.startSession();
  console.log('Browserbase session established:', session);
  await browserbase.closeSession(session);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
