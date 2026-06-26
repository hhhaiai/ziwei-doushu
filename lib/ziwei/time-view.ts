import type { SiHua, ZiweiChart } from './types';
import { BRANCHES } from './constants';
import {
  buildStarSiHuaMap,
  getLiuNianSiHua,
  getLiuYueSiHua,
  getYearBranchIndex,
  getYearStemIndex,
} from './sihua';

export type ZiweiTimeView = 'mingpan' | 'liunian' | 'liuyue';

export interface TimeLayerInfo {
  view: Exclude<ZiweiTimeView, 'mingpan'>;
  label: string;
  centerLabel: string;
  badgePrefix: '流' | '月';
  activeBranch: number;
  activeBranchLabel: string;
  stemName: string;
  transforms: Record<SiHua, string>;
  starSiHuaMap: Record<string, SiHua>;
  summary: string;
}

const SIHUA_ORDER: SiHua[] = ['禄', '权', '科', '忌'];

export function formatSiHuaTransforms(transforms: Record<SiHua, string>): string {
  return SIHUA_ORDER
    .map(siHua => `${transforms[siHua]}化${siHua}`)
    .join('、');
}

export function getTimeLayerInfo(
  view: ZiweiTimeView,
  liunianYear: number,
  liuyueMonth: number,
): TimeLayerInfo | null {
  if (view === 'mingpan') return null;

  if (view === 'liunian') {
    const siHua = getLiuNianSiHua(liunianYear);
    const activeBranch = getYearBranchIndex(liunianYear);
    return {
      view,
      label: `${liunianYear}年流年`,
      centerLabel: `${liunianYear} 流年`,
      badgePrefix: '流',
      activeBranch,
      activeBranchLabel: BRANCHES[activeBranch] ?? '?',
      stemName: siHua.stemName,
      transforms: siHua.transforms,
      starSiHuaMap: buildStarSiHuaMap(siHua.stemIndex),
      summary: `${siHua.stemName}干四化：${formatSiHuaTransforms(siHua.transforms)}`,
    };
  }

  const yearStem = getYearStemIndex(liunianYear);
  const siHua = getLiuYueSiHua(yearStem, liuyueMonth);
  const activeBranch = (liuyueMonth + 1) % 12; // 正月起寅，依月序推进
  return {
    view,
    label: `${liunianYear}年${liuyueMonth}月流月`,
    centerLabel: `${liunianYear}.${liuyueMonth} 流月`,
    badgePrefix: '月',
    activeBranch,
    activeBranchLabel: BRANCHES[activeBranch] ?? '?',
    stemName: siHua.stemName,
    transforms: siHua.transforms,
    starSiHuaMap: buildStarSiHuaMap(siHua.stemIndex),
    summary: `${siHua.stemName}干四化：${formatSiHuaTransforms(siHua.transforms)}`,
  };
}

export function applyTimeLayerSiHua(chart: ZiweiChart, layer: TimeLayerInfo | null): ZiweiChart {
  if (!layer) return chart;

  return {
    ...chart,
    palaces: chart.palaces.map(palace => ({
      ...palace,
      stars: palace.stars.map(star => ({
        ...star,
        siHua: layer.starSiHuaMap[star.name],
      })),
    })),
  };
}
