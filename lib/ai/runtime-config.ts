import 'server-only';

/**
 * AI 服务商配置的「运行时覆盖」。
 *
 * 只存在于服务端进程内存里，**不落盘**：
 * · 保存后立刻对 /api/ziwei-chat 生效
 * · 进程重启 / 重新部署后回到 .env.local（即 env 是唯一可信来源）
 *
 * 为什么挂在 globalThis 上而不是模块级变量：Next.js 会把不同 route 打成
 * 不同的 bundle，模块级变量有被复制成多份的风险；挂到 globalThis 可以保证
 * /api/settings 写进去的覆盖，/api/ziwei-chat 一定读得到，dev 下也能扛住 HMR。
 *
 * ⚠️ 已知边界：Serverless / Cloudflare Workers 下每个 isolate 有独立内存，
 * 覆盖不保证跨实例可见（同一 isolate 内没问题）。要跨实例一致必须换成 KV/D1。
 */

export type AiProviderName = 'deepseek' | 'mimo';

export interface ProviderOverride {
  provider: AiProviderName;
  /** undefined = 沿用 env 里的值 */
  baseUrl?: string;
  model?: string;
  /** undefined = 沿用 env 里的 key；空串没有意义，调用方应归一成 undefined */
  apiKey?: string;
}

interface RuntimeStore {
  override: ProviderOverride | null;
  /** 口令暴力尝试计数，按客户端键聚合 */
  attempts: Map<string, { count: number; resetAt: number }>;
}

const STORE_KEY = '__ziweiAiRuntime__';

function store(): RuntimeStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: RuntimeStore };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = { override: null, attempts: new Map() };
  }
  return g[STORE_KEY];
}

export function getProviderOverride(): ProviderOverride | null {
  return store().override;
}

export function setProviderOverride(override: ProviderOverride | null): void {
  store().override = override;
}

/**
 * 把 key 变成可展示的掩码，例如 sk-ohWVTnb...twEh → 「sk-***twEh」。
 * 完整 key 永远不离开服务端，只出这个字符串。
 */
export function maskApiKey(key: string | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '***';
  return `${key.slice(0, 3)}***${key.slice(-4)}`;
}

/** 定长比较，避免用 === 比较口令时的短路时序差 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** 返回 true 表示这个客户端已经尝试太多次，应该拒绝 */
export function tooManyAttempts(
  clientKey: string,
  max = 10,
  windowMs = 5 * 60_000,
): boolean {
  const now = Date.now();
  const map = store().attempts;

  // 顺手清掉过期的桶，避免长时间运行后 Map 无限增长
  if (map.size > 500) {
    for (const [key, value] of map) {
      if (value.resetAt <= now) map.delete(key);
    }
  }

  const current = map.get(clientKey);
  if (!current || current.resetAt <= now) {
    map.set(clientKey, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (current.count >= max) return true;
  current.count += 1;
  return false;
}
