'use client';
import { useState } from 'react';
import type { ZiweiChart, Star, Palace, SiHua } from '@/lib/ziwei/types';
import { getTimeLayerInfo } from '@/lib/ziwei/time-view';
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
  '紫微': '白话：你比较有主见，适合负责统筹、管理和做决定；优点是有格局，缺点是容易显得高冷或不太愿意被安排。',
  '天机': '白话：你脑子转得快，适合策划、技术、顾问、产品和分析类工作；要注意想太多、反复权衡导致行动慢。',
  '太阳': '白话：你重视正面形象和影响力，适合教育、传媒、公职、管理和对外沟通；要注意别把责任都扛在自己身上。',
  '武曲': '白话：你重视效率、结果和钱的安全感，适合财务、运营、管理、金融或执行要求高的工作；要避免太硬、不好商量。',
  '天同': '白话：你更看重舒服、人缘和生活质量，适合服务、协调、内容、教育等温和型领域；要注意安逸过头。',
  '廉贞': '白话：你有表现力、审美和强烈感受力，适合艺术、品牌、管理或需要魅力的工作；感情和人际里要避免太纠结。',
  '天府': '白话：你适合做资源管理、财务规划、行政统筹和长期积累；优点是稳，缺点是有时过于保守。',
  '太阴': '白话：你细腻、重感受，也重视安全感和资产积累，适合不动产、财务、照顾型或审美型工作。',
  '贪狼': '白话：你社交感、欲望感和学习兴趣强，适合销售、娱乐、内容、商业拓展；要注意分心和冲动消费。',
  '巨门': '白话：你适合靠表达、分析、谈判、研究吃饭，比如法律、教育、咨询、媒体；要注意口舌误会和过度怀疑。',
  '天相': '白话：你擅长协调、流程、规则和辅佐决策，适合行政、管理、运营、组织型岗位；要避免太在意别人评价。',
  '天梁': '白话：你有保护别人、讲原则和处理复杂问题的能力，适合医疗、教育、公益、顾问、风控；要避免说教感太重。',
  '七杀': '白话：你行动力强，适合竞争、开创、解决难题和承担压力；要注意别太急，重大选择先做风险预案。',
  '破军': '白话：你适合变革、转型和打破旧模式，越是一成不变越容易难受；要注意不要为了改变而改变。',
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

function SiHuaDetail({
  siHua, chart, view, liunianYear, liuyueMonth,
}: {
  siHua: string;
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
}) {
  const timeLayer = getTimeLayerInfo(view, liunianYear, liuyueMonth);
  // 找到该四化对应的星曜在哪些宫
  const placements: { starName: string; palace: Palace }[] = [];
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      const starSiHua = timeLayer ? timeLayer.starSiHuaMap[star.name] : star.siHua;
      if (starSiHua === siHua) {
        placements.push({ starName: star.name, palace });
      }
    }
  }

  const branchNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const siHuaLabel = `${timeLayer ? timeLayer.badgePrefix : ''}${SIHUA_NAMES[siHua as SiHua] || `化${siHua}`}`;
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
        {timeLayer ? `${timeLayer.label}：${timeLayer.summary}` : `点击命盘中带${siHuaLabel}标记的星曜可查看详情`}
      </p>
    </div>
  );
}

function OverviewPanel({
  chart, view, liunianYear, liuyueMonth,
}: {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
}) {
  const { birthInfo, wuxingJuName, currentAge, daXians, currentDaXianIndex } = chart;
  const currentDaXian = daXians[currentDaXianIndex];
  const timeLayer = getTimeLayerInfo(view, liunianYear, liuyueMonth);

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
      {timeLayer && (
        <div className="insight-overview-row highlight">
          <span className="insight-overview-label">当前视图</span>
          <span className="insight-overview-value">
            {timeLayer.label} · {timeLayer.activeBranchLabel}宫 · {timeLayer.summary}
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
        {!focus && <OverviewPanel chart={chart} view={view} liunianYear={liunianYear} liuyueMonth={liuyueMonth} />}
        {focus?.type === 'star' && <StarDetail star={focus.star} palace={focus.palace} />}
        {focus?.type === 'palace' && <PalaceDetail palace={focus.palace} />}
        {focus?.type === 'sihua' && (
          <SiHuaDetail
            siHua={focus.siHua}
            chart={chart}
            view={view}
            liunianYear={liunianYear}
            liuyueMonth={liuyueMonth}
          />
        )}
      </div>
    </div>
  );
}
