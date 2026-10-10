import { NextRequest, NextResponse } from 'next/server';
import { collectProviderConfig } from '@/lib/ai/provider';
import {
  getProviderOverride,
  maskApiKey,
  safeEqual,
  setProviderOverride,
  tooManyAttempts,
  type AiProviderName,
} from '@/lib/ai/runtime-config';
import { AiConfigurationError } from '@/lib/ai/types';

/**
 * AI 服务商配置的读写接口。
 *
 * · GET    查看当前生效配置（key 只出掩码）
 * · POST   写入运行时覆盖（内存，不落盘）
 * · DELETE 清除覆盖，回到 .env.local
 *
 * 写操作需要 SETTINGS_PASSWORD；未配置该变量时只在开发环境放行，
 * 生产环境一律拒绝——否则任何人都能改 baseUrl 把请求引到自己的服务器。
 */

export const dynamic = 'force-dynamic';

const MAX_BODY_LENGTH = 4_000;
const MAX_BASE_URL_LENGTH = 200;
const MAX_MODEL_LENGTH = 80;
const MAX_API_KEY_LENGTH = 300;
const PROVIDERS: AiProviderName[] = ['deepseek', 'mimo'];

interface SettingsPayload {
  provider?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  apiKey?: unknown;
}

function jsonError(error: string, status: number): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status });
}

function clientKey(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip')?.trim() || 'local';
}

function settingsPassword(): string {
  return (process.env.SETTINGS_PASSWORD ?? '').trim();
}

interface AuthState {
  ok: boolean;
  /** true 表示服务端配了口令，客户端需要先输入 */
  required: boolean;
  /** false 表示这个环境根本不允许改配置 */
  writable: boolean;
  response?: NextResponse<{ error: string }>;
}

function authorize(req: NextRequest): AuthState {
  const password = settingsPassword();
  const isProd = process.env.NODE_ENV === 'production';

  if (!password) {
    // 没配口令：开发环境放行（只监听本机），生产环境关死
    if (isProd) {
      return {
        ok: false,
        required: false,
        writable: false,
        response: jsonError('设置入口未启用：请先在服务端配置 SETTINGS_PASSWORD', 403),
      };
    }
    return { ok: true, required: false, writable: true };
  }

  const provided = req.headers.get('x-settings-password') ?? '';
  if (!provided) {
    return { ok: false, required: true, writable: true, response: jsonError('需要管理口令', 401) };
  }

  if (tooManyAttempts(clientKey(req))) {
    return {
      ok: false,
      required: true,
      writable: true,
      response: jsonError('口令尝试次数过多，请稍后再试', 429),
    };
  }

  if (!safeEqual(provided, password)) {
    return { ok: false, required: true, writable: true, response: jsonError('口令不正确', 401) };
  }

  return { ok: true, required: true, writable: true };
}

function trimToLimit(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

/** 空串一律归一成 undefined，语义是「沿用 env」 */
function optionalValue(value: unknown, limit: number): string | undefined {
  const text = trimToLimit(value, limit);
  return text || undefined;
}

export async function GET(req: NextRequest) {
  const auth = authorize(req);

  if (!auth.writable) {
    return NextResponse.json({
      unlocked: false,
      writable: false,
      passwordRequired: false,
      note: '设置入口未启用：请先在服务端配置 SETTINGS_PASSWORD',
    });
  }

  if (!auth.ok) {
    // 只回「需要口令」，不泄漏任何配置细节
    return NextResponse.json(
      { unlocked: false, writable: true, passwordRequired: auth.required },
      { status: auth.response?.status ?? 401 },
    );
  }

  let config;
  try {
    config = collectProviderConfig();
  } catch (error: unknown) {
    const message = error instanceof AiConfigurationError ? error.message : '配置读取失败';
    return NextResponse.json({
      unlocked: true,
      writable: true,
      passwordRequired: auth.required,
      error: message,
      provider: '',
      baseUrl: '',
      model: '',
      apiKeySet: false,
      apiKeyHint: '',
      source: 'env',
    });
  }

  const override = getProviderOverride();

  return NextResponse.json({
    unlocked: true,
    writable: true,
    passwordRequired: auth.required,
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKeySet: Boolean(config.apiKey),
    apiKeyHint: maskApiKey(config.apiKey),
    source: override ? 'override' : 'env',
    keyFromEnv: override?.apiKey === undefined,
    envFallback: {
      baseUrl: override?.baseUrl === undefined,
      model: override?.model === undefined,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = authorize(req);
  if (auth.response) return auth.response;

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return jsonError('请求内容过大', 413);
  }

  let body: SettingsPayload;
  try {
    body = JSON.parse(rawBody) as SettingsPayload;
  } catch {
    return jsonError('请求 JSON 格式无效', 400);
  }

  const provider = trimToLimit(body.provider, 20).toLowerCase();
  if (!PROVIDERS.includes(provider as AiProviderName)) {
    return jsonError(`provider 只能是 ${PROVIDERS.join(' 或 ')}`, 400);
  }

  const baseUrl = optionalValue(body.baseUrl, MAX_BASE_URL_LENGTH);
  if (baseUrl && !/^https?:\/\/[^\s]+$/i.test(baseUrl)) {
    return jsonError('baseUrl 必须是以 http:// 或 https:// 开头的地址', 400);
  }

  const model = optionalValue(body.model, MAX_MODEL_LENGTH);
  if (model && !/^[\w./:-]+$/.test(model)) {
    return jsonError('model 含有不允许的字符', 400);
  }

  const apiKey = optionalValue(body.apiKey, MAX_API_KEY_LENGTH);
  if (apiKey && /\s/.test(apiKey)) {
    return jsonError('apiKey 不能包含空白字符', 400);
  }

  setProviderOverride({ provider: provider as AiProviderName, baseUrl, model, apiKey });

  // 回「生效后的完整配置」而不是回显请求值：请求里没填的字段会回落到 env，
  // 前端拿这个结果直接刷新表单即可看到真实生效状态。
  const effective = collectProviderConfig();
  const override = getProviderOverride();

  return NextResponse.json({
    ok: true,
    unlocked: true,
    writable: true,
    passwordRequired: auth.required,
    provider: effective.provider,
    baseUrl: effective.baseUrl,
    model: effective.model,
    apiKeySet: Boolean(effective.apiKey),
    apiKeyHint: maskApiKey(effective.apiKey),
    source: 'override',
    keyFromEnv: override?.apiKey === undefined,
    envFallback: {
      baseUrl: override?.baseUrl === undefined,
      model: override?.model === undefined,
    },
    note: '已生效（仅当前进程内存，重启或重新部署后回到 .env.local）',
  });
}

export async function DELETE(req: NextRequest) {
  const auth = authorize(req);
  if (auth.response) return auth.response;

  setProviderOverride(null);

  let config;
  try {
    config = collectProviderConfig();
  } catch {
    return NextResponse.json({
      ok: true,
      unlocked: true,
      writable: true,
      passwordRequired: auth.required,
      source: 'env',
      note: '已回到 .env.local 配置',
    });
  }

  return NextResponse.json({
    ok: true,
    unlocked: true,
    writable: true,
    passwordRequired: auth.required,
    source: 'env',
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKeySet: Boolean(config.apiKey),
    apiKeyHint: maskApiKey(config.apiKey),
    keyFromEnv: true,
    envFallback: { baseUrl: true, model: true },
    note: '已回到 .env.local 配置',
  });
}
