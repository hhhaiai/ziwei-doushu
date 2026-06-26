'use client';
import type { ZiweiChart, Star, Palace } from '@/lib/ziwei/types';
import { getTimeLayerInfo } from '@/lib/ziwei/time-view';
import type { TimeView } from './TopBar';

interface ChartBoardProps {
  chart: ZiweiChart;
  view: TimeView;
  liunianYear: number;
  liuyueMonth: number;
  onStarClick: (star: Star, palace: Palace) => void;
  onPalaceClick: (palace: Palace) => void;
  onSiHuaBadgeClick: (starName: string, siHua: string) => void;
}

// 地支名
const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 标准紫微斗数命盘十二宫逆时针排列（从命宫开始）
// 实际网格位置：row 0-3, col 0-3
const PALACE_GRID_POSITIONS: Record<number, { row: number; col: number }> = {
  0:  { row: 0, col: 3 },  // 子
  1:  { row: 0, col: 2 },  // 丑
  2:  { row: 0, col: 1 },  // 寅
  3:  { row: 0, col: 0 },  // 卯
  4:  { row: 1, col: 0 },  // 辰
  5:  { row: 2, col: 0 },  // 巳
  6:  { row: 3, col: 0 },  // 午
  7:  { row: 3, col: 1 },  // 未
  8:  { row: 3, col: 2 },  // 申
  9:  { row: 3, col: 3 },  // 酉
  10: { row: 2, col: 3 },  // 戌
  11: { row: 1, col: 3 },  // 亥
};

// 四化颜色
const SIHUA_COLORS: Record<string, string> = {
  '禄': '#34d399',
  '权': '#60a5fa',
  '科': '#fbbf24',
  '忌': '#f87171',
};

// 亮度标签
const BRIGHTNESS_LABELS: Record<string, string> = {
  'bright': '庙',
  'normal': '平',
  'dim': '陷',
};

function getPalaceByBranch(palaces: Palace[], branch: number): Palace | undefined {
  return palaces.find(p => p.branch === branch);
}

export default function ChartBoard({
  chart, view, liunianYear, liuyueMonth,
  onStarClick, onPalaceClick, onSiHuaBadgeClick,
}: ChartBoardProps) {
  const { palaces, daXians, currentDaXianIndex, wuxingJuName, mingGongBranch, shenGongBranch } = chart;
  const timeLayer = getTimeLayerInfo(view, liunianYear, liuyueMonth);

  return (
    <div className="chart-board">
      {/* 命盘信息头 */}
      <div className="chart-board-header">
        <span className="chart-board-ju">{wuxingJuName}</span>
        <span className="chart-board-label">
          命宫：{BRANCH_NAMES[mingGongBranch]} · 身宫：{BRANCH_NAMES[shenGongBranch]}
        </span>
      </div>

      {/* 十二宫网格 */}
      <div className="chart-board-grid">
        {Array.from({ length: 12 }).map((_, branch) => {
          const palace = getPalaceByBranch(palaces, branch);
          if (!palace) return null;
          const pos = PALACE_GRID_POSITIONS[branch];
          const isMing = branch === mingGongBranch;
          const isShen = branch === shenGongBranch;
          const isTimeActive = timeLayer?.activeBranch === branch;
          const daXian = daXians.find(d => d.palaceBranch === branch);
          const isCurrentDaXian = daXian != null && currentDaXianIndex >= 0
            && daXians[currentDaXianIndex] === daXian;

          return (
            <div
              key={branch}
              className={`chart-palace${isMing ? ' ming' : ''}${isShen ? ' shen' : ''}${isCurrentDaXian ? ' current-daxian' : ''}${isTimeActive ? ' time-active' : ''}${palace.isEmpty ? ' empty' : ''}`}
              style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1 }}
              onClick={() => onPalaceClick(palace)}
            >
              {/* 宫名 + 地支 */}
              <div className="chart-palace-header">
                <span className="chart-palace-name">{palace.name}</span>
                <span className="chart-palace-branch">{BRANCH_NAMES[branch]}</span>
              </div>

              {/* 大限信息 */}
              {daXian && (
                <div className={`chart-palace-daxian${isCurrentDaXian ? ' active' : ''}`}>
                  {daXian.startAge}-{daXian.endAge}
                </div>
              )}

              {/* 空宫标记：借对宫星 */}
              {palace.isEmpty && palace.borrowedStars && palace.borrowedStars.length > 0 && (
                <div className="chart-palace-borrow">
                  借{palace.borrowedFromName}宫
                </div>
              )}

              {/* 星曜列表 */}
              <div className="chart-palace-stars">
                {palace.stars.map((star, i) => {
                  const viewSiHua = timeLayer ? timeLayer.starSiHuaMap[star.name] : star.siHua;
                  return (
                    <div
                      key={`${star.name}-${i}`}
                      className={`chart-star ${star.type}${viewSiHua ? ' has-sihua' : ''}`}
                      onClick={e => { e.stopPropagation(); onStarClick(star, palace); }}
                    >
                      <span className="chart-star-name">{star.name}</span>
                      {star.brightness && star.brightness !== 'normal' && (
                        <span className={`chart-star-brightness ${star.brightness}`}>
                          {BRIGHTNESS_LABELS[star.brightness]}
                        </span>
                      )}
                      {viewSiHua && (
                        <span
                          className={`chart-star-sihua${timeLayer ? ' time-layer' : ''}`}
                          style={{ color: SIHUA_COLORS[viewSiHua] }}
                          title={timeLayer ? `${timeLayer.label}：${star.name}化${viewSiHua}` : `${star.name}化${viewSiHua}`}
                          onClick={e => { e.stopPropagation(); onSiHuaBadgeClick(star.name, viewSiHua); }}
                        >
                          {timeLayer ? `${timeLayer.badgePrefix}${viewSiHua}` : viewSiHua}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 宫干自化 */}
              {palace.selfSihua && palace.selfSihua.length > 0 && (
                <div className="chart-palace-self-sihua">
                  {palace.selfSihua.map((s, i) => (
                    <span key={i} className="chart-self-sihua-badge" style={{ color: SIHUA_COLORS[s.siHua] }}>
                      自化{s.siHua}
                    </span>
                  ))}
                </div>
              )}

              {/* 命宫/身宫标记 */}
              {isMing && <span className="chart-palace-badge ming-badge">命</span>}
              {isShen && <span className="chart-palace-badge shen-badge">身</span>}
              {timeLayer && isTimeActive && <span className="chart-palace-badge time-badge">{timeLayer.badgePrefix}</span>}
            </div>
          );
        })}

        {/* 中心区域 */}
        <div className="chart-board-center">
          <div className="chart-board-center-title">紫微斗数</div>
          <div className="chart-board-center-sub">{wuxingJuName}</div>
          {timeLayer && (
            <div className="chart-board-center-year">
              {timeLayer.centerLabel} · {timeLayer.activeBranchLabel}宫
              <br />
              {timeLayer.summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
