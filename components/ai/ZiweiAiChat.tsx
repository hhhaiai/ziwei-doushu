'use client';

import { useEffect, useRef, useState } from 'react';
import type { DaXian, Palace, Star, ZiweiChart } from '@/lib/ziwei/types';
import AiContent from './AiContent';

type ChatRole = 'user' | 'assistant';
type ToneValue = 'gentle' | 'direct' | 'encouraging' | 'concise' | 'detailed' | 'casual';
type LanguageValue = 'zh' | 'en' | 'auto';
type ModelValue = 'auto' | 'deepseek-chat' | 'deepseek-reasoner' | 'gpt-4o-mini' | 'gpt-4o' | 'qwen-plus' | 'qwen-max' | 'kimi-k2-0711-preview';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ZiweiAiChatProps {
  chart: ZiweiChart;
}

interface AiChartPayload {
  mingGongBranch: number;
  shenGongBranch: number;
  wuxingJuName: string;
  palaces: Palace[];
  daXians: DaXian[];
  currentAge: number;
  currentDaXianIndex: number;
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

const MODEL_OPTIONS: Array<SelectOption<ModelValue>> = [
  { value: 'auto', label: '默认模型', hint: '使用服务端环境变量配置' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'qwen-plus', label: 'Qwen Plus' },
  { value: 'qwen-max', label: 'Qwen Max' },
  { value: 'kimi-k2-0711-preview', label: 'Kimi K2' },
];

const TONE_OPTIONS: Array<SelectOption<ToneValue>> = [
  { value: 'gentle', label: '温和' },
  { value: 'direct', label: '直接' },
  { value: 'encouraging', label: '鼓励型' },
  { value: 'concise', label: '简短' },
  { value: 'detailed', label: '详细' },
  { value: 'casual', label: '年轻口语' },
];

const LANGUAGE_OPTIONS: Array<SelectOption<LanguageValue>> = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'auto', label: '跟随问题' },
];

const QUICK_QUESTIONS = [
  '我现在适合求稳还是折腾？',
  '我适合换工作还是继续积累？',
  '我适合创业吗？风险在哪里？',
  '我的感情关系要注意什么？',
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--bdr-med)',
  borderRadius: '12px',
  background: 'color-mix(in srgb, var(--bg-card) 94%, var(--bg-0))',
  color: 'var(--tx-0)',
  fontSize: '13px',
  lineHeight: 1.7,
  padding: '11px 13px',
  outline: 'none',
  resize: 'vertical',
};

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--bdr-med)',
  borderRadius: '999px',
  background: 'color-mix(in srgb, var(--bg-card) 94%, var(--bg-0))',
  color: 'var(--tx-1)',
  fontSize: '12px',
  padding: '7px 11px',
  outline: 'none',
};

const VALID_SIHUA = new Set(['禄', '权', '科', '忌']);
const VALID_BRIGHTNESS = new Set(['bright', 'normal', 'dim']);

function sanitizeStarForAi(star: Star): Star {
  const { siHua, brightness, ...rest } = star;
  return {
    ...rest,
    ...(VALID_SIHUA.has(String(siHua)) ? { siHua } : {}),
    ...(VALID_BRIGHTNESS.has(String(brightness)) ? { brightness } : {}),
  };
}

function parseStreamLine(line: string): string {
  if (!line.startsWith('data: ')) return '';
  const data = line.slice(6);
  if (data === '[DONE]') return '';
  try {
    return JSON.parse(data).delta?.text ?? '';
  } catch {
    return '';
  }
}

function buildAiChartPayload(chart: ZiweiChart): AiChartPayload {
  return {
    mingGongBranch: chart.mingGongBranch,
    shenGongBranch: chart.shenGongBranch,
    wuxingJuName: chart.wuxingJuName,
    palaces: chart.palaces.map(palace => ({
      ...palace,
      stars: palace.stars.map(sanitizeStarForAi),
    })),
    daXians: chart.daXians,
    currentAge: chart.currentAge,
    currentDaXianIndex: chart.currentDaXianIndex,
  };
}

