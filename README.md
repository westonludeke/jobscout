# Job Scout 🎯

Automated job search using Browserbase Stagehand and Streak CRM integration.

## Overview

Job Scout searches multiple job boards (Hiring Cafe, WorkAtAStartup, and YC Jobs) using Browserbase's Stagehand SDK, extracts job listings that match configurable criteria, and creates Boxes in your Streak.com CRM pipeline with the job details.

## Features

- 🔍 **Multi-source job search** across Hiring Cafe, WorkAtAStartup, and YC Jobs
- 🤖 **Browserbase Stagehand automation** for reliable scraping
- 📊 **Streak CRM integration** to track opportunities
- ⚙️ **Configurable search criteria** (keywords, location, salary, remote-only)
- 🔍 **Session replay** for debugging with Browserbase Inspector
- 🚫 **Deduplication** to avoid duplicate entries

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
cp env.example .env
# Edit .env with your API keys
```

4. Build the project:
```bash
npm run build
```

### Usage

```bash
# Basic search
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
- `DEFAULT_KEYWORDS`: Comma-separated default keywords
- `DEFAULT_LOCATION`: Default location preference
- `DEFAULT_SALARY_MIN`: Minimum salary requirement

### CLI Options

- `-k, --keywords <keywords>`: Comma-separated keywords to search for
- `-r, --remote-only`: Only search for remote jobs
- `-l, --location <location>`: Preferred location
- `-s, --salary-min <amount>`: Minimum salary requirement
- `-d, --dry-run`: Run without creating Streak boxes

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
├── config/               # Configuration management
├── services/             # External service integrations
│   ├── browserbase/      # Browserbase Stagehand scripts
│   └── streak/           # Streak CRM API client
├── scrapers/             # Job board scrapers
└── utils/                # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
