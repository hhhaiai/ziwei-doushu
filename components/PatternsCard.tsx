'use client';
import { motion } from 'framer-motion';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { detectPatterns } from '@/lib/ziwei/patterns';
import { applyTimeLayerSiHua, getTimeLayerInfo } from '@/lib/ziwei/time-view';
import type { TimeView } from '@/components/chart/TopBar';

const LevelStyle = {
  excellent: { dot: 'bg-amber-400', label: 'text-amber-500', badge: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
  good:      { dot: 'bg-sky-400',   label: 'text-sky-500',   badge: 'text-sky-500 bg-sky-500/10 border-sky-500/25' },
  neutral:   { dot: 'bg-slate-400', label: 'text-slate-400', badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  caution:   { dot: 'bg-orange-500', label: 'text-orange-500', badge: 'text-orange-500 bg-orange-500/10 border-orange-500/25' },
};

interface PatternsCardProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
}

export default function PatternsCard({ chart, view, liunianYear, liuyueMonth }: PatternsCardProps) {
  const timeLayer = getTimeLayerInfo(view, liunianYear, liuyueMonth);
  const patternChart = applyTimeLayerSiHua(chart, timeLayer);
  const patterns = detectPatterns(patternChart);
  if (patterns.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-glass rounded-xl p-4 mb-4"
      style={{
        borderColor: 'var(--bdr-med)',
        background: 'color-mix(in srgb, var(--bg-card) 96%, var(--bg-0))',
      }}
    >
      <div className="text-[11px] tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--tx-1)', fontWeight: 700 }}>
        <span style={{ color: 'var(--ac)', opacity: 0.8 }}>◉</span>
        {timeLayer ? `${timeLayer.label}格局识别` : '格局识别'}
        <span className="text-[10px] ml-auto" style={{ color: 'var(--ac)', opacity: 0.9 }}>{patterns.length}个</span>
      </div>
      <div style={{ fontSize: '12px', lineHeight: 1.75, color: 'var(--tx-2)', marginBottom: '12px' }}>
        {timeLayer
          ? `${timeLayer.summary}。结构类格局仍来自本命盘，四化触发类格局会随流年/流月重算。`
          : '这里是古书格局的结构化识别：先看名称和白话说明，条件与出处作为专业依据参考。'}
      </div>
      <div className="space-y-2">
        {patterns.map((p, i) => {
          const st = LevelStyle[p.level];
          return (
            <motion.div
              key={`${p.name}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-inner rounded-lg p-3"
              style={{
                borderColor: 'var(--bdr-med)',
                background: 'color-mix(in srgb, var(--bg-card) 98%, var(--bg-0))',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                <span className={`text-[13px] font-semibold ${st.label}`}>{p.name}</span>
                <div className="flex gap-1 ml-auto">
                  {[...new Set(p.palaces)].slice(0, 2).map(pa => (
                    <span key={pa} className={`text-[8px] px-1.5 py-px rounded-full border ${st.badge}`}>
                      {pa.replace('宫', '')}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[13px] leading-relaxed pl-3.5" style={{ color: 'var(--tx-1)', lineHeight: 1.75 }}>
                {p.description}
              </p>

              {p.conditions && (
                <div className="mt-2 pl-3.5 space-y-0.5">
                  {p.conditions.required.length > 0 && (
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--tx-1)', opacity: 0.95 }}>
                      <span className="font-medium" style={{ color: 'var(--ac)' }}>必须</span>
                      <span style={{ opacity: 0.6 }}> · </span>
                      {p.conditions.required.join('、')}
                    </div>
                  )}
                  {p.conditions.bonus && p.conditions.bonus.length > 0 && (
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--tx-1)', opacity: 0.95 }}>
                      <span className="font-medium text-emerald-500">加分</span>
                      <span style={{ opacity: 0.6 }}> · </span>
                      {p.conditions.bonus.join('、')}
                    </div>
                  )}
                  {p.conditions.breaking && p.conditions.breaking.length > 0 && (
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--tx-1)', opacity: 0.95 }}>
                      <span className="font-medium text-orange-500">破格</span>
                      <span style={{ opacity: 0.6 }}> · </span>
                      {p.conditions.breaking.join('、')}
                    </div>
                  )}
                </div>
              )}

              {p.source && (
                <div className="text-[10px] mt-2 pl-3.5" style={{ color: 'var(--tx-2)', opacity: 0.85 }}>
                  出处 · {p.source}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
