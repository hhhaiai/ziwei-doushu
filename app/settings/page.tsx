'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * AI 服务商配置页。
 *
 * 改动只写进服务端进程内存，重启/重新部署即回到 .env.local。
 * 这里拿不到、也不会显示完整的 API Key——服务端只回掩码。
 */

interface SettingsState {
  unlocked: boolean;
  writable: boolean;
  passwordRequired: boolean;
  error?: string;
  provider?: string;
  baseUrl?: string;
  model?: string;
  apiKeySet?: boolean;
  apiKeyHint?: string;
  source?: 'override' | 'env';
  keyFromEnv?: boolean;
  note?: string;
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  fontSize: '11px',
  color: 'var(--tx-2)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '13px',
  borderRadius: '8px',
  border: '1px solid var(--bdr-med)',
  background: 'var(--bg-0)',
  color: 'var(--tx-1)',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: 700,
  borderRadius: '8px',
  border: '1px solid var(--bdr-med)',
  background: 'var(--bg-card)',
  color: 'var(--tx-1)',
  cursor: 'pointer',
};

async function callApi(
  method: 'GET' | 'POST' | 'DELETE',
  password: string,
  body?: unknown,
): Promise<{ status: number; data: SettingsState }> {
  const res = await fetch('/api/settings', {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(password ? { 'x-settings-password': password } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as SettingsState;
  return { status: res.status, data };
}

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<SettingsState | null>(null);
  const [provider, setProvider] = useState('mimo');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const applyState = useCallback((data: SettingsState) => {
    setState(data);
    if (data.provider) setProvider(data.provider);
    if (data.baseUrl) setBaseUrl(data.baseUrl);
    if (data.model) setModel(data.model);
  }, []);

  const reload = useCallback(async (pwd: string) => {
    const { data } = await callApi('GET', pwd);
    applyState(data);
    return data;
  }, [applyState]);

  useEffect(() => {
    void reload('');
  }, [reload]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { status, data } = await callApi('POST', password, { provider, baseUrl, model, apiKey });
      if (status !== 200) throw new Error(data.error ?? '保存失败');
      setApiKey('');
      applyState(data);
      setMessage(data.note ?? '已保存并生效');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const clearOverride = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { status, data } = await callApi('DELETE', password);
      if (status !== 200) throw new Error(data.error ?? '清除失败');
      applyState(data);
      setMessage(data.note ?? '已回到 .env.local 配置');
    } catch (e) {
      setError(e instanceof Error ? e.message : '清除失败');
    } finally {
      setBusy(false);
    }
  };

  const locked = Boolean(state?.passwordRequired) && !state?.unlocked;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/chart" style={{ color: 'var(--tx-3)', fontSize: '12px' }}>← 返回排盘</Link>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tx-1)' }}>AI 服务商设置</h1>
      </div>

      <div className="card-glass rounded-xl p-5" style={{ borderColor: 'var(--bdr-med)' }}>
        <p style={{ fontSize: '12px', lineHeight: 1.75, color: 'var(--tx-2)', marginBottom: '12px' }}>
          在这里切换 AI 服务商、接口地址、模型和 Key。改动只写到<b>服务端进程内存</b>，
          立即对「生成白话总览」和对话生效；<b>重启或重新部署后回到 <code>.env.local</code></b>。
          完整 Key 不会发送到浏览器，页面只会显示掩码。
        </p>

        {state?.writable === false && (
          <div style={{ ...inputStyle, color: 'var(--tx-2)', marginBottom: '14px' }}>
            设置入口未启用：请先在服务端配置 <code>SETTINGS_PASSWORD</code> 环境变量。
          </div>
        )}

        {locked && (
          <form
            onSubmit={event => { event.preventDefault(); void reload(password); }}
            style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '16px' }}
          >
            <label style={{ ...labelStyle, flex: 1 }}>
              管理口令
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="SETTINGS_PASSWORD"
                style={inputStyle}
                autoComplete="current-password"
              />
            </label>
            <button type="submit" style={buttonStyle} disabled={busy}>解锁</button>
          </form>
        )}

        {state?.writable && state?.unlocked && (
          <>
            <div
              style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center',
                fontSize: '11px', color: 'var(--tx-3)', marginBottom: '14px',
              }}
            >
              <span>
                生效来源：
                <b style={{ color: state.source === 'override' ? 'var(--ac)' : 'var(--tx-2)' }}>
                  {state.source === 'override' ? '运行时覆盖（内存）' : '.env.local'}
                </b>
              </span>
              <span>
                当前 Key：{state.apiKeySet ? state.apiKeyHint : '未配置'}
                {state.apiKeySet && state.keyFromEnv ? '（来自 env）' : ''}
              </span>
            </div>

            {state.error && (
              <div style={{ ...inputStyle, color: '#ff8a80', marginBottom: '14px' }}>{state.error}</div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <label style={labelStyle}>
                  服务商
                  <select value={provider} onChange={e => setProvider(e.target.value)} style={inputStyle} disabled={busy}>
                    <option value="mimo">mimo（OpenAI 兼容通用槽位）</option>
                    <option value="deepseek">deepseek</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  模型
                  <input
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="grok-4.7"
                    style={inputStyle}
                    disabled={busy}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                接口地址（Base URL）
                <input
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  style={inputStyle}
                  disabled={busy}
                />
              </label>

              <label style={labelStyle}>
                API Key
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={state.apiKeySet ? '留空 = 继续用当前 Key' : '填入 Key'}
                  style={inputStyle}
                  disabled={busy}
                  autoComplete="off"
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="submit" style={buttonStyle} disabled={busy}>保存并生效</button>
                <button type="button" onClick={() => void clearOverride()} style={buttonStyle} disabled={busy}>
                  清除覆盖（回到 .env.local）
                </button>
              </div>
            </form>
          </>
        )}

        {message && (
          <div style={{ fontSize: '12px', color: 'var(--ac)', marginTop: '14px' }}>{message}</div>
        )}
        {error && (
          <div style={{ fontSize: '12px', color: '#ff8a80', marginTop: '14px' }}>{error}</div>
        )}
      </div>

      <p style={{ fontSize: '11px', lineHeight: 1.7, color: 'var(--tx-3)', marginTop: '14px' }}>
        提示：模型下拉里可选的白名单由服务端 <code>AI_ALLOWED_MODELS</code> 控制；
        这里的「模型」对应下拉中的「默认模型」。
      </p>
    </main>
  );
}
