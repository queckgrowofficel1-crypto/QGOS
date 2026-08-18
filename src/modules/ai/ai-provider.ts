import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface AICompletionRequest {
  model: string;
  systemPrompt?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  provider: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

/** Provider-neutral AI boundary. Credentials are read only from the runtime environment. */
@Injectable()
export class AIProviderService {
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const provider = process.env.AI_PROVIDER?.toLowerCase();
    if (!provider) {
      throw new ServiceUnavailableException('AI provider is not configured');
    }

    if (provider === 'openai') {
      return this.openAI(request);
    }

    throw new ServiceUnavailableException(`Unsupported AI provider: ${provider}`);
  }

  private async openAI(request: AICompletionRequest): Promise<AICompletionResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');

    const response = await fetch(`${process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          ...request.messages,
        ],
        ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new ServiceUnavailableException(`AI provider request failed (${response.status}): ${detail.slice(0, 500)}`);
    }

    const data = await response.json() as any;
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      provider: 'openai',
      model: data.model ?? request.model,
      usage: data.usage,
    };
  }
}
