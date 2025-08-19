#!/usr/bin/env node

import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { loadAppConfig } from './config';
import { BrowserbaseClient } from './services/browserbase';

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
  .option('-d, --dry-run', 'Run without creating Streak boxes');

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
console.log('Resolved configuration:', JSON.stringify(appConfig, null, 2));

async function main() {
  const browserbase = new BrowserbaseClient(appConfig);
  const session = await browserbase.startSession();
  console.log('Browserbase session established:', session);
  await browserbase.closeSession(session);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
