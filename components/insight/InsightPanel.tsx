'use client';
import { useState } from 'react';
import type { ZiweiChart, Star, Palace, SiHua } from '@/lib/ziwei/types';
import type { TimeView } from '@/components/chart/TopBar';

export type FocusState =
  | { type: 'star'; label: string; star: Star; palace: Palace }
  | { type: 'palace'; label: string; palace: Palace }
  | { type: 'sihua'; label: string; siHua: string };

interface InsightPanelProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
  focus: FocusState | null;
  onClearFocus: () => void;
}

const SIHUA_NAMES: Record<SiHua, string> = {
  '禄': '化禄',
  '权': '化权',
  '科': '化科',
  '忌': '化忌',
};

const SIHUA_COLORS: Record<SiHua, string> = {
  '禄': '#34d399',
  '权': '#60a5fa',
  '科': '#fbbf24',
  '忌': '#f87171',
};

const STAR_ATTRS: Record<string, string> = {
  '紫微': '土·帝王星',
  '天机': '木·智慧星',
  '太阳': '火·官禄主',
  '武曲': '金·财帛主',
  '天同': '水·福星',
  '廉贞': '火·才艺星',
  '天府': '土·财库星',
  '太阴': '水·田宅主',
  '贪狼': '木水·桃花',
  '巨门': '水·是非星',
  '天相': '水·印星',
  '天梁': '土·荫星',
  '七杀': '金火·将星',
  '破军': '水·耗星',
};

const STAR_BRIEFS: Record<string, string> = {
  '紫微': '天皇贵星，统御众星。坐命者有孤傲之气，主权威显达，天生具备领导气质。',
  '天机': '益寿星，主智谋与变动。聪慧机灵，善于筹谋，心思细腻，宜策划、顾问类工作。',
  '太阳': '官禄主星，主声誉与名望。慷慨大度，重视公众形象，利官场与公职。',
  '武曲': '财帛主星，主财务与决断。意志坚定，行动果敢，适合财务、金融类职业。',
  '天同': '福德主星，主享乐与人缘。性情温和，人缘极好，注重生活品质。',
  '廉贞': '次桃花星，主才艺与情欲。才华出众，感情丰富，适合艺术、政界。',
  '天府': '南斗主星，主财库与积蓄。稳重保守，理财能力强，是命盘的稳定力量。',
  '太阴': '田宅主星，主财富与阴柔。细腻温柔，感受力强，利不动产与积蓄。',
  '贪狼': '桃花星，主欲望与才艺。多才多艺，欲望旺盛，社交活跃，人缘极好。',
  '巨门': '暗星，主口才与是非。口才出众，思辨能力强，适合律师、教育、媒体。',
  '天相': '印星，主辅佐与印绶。善于协调，重视礼节，正直守法，贵人运佳。',
  '天梁': '荫星，主老成与荫蔽。正直稳重，慈悲心强，适合医疗、社会工作领域。',
  '七杀': '将星，主刚烈与开创。性格刚毅，行动力强，勇于挑战，适合创业、军警。',
  '破军': '耗星，主变动与开拓。勇于突破，不惧改变，一生变动大但有魄力。',
};

function StarDetail({ star, palace }: { star: Star; palace: Palace }) {
  const attr = STAR_ATTRS[star.name];
  const brief = STAR_BRIEFS[star.name];
  return (
    <div className="insight-star-detail">
      <div className="insight-star-header">
        <span className="insight-star-name">{star.name}</span>
        {attr && <span className="insight-star-attr">{attr}</span>}
        {star.brightness && star.brightness !== 'normal' && (
          <span className={`insight-star-bright ${star.brightness}`}>
            {star.brightness === 'bright' ? '庙' : '陷'}
          </span>
        )}
      </div>
      <div className="insight-star-palace">所在宫位：{palace.name}（{(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][palace.branch]) ?? '?'}宫）</div>
      {star.siHua && (
        <div className="insight-star-sihua" style={{ color: SIHUA_COLORS[star.siHua] }}>
          {SIHUA_NAMES[star.siHua]}：此星被{SIHUA_NAMES[star.siHua]}影响，宫位能量增强
        </div>
      )}
      {brief && <p className="insight-star-brief">{brief}</p>}
    </div>
  );
}

