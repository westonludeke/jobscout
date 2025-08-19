import { StreakBox, StreakBoxCreateRequest, StreakPipeline } from '../../types';

const STREAK_API_BASE = 'https://api.streak.com/api/v2';

function buildAuthHeader(apiKey: string): string {
  const token = Buffer.from(`${apiKey}:`).toString('base64');
  return `Basic ${token}`;
}

async function postJson(url: string, apiKey: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(apiKey),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function postForm(url: string, apiKey: string, form: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': buildAuthHeader(apiKey),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });
}

export class StreakClient {
  private readonly apiKey: string;

  constructor(params: { apiKey: string }) {
    this.apiKey = params.apiKey;
  }

  async listPipelines(): Promise<StreakPipeline[]> {
    const url = `${STREAK_API_BASE}/pipelines`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(this.apiKey),
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Streak listPipelines failed (${response.status} ${response.statusText}): ${text}`);
    }
    return (await response.json()) as StreakPipeline[];
  }

  async getPipeline(pipelineKey: string): Promise<StreakPipeline> {
    const url = `${STREAK_API_BASE}/pipelines/${encodeURIComponent(pipelineKey)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(this.apiKey),
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Streak getPipeline failed (${response.status} ${response.statusText}): ${text}`);
    }
    return (await response.json()) as StreakPipeline;
  }

  async listBoxesForPipeline(pipelineKey: string): Promise<StreakBox[]> {
    const url = `${STREAK_API_BASE}/pipelines/${encodeURIComponent(pipelineKey)}/boxes`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(this.apiKey),
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Streak listBoxesForPipeline failed (${response.status} ${response.statusText}): ${text}`);
    }
    return (await response.json()) as StreakBox[];
  }

  private async setFieldValue(boxKey: string, fieldKey: string, value: unknown): Promise<void> {
    // Use v1 API for field setting since v2 endpoint format is unclear
    const v1Url = `https://www.streak.com/api/v1/boxes/${encodeURIComponent(boxKey)}/fields/${encodeURIComponent(fieldKey)}`;
    
    // Try different parameter names for different field types
    // For dropdown fields, try both value and dropdownValue
    let formData: Record<string, unknown>;
    if (fieldKey === '1001' || fieldKey === '1002') { // Location and Source dropdowns
      formData = { value: value, dropdownValue: value };
    } else {
      formData = { value: value };
    }
    
    console.log(`Field ${fieldKey} form data:`, formData);
    const response = await postForm(v1Url, this.apiKey, formData);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Streak setFieldValue failed (${response.status} ${response.statusText}) field ${fieldKey}: ${text}`);
    }
  }

  async createBox(req: StreakBoxCreateRequest): Promise<StreakBox> {
    const createUrl = `${STREAK_API_BASE}/pipelines/${encodeURIComponent(req.pipelineKey)}/boxes`;

    // Create box with JSON payload as required by v2 API, including custom fields
    const createBody: any = { name: req.name };
    if (req.stageKey) createBody.stageKey = req.stageKey;
    if (req.notes) createBody.notes = req.notes;
    
    // Add custom fields directly to the creation request
    if (req.fields && Object.keys(req.fields).length > 0) {
      const fields: Record<string, any> = {};
      for (const [fieldKey, value] of Object.entries(req.fields)) {
        if (fieldKey === '1002') { // Source is a tag field, needs array format
          fields[fieldKey] = [value];
        } else {
          fields[fieldKey] = value; // Location dropdown and string fields use simple values
        }
      }
      createBody.fields = fields;
    }

    const createResponse = await postJson(createUrl, this.apiKey, createBody);

    if (!createResponse.ok) {
      const text = await createResponse.text().catch(() => '');
      throw new Error(`Streak createBox failed (POST ${createUrl}) (${createResponse.status} ${createResponse.statusText}): ${text}`);
    }

    const created = (await createResponse.json()) as StreakBox;

    // Custom fields are now set directly in the creation request

    return created;
  }
}
