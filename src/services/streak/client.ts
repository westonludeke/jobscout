import { StreakBox, StreakBoxCreateRequest } from '../../types';

const STREAK_API_BASE = 'https://www.streak.com/api/v2';

function buildAuthHeader(apiKey: string): string {
  // Basic auth with API key as username and empty password
  const token = Buffer.from(`${apiKey}:`).toString('base64');
  return `Basic ${token}`;
}

export class StreakClient {
  private readonly apiKey: string;

  constructor(params: { apiKey: string }) {
    this.apiKey = params.apiKey;
  }

  async createBox(req: StreakBoxCreateRequest): Promise<StreakBox> {
    const url = `${STREAK_API_BASE}/pipelines/${encodeURIComponent(req.pipelineKey)}/boxes`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': buildAuthHeader(this.apiKey),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: req.name,
        stageKey: req.stageKey,
        notes: req.notes,
        fields: req.fields ?? {},
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Streak createBox failed (${response.status} ${response.statusText}): ${text}`);
    }

    const data = (await response.json()) as StreakBox;
    return data;
  }
}