function PalaceDetail({ palace }: { palace: Palace }) {
  const branchNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const majorStars = palace.stars.filter(s => s.type === 'major');
  const minorStars = palace.stars.filter(s => s.type === 'minor');
  const luckyStars = palace.stars.filter(s => s.type === 'lucky');
  const shaStars = palace.stars.filter(s => s.type === 'sha');

  return (
    <div className="insight-palace-detail">
      <div className="insight-palace-header">
        <span className="insight-palace-name">{palace.name}</span>
        <span className="insight-palace-branch">{(branchNames[palace.branch]) ?? '?'}宫 · 天干{(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][palace.stem]) ?? '?'}</span>
      </div>

      {palace.isMingGong && <div className="insight-palace-tag">命宫</div>}
      {palace.isShenGong && <div className="insight-palace-tag">身宫</div>}

      {palace.isEmpty && (
        <div className="insight-palace-empty">
          空宫（无主星），借对宫{palace.borrowedFromName}宫星曜
        </div>
      )}

      {majorStars.length > 0 && (
        <div className="insight-star-group">
          <span className="insight-group-label">主星</span>
          <div className="insight-group-stars">
            {majorStars.map((s, i) => (
              <span key={i} className="insight-star-chip major">
                {s.name}{s.siHua && <span style={{ color: SIHUA_COLORS[s.siHua], marginLeft: 2 }}>{s.siHua}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {minorStars.length > 0 && (
        <div className="insight-star-group">
          <span className="insight-group-label">辅星</span>
          <div className="insight-group-stars">
            {minorStars.map((s, i) => (
              <span key={i} className="insight-star-chip minor">{s.name}</span>
            ))}
          </div>
        </div>
      )}

      {luckyStars.length > 0 && (
        <div className="insight-star-group">
          <span className="insight-group-label">吉星</span>
          <div className="insight-group-stars">
            {luckyStars.map((s, i) => (
              <span key={i} className="insight-star-chip lucky">{s.name}</span>
            ))}
          </div>
        </div>
      )}

      {shaStars.length > 0 && (
        <div className="insight-star-group">
          <span className="insight-group-label">煞星</span>
          <div className="insight-group-stars">
            {shaStars.map((s, i) => (
              <span key={i} className="insight-star-chip sha">{s.name}</span>
            ))}
          </div>
        </div>
      )}

      {palace.selfSihua && palace.selfSihua.length > 0 && (
        <div className="insight-self-sihua">
          <span className="insight-group-label">宫干自化</span>
          <div className="insight-group-stars">
            {palace.selfSihua.map((s, i) => (
              <span key={i} className="insight-self-chip" style={{ color: SIHUA_COLORS[s.siHua] }}>
                {s.starName} 自化{s.siHua}
              </span>
            ))}
          </div>
        </div>
      )}

      {palace.daXianAge && (
        <div className="insight-palace-daxian">
          大限：{palace.daXianAge[0]}-{palace.daXianAge[1]} 岁
          {palace.isCurrentDaXian && <span className="insight-current-tag">（当前大限）</span>}
        </div>
      )}
    </div>
  );
}

function SiHuaDetail({ siHua, chart }: { siHua: string; chart: ZiweiChart }) {
  // 找到该四化对应的星曜在哪些宫
  const placements: { starName: string; palace: Palace }[] = [];
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      if (star.siHua === siHua) {
        placements.push({ starName: star.name, palace });
      }
    }
  }

  const branchNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const siHuaLabel = SIHUA_NAMES[siHua as SiHua] || `化${siHua}`;
  const color = SIHUA_COLORS[siHua as SiHua] || '#d4a843';

  return (
    <div className="insight-sihua-detail">
      <div className="insight-sihua-header">
        <span className="insight-sihua-name" style={{ color }}>{siHuaLabel}</span>
      </div>
      {placements.length === 0 ? (
        <p className="insight-sihua-empty">此四化未入任何宫位</p>
      ) : (
        <div className="insight-sihua-placements">
          {placements.map((p, i) => (
            <div key={i} className="insight-sihua-placement">
              <span className="insight-sihua-star">{p.starName}</span>
              <span className="insight-sihua-arrow">→</span>
              <span className="insight-sihua-palace">{p.palace.name}（{branchNames[p.palace.branch]}宫）</span>
            </div>
          ))}
        </div>
      )}
      <p className="insight-sihua-hint" style={{ color }}>
        点击命盘中带{siHuaLabel}标记的星曜可查看详情
      </p>
    </div>
  );
}

function OverviewPanel({ chart }: { chart: ZiweiChart }) {
  const { birthInfo, wuxingJuName, currentAge, daXians, currentDaXianIndex } = chart;
  const currentDaXian = daXians[currentDaXianIndex];

  return (
    <div className="insight-overview">
      <div className="insight-overview-row">
        <span className="insight-overview-label">五行局</span>
        <span className="insight-overview-value">{wuxingJuName}</span>
      </div>
      <div className="insight-overview-row">
        <span className="insight-overview-label">现年</span>
        <span className="insight-overview-value">{currentAge} 岁</span>
      </div>
      {currentDaXian && (
        <div className="insight-overview-row highlight">
          <span className="insight-overview-label">当前大限</span>
          <span className="insight-overview-value">
            {currentDaXian.palaceName}宫 · {currentDaXian.startAge}-{currentDaXian.endAge}岁
          </span>
        </div>
      )}
    </div>
  );
}

export default function InsightPanel({
  chart, view, liunianYear, liuyueMonth, focus, onClearFocus,
}: InsightPanelProps) {
  return (
    <div className="insight-panel">
      {/* 面板标题 */}
      <div className="insight-panel-header">
        <span className="insight-panel-title">
          {focus ? focus.label : '命盘洞察'}
        </span>
        {focus && (
          <button className="insight-panel-close" onClick={onClearFocus}>×</button>
        )}
      </div>

      {/* 内容 */}
      <div className="insight-panel-body">
        {!focus && <OverviewPanel chart={chart} />}
        {focus?.type === 'star' && <StarDetail star={focus.star} palace={focus.palace} />}
        {focus?.type === 'palace' && <PalaceDetail palace={focus.palace} />}
        {focus?.type === 'sihua' && <SiHuaDetail siHua={focus.siHua} chart={chart} />}
      </div>
    </div>
  );
}
