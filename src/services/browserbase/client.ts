import { AppConfig } from '../../types';
import { generateRunId, generateSessionAlias } from '../../utils/id';

export interface BrowserSession {
  /** Provider session ID used for replay/inspector. */
  sessionId: string;
  /** Human-friendly alias for this session (for logs). */
  alias: string;
  /** Correlation ID for an orchestrated run. */
  runId: string;
}

export interface StagehandScript<Input, Output> {
  /** Unique name of the script for logging/metrics. */
  name: string;
  /**
   * Execute the script logic within an existing browser session.
   * In the future this will receive a Stagehand/Browser context.
   */
  execute: (args: { input: Input; session: BrowserSession }) => Promise<Output>;
}

export class BrowserbaseClient {
  private readonly apiKey: string;

  constructor(config: AppConfig) {
    this.apiKey = config.env.browserbaseApiKey;
  }

  /**
   * Start a new browser session. For now, this returns a stub session with generated IDs.
   * Replace with real Browserbase SDK session creation later.
   */
  async startSession(options?: { alias?: string; runId?: string }): Promise<BrowserSession> {
    const runId = options?.runId ?? generateRunId();
    const alias = options?.alias ?? generateSessionAlias();

    // TODO: Integrate with Browserbase SDK to create a real session and obtain sessionId
    const mockSessionId = `local-${alias}-${runId}`;

    return { sessionId: mockSessionId, alias, runId };
  }

  /**
   * Close the active session (no-op until real SDK integration).
   */
  async closeSession(_session: BrowserSession): Promise<void> {
    // TODO: Close session via Browserbase SDK
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
