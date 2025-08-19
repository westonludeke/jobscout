# Job Scout 🎯

Automated job search using Browserbase Stagehand and Streak CRM integration.

## Overview

Job Scout searches multiple job boards (Hiring Cafe, WorkAtAStartup, and YC Jobs) using Browserbase's Stagehand SDK, extracts job listings that match configurable criteria, and creates Boxes in your Streak.com CRM pipeline with the job details.

## Features

- 🔍 **Multi-source job search** across Hiring Cafe, WorkAtAStartup, and YC Jobs
- 🤖 **Browserbase Stagehand automation** for reliable scraping
- 📊 **Streak CRM integration** to track opportunities with field mapping
- ⚙️ **Configurable search criteria** (keywords, location, salary, remote-only)
- 🔍 **Session replay** for debugging with Browserbase Inspector
- 🚫 **Deduplication** to avoid duplicate entries
- 🧪 **Testing tools** for API connectivity and box creation

## Quick Start

### Prerequisites

- Node.js 18+ 
- Browserbase API key
- Streak CRM API key and pipeline key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd jobscout
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and field mappings
```

4. Test your setup:
```bash
# Verify Streak connectivity
npm run dev -- --verify-streak

# List available pipelines
npm run dev -- --list-pipelines

# Test box creation (dry run)
npm run dev -- --create-test-box --dry-run
```

5. Build the project:
```bash
npm run build
```

### Usage

```bash
# Basic search (when scrapers are implemented)
npm start -- --keywords="devrel,ai"

# Remote-only search with location filter
npm start -- --keywords="typescript,react" --remote-only --location="US"

# Dry run (no Streak boxes created)
npm start -- --keywords="python" --dry-run
```

## Configuration

### Environment Variables

- `BROWSERBASE_API_KEY`: Your Browserbase API key
- `STREAK_API_KEY`: Your Streak CRM API key  
- `STREAK_PIPELINE_KEY`: Your Streak pipeline key
- `STREAK_DEFAULT_STAGE_KEY`: Default stage for new boxes
- `STREAK_FIELD_JOB_TITLE`: Custom field key for job title
- `STREAK_FIELD_SOURCE`: Custom field key for source
- `STREAK_FIELD_LOCATION`: Custom field key for location
- `STREAK_FIELD_WEBSITE`: Custom field key for website
- `DEFAULT_KEYWORDS`: Comma-separated default keywords
- `DEFAULT_LOCATION`: Default location preference
- `DEFAULT_SALARY_MIN`: Minimum salary requirement

### CLI Options

- `-k, --keywords <keywords>`: Comma-separated keywords to search for
- `-r, --remote-only`: Only search for remote jobs
- `-l, --location <location>`: Preferred location
- `-s, --salary-min <amount>`: Minimum salary requirement
- `-d, --dry-run`: Run without creating Streak boxes
- `--list-pipelines`: List available Streak pipelines
- `--verify-streak`: Test Streak API connectivity
- `--create-test-box`: Create a test box in Streak

## Streak Integration

Job Scout creates Streak boxes with intelligent field mapping:

- **Box Name**: Company name (e.g., "Mozilla", "Microsoft")
- **Job Title**: Full job title in custom field
- **Source**: Mapped to pipeline tags (HiringCafe → 9011, WorkAtAStartup → 9014, etc.)
- **Location**: Mapped to dropdown options (Remote → 9007, Austin → 9001, etc.)
- **Website**: Direct link to job posting

The system automatically maps job locations and sources to the correct dropdown/tag keys in your Streak pipeline.

## Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
src/
├── index.ts              # Main CLI entry point
├── types/                # TypeScript type definitions
├── config/               # Configuration management with zod validation
├── services/             # External service integrations
│   ├── browserbase/      # Browserbase Stagehand client (scaffold)
│   └── streak/           # Streak CRM API client (working)
├── scrapers/             # Job board scrapers (TODO)
└── utils/                # Utility functions (logging, hashing)
```

## Current Status

### ✅ Completed
- Project foundation with TypeScript and CLI
- Streak API v2 integration with field mapping
- Job posting data model and types
- Configuration validation with zod
- Testing tools for API connectivity

### 🚧 In Progress
- Browserbase SDK integration
- First scraper implementation

### 📋 TODO
- Implement job board scrapers (Hiring Cafe, WorkAtAStartup, YC Jobs)
- Add Browserbase Stagehand automation scripts
- Add orchestration logic to run scrapers and create boxes
- Add deduplication and persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
