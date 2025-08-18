#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';

// Load environment variables
config();

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

console.log('Job Scout starting...');
console.log('Options:', options);

// TODO: Implement job search logic
console.log('Job search functionality coming soon!');
