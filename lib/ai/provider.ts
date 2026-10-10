import 'server-only';

import { getProviderOverride } from './runtime-config';
import {
  AiConfigurationError,
  AiProviderError,
  type AiMessage,
  type AiProvider,
  type AiStreamOptions,
} from './types';

interface OpenAiCompatibleConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface OpenAiDeltaChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * 读取环境变量里的服务商配置。
 * 这里**不**校验字段是否齐全：运行时的覆盖（/settings）可能补上 env 缺失的值，
 * 缺什么由 collectProviderConfig 统一收口。
 */
function readEnvConfig(provider: string): Partial<OpenAiCompatibleConfig> {
  if (provider === 'deepseek') {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
    };
  }

  if (provider === 'mimo') {
    return {
      apiKey: process.env.MIMO_API_KEY,
      baseUrl: process.env.MIMO_BASE_URL,
      model: process.env.MIMO_MODEL,
    };
  }

  throw new AiConfigurationError(`不支持的 AI_PROVIDER：${provider}`);
}

export interface CollectedProviderConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * 合并「运行时覆盖 > 环境变量」，不做完整性校验。
 * /api/settings 用它来展示当前生效配置（key 由调用方掩码后再出网）。
 */
export function collectProviderConfig(): CollectedProviderConfig {
  const override = getProviderOverride();
  const provider = (override?.provider ?? process.env.AI_PROVIDER ?? 'deepseek').toLowerCase();
  const env = readEnvConfig(provider);

  return {
    provider,
    apiKey: override?.apiKey ?? env.apiKey ?? '',
    baseUrl: trimTrailingSlash(override?.baseUrl ?? env.baseUrl ?? ''),
    model: override?.model ?? env.model ?? '',
  };
}

function getProviderConfig(): OpenAiCompatibleConfig {
  const { provider, apiKey, baseUrl, model } = collectProviderConfig();
  const prefix = provider.toUpperCase();

  if (!apiKey) throw new AiConfigurationError(`${prefix}_API_KEY 未配置`);
  if (!baseUrl) throw new AiConfigurationError(`${prefix}_BASE_URL 未配置`);
  if (!model) throw new AiConfigurationError(`${prefix}_MODEL 未配置`);

  return { apiKey, baseUrl, model };
}

function toProviderMessages(messages: AiMessage[]): Array<{ role: string; content: string }> {
  return messages.map(message => ({
    role: message.role,
    content: message.content,
  }));
}

async function* parseOpenAiStream(response: Response): AsyncIterable<string> {
  if (!response.body) {
    throw new AiProviderError('AI 服务未返回可读取的响应流');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;

      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let chunk: OpenAiDeltaChunk;
      try {
        chunk = JSON.parse(payload) as OpenAiDeltaChunk;
      } catch {
        continue;
      }

      if (chunk.error?.message) {
        throw new AiProviderError(chunk.error.message);
      }

      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

class OpenAiCompatibleProvider implements AiProvider {
  constructor(private readonly config: OpenAiCompatibleConfig) {}

  async *streamText(options: AiStreamOptions): AsyncIterable<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model ?? this.config.model,
        messages: toProviderMessages(options.messages),
        temperature: options.temperature ?? 0.65,
        max_tokens: options.maxTokens ?? 1600,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new AiProviderError(`AI 服务请求失败（${response.status}）`);
    }

    yield* parseOpenAiStream(response);
  }
}

export function createAiProvider(): AiProvider {
  return new OpenAiCompatibleProvider(getProviderConfig());
}
