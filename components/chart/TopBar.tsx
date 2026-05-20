'use client';
import type { ZiweiChart } from '@/lib/ziwei/types';

export type TimeView = 'mingpan' | 'liunian' | 'liuyue';

interface TopBarProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
  onViewChange: (view: TimeView) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onShare?: () => void;
  onExport?: () => void;
  copied?: boolean;
}

const VIEWS: { key: TimeView; label: string }[] = [
  { key: 'mingpan', label: '命盘' },
  { key: 'liunian', label: '流年' },
  { key: 'liuyue', label: '流月' },
];

export default function TopBar({
  chart, view, liunianYear, liuyueMonth,
  onViewChange, onYearChange, onMonthChange,
  onShare, onExport, copied,
}: TopBarProps) {
  const { birthInfo, currentAge } = chart;
  const genderLabel = birthInfo.gender === 'male' ? '男' : '女';

  return (
    <header className="chart-topbar">
      {/* 左侧：命主信息 */}
      <div className="chart-topbar-info">
        {birthInfo.name && (
          <span className="chart-topbar-name">{birthInfo.name}</span>
        )}
        <span className="chart-topbar-meta">
          {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日 · {genderLabel}命 · 现年 {currentAge} 岁
        </span>
      </div>

      {/* 中间：视图切换 */}
      <div className="chart-topbar-views">
        {VIEWS.map(v => (
          <button
            key={v.key}
            className={`chart-topbar-view-btn${view === v.key ? ' active' : ''}`}
            onClick={() => onViewChange(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* 右侧：年/月选择 + 操作 */}
      <div className="chart-topbar-controls">
        {view === 'liunian' && (
          <div className="chart-topbar-year-picker">
            <button onClick={() => onYearChange(liunianYear - 1)}>‹</button>
            <span>{liunianYear}年</span>
            <button onClick={() => onYearChange(liunianYear + 1)}>›</button>
          </div>
        )}
        {view === 'liuyue' && (
          <div className="chart-topbar-month-picker">
            <button onClick={() => {
              if (liuyueMonth <= 1) { onMonthChange(12); onYearChange(liunianYear - 1); }
              else onMonthChange(liuyueMonth - 1);
            }}>‹</button>
            <span>{liunianYear}年{liuyueMonth}月</span>
            <button onClick={() => {
              if (liuyueMonth >= 12) { onMonthChange(1); onYearChange(liunianYear + 1); }
              else onMonthChange(liuyueMonth + 1);
            }}>›</button>
          </div>
        )}
        {onShare && (
          <button className="chart-topbar-action" onClick={onShare}>
            {copied ? '已复制' : '分享'}
          </button>
        )}
        {onExport && (
          <button className="chart-topbar-action" onClick={onExport}>
            打印
          </button>
        )}
      </div>
    </header>
  );
}
