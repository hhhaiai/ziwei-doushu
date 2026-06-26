export type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiStreamOptions {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AiProvider {
  streamText(options: AiStreamOptions): AsyncIterable<string>;
}

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigurationError';
  }
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiProviderError';
  }
}
