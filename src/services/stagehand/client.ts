import { BrowserSession } from '../browserbase';
import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';

export interface StagehandExtractOptions<T extends z.ZodObject<any>> {
  schema: T;
  instruction: string;
}

export interface StagehandExtractResult<T> {
  data: T;
  success: boolean;
}

export interface StagehandActOptions {
  instruction: string;
}

export interface StagehandActResult {
  success: boolean;
  message: string;
}

export class StagehandClient {
  private session: BrowserSession;
  private stagehand: Stagehand | null = null;
  private initialized = false;

  constructor(session: BrowserSession) {
    this.session = session;
  }

  /**
   * Initialize Stagehand with the Browserbase session
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.session.browserbaseSession) {
      throw new Error('No Browserbase session available for Stagehand');
    }

    try {
      // Initialize Stagehand with the Browserbase session
      this.stagehand = new Stagehand({
        env: 'BROWSERBASE',
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: this.session.browserbaseSession.projectId,
        browserbaseSessionID: this.session.sessionId,
        modelName: 'gpt-4o-mini', // Use a cost-effective model for scraping
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
        },
        verbose: 1, // Enable some logging
        domSettleTimeoutMs: 30000, // 30 second timeout for actions
      });

      // Initialize Stagehand
      await this.stagehand.init();

      this.initialized = true;
      console.log(`[StagehandClient] Initialized with session: ${this.session.sessionId}`);
    } catch (error) {
      console.error(`[StagehandClient] Failed to initialize Stagehand:`, error);
      throw new Error(`Stagehand initialization failed: ${error}`);
    }
  }

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<void> {
    console.log(`[StagehandClient] Navigating to: ${url}`);
    
    await this.initialize();
    
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    try {
      await this.stagehand.page.goto(url);
      console.log(`[StagehandClient] Successfully navigated to: ${url}`);
    } catch (error) {
      console.error(`[StagehandClient] Navigation failed:`, error);
      throw new Error(`Failed to navigate to ${url}: ${error}`);
    }
  }

  /**
   * Extract data from the current page using AI
   */
  async extract<T extends z.ZodObject<any>>(
    options: StagehandExtractOptions<T>
  ): Promise<StagehandExtractResult<z.infer<T>>> {
    console.log(`[StagehandClient] Extracting data with instruction: ${options.instruction}`);
    
    await this.initialize();
    
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    try {
      const result = await this.stagehand.page.extract({
        schema: options.schema as any,
        instruction: options.instruction,
      });

      console.log(`[StagehandClient] Extraction successful`);
      return {
        data: result as z.infer<T>,
        success: true,
      };
    } catch (error) {
      console.error(`[StagehandClient] Extraction failed:`, error);
      throw new Error(`Failed to extract data: ${error}`);
    }
  }

  /**
   * Perform an action on the current page using AI
   */
  async act(options: StagehandActOptions): Promise<StagehandActResult> {
    console.log(`[StagehandClient] Performing action: ${options.instruction}`);
    
    await this.initialize();
    
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    try {
      const result = await this.stagehand.page.act({
        action: options.instruction,
      });

      console.log(`[StagehandClient] Action completed: ${result.message}`);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error(`[StagehandClient] Action failed:`, error);
      throw new Error(`Failed to perform action: ${error}`);
    }
  }

  /**
   * Wait for the page to load
   */
  async waitForLoad(): Promise<void> {
    console.log(`[StagehandClient] Waiting for page to load...`);
    
    await this.initialize();
    
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    try {
      // Use Stagehand's built-in wait functionality
      await this.stagehand.page.act({
        action: 'Wait for the page to fully load and settle',
      });
      
      console.log(`[StagehandClient] Page loaded successfully`);
    } catch (error) {
      console.error(`[StagehandClient] Wait failed:`, error);
      // Don't throw here, as this is often not critical
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(): Promise<string> {
    console.log(`[StagehandClient] Taking screenshot...`);
    
    await this.initialize();
    
    if (!this.stagehand) {
      throw new Error('Stagehand not initialized');
    }

    try {
      // Use Stagehand's observe functionality to get page info
      const observations = await this.stagehand.page.observe();
      
      // For now, return a placeholder since screenshot capture might need additional setup
      console.log(`[StagehandClient] Screenshot placeholder - page has ${observations.length} observations`);
      return 'screenshot-placeholder';
    } catch (error) {
      console.error(`[StagehandClient] Screenshot failed:`, error);
      return 'screenshot-error';
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.stagehand && this.initialized) {
      try {
        await this.stagehand.close();
        console.log(`[StagehandClient] Cleaned up Stagehand resources`);
      } catch (error) {
        console.error(`[StagehandClient] Cleanup failed:`, error);
      }
    }
  }
}
