# Job Scout 🎯

Automated job search using Browserbase Stagehand and Streak CRM integration.

## Overview

Job Scout searches multiple job boards (Hiring Cafe, WorkAtAStartup, and YC Jobs) using Browserbase's Stagehand SDK, extracts job listings that match configurable criteria, and creates Boxes in your Streak.com CRM pipeline with the job details.

## Features

- 🔍 **Multi-source job search** across Hiring Cafe, WorkAtAStartup, and YC Jobs
- 🤖 **AI-powered browser automation** using OpenAI GPT-4o-mini with Browserbase Stagehand
- 📊 **Streak CRM integration** to track opportunities with field mapping
- ⚙️ **Configurable search criteria** (keywords, location, salary, remote-only)
- 🔍 **Session replay** for debugging with Browserbase Inspector
- 🚫 **Deduplication** to avoid duplicate entries
- 🧪 **Testing tools** for API connectivity and box creation
- 🧠 **Intelligent data extraction** with natural language instructions

## Quick Start

### Prerequisites

- Node.js 18+ 
- Browserbase API key
- Streak CRM API key and pipeline key
- OpenAI API key (for AI-powered browser automation)

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
# Required: BROWSERBASE_API_KEY, STREAK_API_KEY, OPENAI_API_KEY
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

#### Required API Keys
- `BROWSERBASE_API_KEY`: Your Browserbase API key for browser automation
- `STREAK_API_KEY`: Your Streak CRM API key  
- `OPENAI_API_KEY`: Your OpenAI API key for AI-powered browser automation

#### Streak CRM Configuration
- `STREAK_PIPELINE_KEY`: Your Streak pipeline key
- `STREAK_DEFAULT_STAGE_KEY`: Default stage for new boxes
- `STREAK_FIELD_JOB_TITLE`: Custom field key for job title
- `STREAK_FIELD_SOURCE`: Custom field key for source
- `STREAK_FIELD_LOCATION`: Custom field key for location
- `STREAK_FIELD_WEBSITE`: Custom field key for website

#### Search Configuration
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

## AI-Powered Browser Automation

Job Scout leverages **OpenAI GPT-4o-mini** through Browserbase's Stagehand SDK to provide intelligent, natural language-driven web automation:

### 🤖 How It Works
- **Natural Language Instructions**: The AI agent receives human-like instructions like "Click the 'Apply Directly' button" or "Extract the company name from this job card"
- **Intelligent Navigation**: Automatically handles complex web interactions, form filling, and multi-tab management
- **Adaptive Data Extraction**: Uses AI to understand and extract structured data from dynamic web content
- **Error Recovery**: Intelligently handles UI changes and unexpected page layouts

### 🧠 Key AI Features
- **Smart Tab Management**: Automatically switches to newly opened tabs to extract job application URLs
- **Context-Aware Extraction**: Understands job posting layouts and extracts relevant information
- **Natural Language Processing**: Processes job titles and descriptions to identify relevant opportunities
- **Intelligent Filtering**: Uses AI to match job postings against search criteria

### 🔧 Technical Implementation
```typescript
// Example: AI-powered job data extraction
const jobData = await stagehand.extract({
  schema: z.object({
    title: z.string().describe("The job title"),
    company: z.string().describe("The company name"),
    url: z.string().describe("The job application URL")
  }),
  instruction: "Extract the job title, company name, and application URL from this job posting"
});
```

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
│   ├── browserbase/      # Browserbase SDK client with session management
│   ├── stagehand/        # AI-powered browser automation client
│   └── streak/           # Streak CRM API client with field mapping
├── scrapers/             # Job board scrapers
│   └── hiringcafe/       # Hiring Cafe scraper with AI automation
└── utils/                # Utility functions (logging, hashing, ID generation)
```

## Current Status

### ✅ Completed
- Project foundation with TypeScript and CLI
- **AI-powered browser automation** with OpenAI GPT-4o-mini and Browserbase Stagehand
- Streak API v2 integration with field mapping
- Job posting data model and types
- Configuration validation with zod
- Testing tools for API connectivity
- **Hiring Cafe scraper** with intelligent tab management and URL extraction
- **End-to-end workflow** from job search to Streak box creation

### ⏸️ Paused (Browserbase Plan Limit)
- Real browser automation testing (plan limit reached)
- Additional job source implementation

### 📋 TODO (When Plan Resets)
- Implement WorkAtAStartup and YC Jobs scrapers
- Add deduplication and local caching
- Enhanced logging with screenshots and HTML snippets
- Multi-source orchestration and parallel processing

## Technology Stack

### 🤖 AI & Automation
- **OpenAI GPT-4o-mini**: AI model for natural language browser automation
- **Browserbase Stagehand**: AI-powered web automation SDK
- **Natural Language Processing**: Intelligent data extraction and filtering

### 🛠️ Backend & Infrastructure
- **Node.js 18+**: Runtime environment
- **TypeScript**: Type-safe development with strict mode
- **Zod**: Runtime type validation and schema definition
- **Commander.js**: CLI framework with comprehensive options

### 🔗 External Integrations
- **Browserbase API**: Headless browser automation and session management
- **Streak CRM API v2**: Customer relationship management integration
- **OpenAI API**: AI model access for intelligent automation

### 📊 Data & Storage
- **Structured Job Data**: Normalized job posting schema
- **Field Mapping**: Intelligent CRM field mapping with dropdown/tag support
- **Session Management**: Browser session lifecycle and replay capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