export default function ZiweiAiChat({ chart }: ZiweiAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [background, setBackground] = useState('');
  const [input, setInput] = useState('');
  const [model, setModel] = useState<ModelValue>('auto');
  const [tone, setTone] = useState<ToneValue>('gentle');
  const [language, setLanguage] = useState<LanguageValue>('zh');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const runAi = async (mode: 'overview' | 'chat', userQuestion?: string) => {
    if (streaming) return;

    const nextMessages: ChatMessage[] = userQuestion
      ? [...messages, { role: 'user', content: userQuestion }]
      : messages;

    const assistantIndex = nextMessages.length;
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setStreaming(true);
    setError('');

    try {
      const res = await fetch('/api/ziwei-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart: buildAiChartPayload(chart),
          messages: nextMessages,
          background,
          tone,
          language,
          model,
          mode,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'AI 解读暂时不可用');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const delta = parseStreamLine(line);
          if (!delta) continue;
          text += delta;
          setMessages(current => current.map((message, index) => (
            index === assistantIndex ? { ...message, content: text } : message
          )));
        }
      }

      buffer += decoder.decode();
      for (const line of buffer.split('\n')) {
        const delta = parseStreamLine(line);
        if (!delta) continue;
        text += delta;
        setMessages(current => current.map((message, index) => (
          index === assistantIndex ? { ...message, content: text } : message
        )));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI 解读暂时不可用';
      setError(`${message}。命盘和固定解读仍可正常查看。`);
      setMessages(current => current.filter((_, index) => index !== assistantIndex));
    } finally {
      setStreaming(false);
    }
  };

  const handleOverview = () => {
    void runAi('overview');
  };

  const handleSubmit = () => {
    const question = input.trim();
    if (!question) return;
    setInput('');
    void runAi('chat', question);
  };

  const selectedModel = MODEL_OPTIONS.find(option => option.value === model);

  return (
    <div
      className="card-glass rounded-xl p-4 mb-4"
      style={{
        borderColor: 'var(--bdr-med)',
        background: 'color-mix(in srgb, var(--bg-card) 96%, var(--bg-0))',
      }}
    >
      <div className="text-[11px] tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--tx-1)', fontWeight: 700 }}>
        <span style={{ color: 'var(--ac)', opacity: 0.6 }}>◉</span>
        AI 对话解读
        <span className="text-[10px] ml-auto" style={{ color: 'var(--ac)', opacity: 0.9 }}>
          {selectedModel?.label ?? '默认模型'}
        </span>
      </div>

      <div style={{ fontSize: '12px', lineHeight: 1.75, color: 'var(--tx-2)', marginBottom: '12px' }}>
        像聊天一样追问命盘。AI 回复支持 Markdown（标题、列表、加粗、代码块、引用）。仅发送脱敏命盘摘要和你填写的背景。
      </div>

      <details style={{ marginBottom: '12px' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--tx-1)', fontSize: '12px', fontWeight: 700 }}>
          设置 / 模型 / 背景
        </summary>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: 'var(--tx-2)' }}>
              AI 模型
              <select value={model} onChange={event => setModel(event.target.value as ModelValue)} style={selectStyle} disabled={streaming}>
                {MODEL_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: 'var(--tx-2)' }}>
              语言
              <select value={language} onChange={event => setLanguage(event.target.value as LanguageValue)} style={selectStyle} disabled={streaming}>
                {LANGUAGE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: 'var(--tx-2)' }}>
              语气
              <select value={tone} onChange={event => setTone(event.target.value as ToneValue)} style={selectStyle} disabled={streaming}>
                {TONE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <textarea
            value={background}
            onChange={event => setBackground(event.target.value)}
            rows={3}
            maxLength={1500}
            placeholder="可选：告诉我你的现实背景，比如目前职业、感情状态、正在纠结换工作/创业/关系问题等。"
            style={inputStyle}
            disabled={streaming}
          />
          <div style={{ fontSize: '11px', color: 'var(--tx-3)', lineHeight: 1.6 }}>
            模型需要当前 OpenAI-compatible 服务商支持；如需新增模型，可在服务端 `AI_ALLOWED_MODELS` 中配置。
          </div>
        </div>
      </details>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {QUICK_QUESTIONS.map(question => (
          <button
            key={question}
            onClick={() => {
              setInput('');
              void runAi('chat', question);
            }}
            disabled={streaming}
            style={{
              border: '1px solid var(--bdr-med)',
              borderRadius: '999px',
              background: 'color-mix(in srgb, var(--bg-card) 96%, var(--bg-0))',
              color: 'var(--tx-1)',
              fontSize: '12px',
              padding: '6px 10px',
              cursor: streaming ? 'not-allowed' : 'pointer',
            }}
          >
            {question}
          </button>
        ))}
      </div>

      <div
        ref={chatScrollRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: messages.length > 0 ? '180px' : '86px',
          maxHeight: '520px',
          overflowY: 'auto',
          padding: '12px',
          border: '1px solid var(--bdr)',
          borderRadius: '16px',
          background: 'color-mix(in srgb, var(--bg-0) 60%, var(--bg-card))',
          marginBottom: '12px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--tx-3)', fontSize: '12px', lineHeight: 1.7 }}>
            先点一个快捷问题，或输入自己的问题。<br />AI 回复会以 Markdown 格式展示。
          </div>
        ) : messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div key={`${message.role}-${index}`} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '88%',
                  border: `1px solid ${isUser ? 'var(--ac-bdr)' : 'var(--bdr-med)'}`,
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '11px 13px',
                  background: isUser
                    ? 'linear-gradient(135deg, rgba(154,98,16,0.16), rgba(212,168,67,0.10))'
                    : 'color-mix(in srgb, var(--bg-card) 98%, var(--bg-0))',
                  boxShadow: isUser ? 'none' : '0 8px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--tx-3)', marginBottom: '6px', letterSpacing: '0.12em', fontWeight: 700, textAlign: isUser ? 'right' : 'left' }}>
                  {isUser ? '你' : 'AI'}
                </div>
                {isUser
                  ? <div style={{ fontSize: '14px', lineHeight: 1.85, color: 'var(--tx-0)', whiteSpace: 'pre-wrap' }}>{message.content}</div>
                  : <AiContent text={message.content || ' '} streaming={streaming && index === messages.length - 1} />}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(168,50,40,0.2)',
          background: 'rgba(168,50,40,0.06)',
          color: 'var(--ji)',
          fontSize: '12px',
          lineHeight: 1.6,
          marginBottom: '10px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          maxLength={800}
          placeholder="继续问：我适合稳定工作还是创业？"
          style={{ ...inputStyle, minHeight: '44px', maxHeight: '120px', resize: 'vertical' }}
          disabled={streaming}
        />
        <button
          onClick={handleSubmit}
          disabled={streaming || !input.trim()}
          style={{
            flexShrink: 0,
            border: '1px solid var(--ac-bdr)',
            borderRadius: '12px',
            background: streaming || !input.trim() ? 'var(--bg-card)' : 'rgba(212,168,67,0.14)',
            color: streaming || !input.trim() ? 'var(--tx-3)' : 'var(--tx-0)',
            fontSize: '13px',
            fontWeight: 800,
            padding: '0 16px',
            cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          发送
        </button>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleOverview}
          disabled={streaming}
          style={{
            border: 'none',
            borderRadius: '999px',
            background: streaming ? 'var(--bdr-med)' : 'linear-gradient(135deg, #9a6210, #c88020)',
            color: '#fff8e8',
            fontSize: '12px',
            fontWeight: 700,
            padding: '8px 14px',
            cursor: streaming ? 'not-allowed' : 'pointer',
          }}
        >
          {streaming ? '生成中…' : '生成白话总览'}
        </button>

        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setError('');
            }}
            disabled={streaming}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--tx-3)',
              fontSize: '11px',
              cursor: streaming ? 'not-allowed' : 'pointer',
            }}
          >
            清空对话
          </button>
        )}
      </div>
    </div>
  );
}
