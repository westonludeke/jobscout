import Browserbase from '@browserbasehq/sdk';
import { AppConfig } from '../../types';
import { generateRunId, generateSessionAlias } from '../../utils/id';

export interface BrowserSession {
  /** Provider session ID used for replay/inspector. */
  sessionId: string;
  /** Human-friendly alias for this session (for logs). */
  alias: string;
  /** Correlation ID for an orchestrated run. */
  runId: string;
  /** Browserbase session instance. */
  browserbaseSession: any;
}

export interface StagehandScript<Input, Output> {
  /** Unique name of the script for logging/metrics. */
  name: string;
  /**
   * Execute the script logic within an existing browser session.
   * Receives the Browserbase session context for automation.
   */
  execute: (args: { input: Input; session: BrowserSession }) => Promise<Output>;
}

export class BrowserbaseClient {
  private readonly browserbase: Browserbase;

  constructor(config: AppConfig) {
    this.browserbase = new Browserbase({
      apiKey: config.env.browserbaseApiKey,
    });
  }

  /**
   * List available projects to find a valid project ID.
   */
  async listProjects(): Promise<any[]> {
    try {
      const projects = await this.browserbase.projects.list();
      return projects || [];
    } catch (error) {
      console.warn(`Warning: Could not list projects: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Start a new browser session using the real Browserbase SDK.
   */
  async startSession(options?: { alias?: string; runId?: string; projectId?: string }): Promise<BrowserSession> {
    const runId = options?.runId ?? generateRunId();
    const alias = options?.alias ?? generateSessionAlias();

    try {
      let projectId = options?.projectId;
      
      // If no project ID provided, try to find one
      if (!projectId) {
        const projects = await this.listProjects();
        if (projects.length > 0) {
          projectId = projects[0].id;
          console.log(`Using project: ${projects[0].name} (${projectId})`);
        } else {
          // Try without project ID (some accounts might not require it)
          console.log('No projects found, attempting session creation without project ID');
        }
      }

      // Create a real Browserbase session using the correct API
      const sessionParams: any = {};
      if (projectId) {
        sessionParams.projectId = projectId;
      }

      const browserbaseSession = await this.browserbase.sessions.create(sessionParams);
      
      return {
        sessionId: browserbaseSession.id,
        alias,
        runId,
        browserbaseSession,
      };
    } catch (error) {
      throw new Error(`Failed to start Browserbase session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Close the active session using the real SDK.
   */
  async closeSession(session: BrowserSession): Promise<void> {
    try {
      if (session.browserbaseSession && typeof session.browserbaseSession.close === 'function') {
        await session.browserbaseSession.close();
      }
    } catch (error) {
      console.warn(`Warning: Failed to close Browserbase session ${session.sessionId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a Stagehand-like script within a given session.
   */
  async runScript<Input, Output>(params: {
    session: BrowserSession;
    script: StagehandScript<Input, Output>;
    input: Input;
  }): Promise<Output> {
    const { session, script, input } = params;
    return script.execute({ session, input });
  }
}
