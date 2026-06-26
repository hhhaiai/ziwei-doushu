import { NextRequest, NextResponse } from 'next/server';
import { createAiProvider } from '@/lib/ai/provider';
import { AiConfigurationError, AiProviderError, type AiMessage } from '@/lib/ai/types';
import { buildZiweiChartContext, type AiChartPayload } from '@/lib/ai/ziwei-context';
import {
  buildZiweiMessages,
  normalizeLanguage,
  normalizeMode,
  normalizeTone,
  type ZiweiChatMode,
} from '@/lib/ai/ziwei-prompts';

interface IncomingMessage {
  role?: unknown;
  content?: unknown;
}

interface ZiweiChatRequest {
  chart?: unknown;
  messages?: unknown;
  background?: unknown;
  tone?: unknown;
  language?: unknown;
  mode?: unknown;
  model?: unknown;
}

const MAX_BACKGROUND_LENGTH = 1500;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_MESSAGES = 10;
const MAX_BODY_LENGTH = 120_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const DEFAULT_ALLOWED_MODELS = [
  'deepseek-chat',
  'deepseek-reasoner',
  'gpt-4o-mini',
  'gpt-4o',
  'qwen-plus',
  'qwen-max',
  'kimi-k2-0711-preview',
];

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function jsonError(error: string, status: number): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isStar(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const allowedTypes = ['major', 'minor', 'lucky', 'sha'];
  const allowedSiHua = ['禄', '权', '科', '忌'];
  const allowedBrightness = ['bright', 'normal', 'dim'];
  return typeof value.name === 'string'
    && allowedTypes.includes(String(value.type))
    && (value.siHua == null || allowedSiHua.includes(String(value.siHua)))
    && (value.brightness == null || allowedBrightness.includes(String(value.brightness)));
}

function isDaXianAge(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && isNumber(value[0]) && isNumber(value[1]);
}

function isPalace(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.branch)
    && value.branch >= 0
    && value.branch <= 11
    && isNumber(value.stem)
    && value.stem >= 0
    && value.stem <= 9
    && typeof value.name === 'string'
    && Array.isArray(value.stars)
    && value.stars.every(isStar)
    && (value.daXianAge == null || isDaXianAge(value.daXianAge))
    && (value.isCurrentDaXian == null || typeof value.isCurrentDaXian === 'boolean')
    && (value.isMingGong == null || typeof value.isMingGong === 'boolean')
    && (value.isShenGong == null || typeof value.isShenGong === 'boolean')
    && (value.oppositeBranch == null || isNumber(value.oppositeBranch))
    && (value.isEmpty == null || typeof value.isEmpty === 'boolean')
    && (value.borrowedFromBranch == null || isNumber(value.borrowedFromBranch))
    && (value.borrowedFromName == null || typeof value.borrowedFromName === 'string')
    && (value.borrowedStars == null || isStringArray(value.borrowedStars));
}

function isDaXian(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isNumber(value.startAge)
    && isNumber(value.endAge)
    && isNumber(value.palaceBranch)
    && typeof value.palaceName === 'string';
}

function isAiChartPayload(value: unknown): value is AiChartPayload {
  if (!isRecord(value)) return false;
  return Array.isArray(value.palaces)
    && value.palaces.length === 12
    && value.palaces.every(isPalace)
    && typeof value.wuxingJuName === 'string'
    && Array.isArray(value.daXians)
    && value.daXians.every(isDaXian)
    && isNumber(value.currentAge)
    && isNumber(value.currentDaXianIndex)
    && isNumber(value.mingGongBranch)
    && value.mingGongBranch >= 0
    && value.mingGongBranch <= 11
    && isNumber(value.shenGongBranch)
    && value.shenGongBranch >= 0
    && value.shenGongBranch <= 11;
}

function getClientKey(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip')?.trim();
  return cfIp || 'browser-session';
}

function isRateLimited(req: NextRequest): boolean {
  const now = Date.now();
  const key = getClientKey(req);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  rateLimitStore.set(key, { ...current, count: current.count + 1 });
  return false;
}

function trimToLimit(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function allowedModels(): Set<string> {
  const configured = (process.env.AI_ALLOWED_MODELS ?? '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_MODELS, ...configured]);
}

function normalizeRequestedModel(value: unknown): string | undefined | null {
  if (value == null || value === '' || value === 'auto') return undefined;
  if (typeof value !== 'string') return null;

  const model = value.trim();
  if (model.length < 2 || model.length > 80) return null;
  if (!/^[\w./:-]+$/.test(model)) return null;
  if (!allowedModels().has(model)) return null;
  return model;
}

function sanitizeMessages(value: unknown): AiMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_MESSAGES)
    .flatMap((message: IncomingMessage) => {
      if (!message || typeof message !== 'object') return [];
      if (message.role !== 'user' && message.role !== 'assistant') return [];
      const content = trimToLimit(message.content, MAX_MESSAGE_LENGTH);
      if (!content) return [];
      return [{ role: message.role, content } satisfies AiMessage];
    });
}

function ensureChatHasQuestion(messages: AiMessage[], mode: ZiweiChatMode): boolean {
  return mode === 'overview' || messages.some(message => message.role === 'user');
}

function encodeSseDelta(text: string): string {
  return `data: ${JSON.stringify({ delta: { text } })}\n\n`;
}

function createStream(iterator: AsyncIterable<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of iterator) {
          controller.enqueue(encoder.encode(encodeSseDelta(delta)));
        }
      } catch {
        controller.enqueue(encoder.encode(encodeSseDelta('\n\nAI 解读暂时中断，请稍后重试。命盘本身和固定解读仍可正常查看。')));
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_LENGTH) {
      return jsonError('请求内容过大，请精简背景或对话内容', 413);
    }

    if (isRateLimited(req)) {
      return jsonError('请求过于频繁，请稍后再试', 429);
    }

    const body = JSON.parse(rawBody) as ZiweiChatRequest;
    if (!isAiChartPayload(body.chart)) {
      return jsonError('缺少有效命盘数据', 400);
    }

    const mode = normalizeMode(body.mode);
    const messages = sanitizeMessages(body.messages);
    if (!ensureChatHasQuestion(messages, mode)) {
      return jsonError('请先输入想追问的问题', 400);
    }

    const background = trimToLimit(body.background, MAX_BACKGROUND_LENGTH);
    const tone = normalizeTone(body.tone);
    const language = normalizeLanguage(body.language);
    const model = normalizeRequestedModel(body.model);
    if (model === null) {
      return jsonError('AI 模型不可用，请在服务端 AI_ALLOWED_MODELS 中配置后再选择', 400);
    }
    const chartContext = buildZiweiChartContext(body.chart);
    const provider = createAiProvider();
    const aiMessages = buildZiweiMessages({
      chartContext,
      background,
      messages,
      tone,
      language,
      mode,
    });

    const stream = createStream(provider.streamText({
      messages: aiMessages,
      temperature: mode === 'overview' ? 0.62 : 0.7,
      maxTokens: mode === 'overview' ? 1800 : 1400,
      model,
    }));

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return jsonError('请求 JSON 格式无效', 400);
    }
    if (error instanceof AiConfigurationError) {
      return jsonError('AI 服务暂未配置，请稍后再试', 503);
    }
    if (error instanceof AiProviderError) {
      return jsonError('AI 解读暂时不可用，请稍后重试', 502);
    }
    return jsonError('AI 解读生成失败，请稍后重试', 500);
  }
}
