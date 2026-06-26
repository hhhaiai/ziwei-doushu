import 'server-only';

import { detectPatterns } from '@/lib/ziwei/patterns';
import { buildInterpretationFindings, formatInterpretationFindings } from '@/lib/ziwei/interpretation';
import type { DaXian, Palace, Star, ZiweiChart } from '@/lib/ziwei/types';

export interface AiChartPayload {
  mingGongBranch: number;
  shenGongBranch: number;
  wuxingJuName: string;
  palaces: Palace[];
  daXians: DaXian[];
  currentAge: number;
  currentDaXianIndex: number;
}

const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STAR_TYPE_LABEL: Record<Star['type'], string> = {
  major: '主星',
  minor: '辅星/杂曜',
  lucky: '吉星',
  sha: '煞星',
};
const BRIGHTNESS_LABEL: Record<NonNullable<Star['brightness']>, string> = {
  bright: '庙旺',
  normal: '平',
  dim: '陷',
};

function compactStar(star: Star): string {
  const extras = [
    STAR_TYPE_LABEL[star.type],
    star.brightness ? BRIGHTNESS_LABEL[star.brightness] : undefined,
    star.siHua ? `化${star.siHua}` : undefined,
  ].filter(Boolean);

  return extras.length > 0 ? `${star.name}（${extras.join('，')}）` : star.name;
}

function starsByType(palace: Palace, type: Star['type']): string {
  const names = palace.stars.filter(star => star.type === type).map(compactStar);
  return names.length > 0 ? names.join('、') : '无';
}

function palaceFlags(palace: Palace): string[] {
  return [
    palace.isMingGong ? '命宫' : undefined,
    palace.isShenGong ? '身宫' : undefined,
    palace.isCurrentDaXian ? '当前大限所在宫' : undefined,
    palace.isEmpty ? `空宫，借${palace.borrowedFromName ?? '对宫'}：${palace.borrowedStars?.join('、') || '无主星'}` : undefined,
  ].filter((flag): flag is string => Boolean(flag));
}

function summarizePalace(palace: Palace): string {
  const flags = palaceFlags(palace);
  const daXian = palace.daXianAge ? `${palace.daXianAge[0]}-${palace.daXianAge[1]}岁` : '无';

  return [
    `- ${palace.name}（${BRANCH_NAMES[palace.branch] ?? '?'}宫${flags.length > 0 ? `，${flags.join('，')}` : ''}）`,
    `  主星：${starsByType(palace, 'major')}`,
    `  辅曜：${starsByType(palace, 'minor')}`,
    `  吉星：${starsByType(palace, 'lucky')}`,
    `  煞星：${starsByType(palace, 'sha')}`,
    `  大限：${daXian}`,
  ].join('\n');
}

function summarizeCurrentDaXian(chart: AiChartPayload): string {
  const currentDaXian = chart.daXians[chart.currentDaXianIndex];
  if (!currentDaXian) return '未命中当前大限';

  return `${currentDaXian.palaceName}宫，${currentDaXian.startAge}-${currentDaXian.endAge}岁`;
}

function summarizePatterns(chart: AiChartPayload): string {
  const patterns = detectPatterns(chart as ZiweiChart);
  if (patterns.length === 0) return '未识别到明显格局。';

  return patterns.slice(0, 8).map(pattern => {
    const conditions = pattern.conditions
      ? [
          pattern.conditions.required.length > 0 ? `必须：${pattern.conditions.required.join('、')}` : undefined,
          pattern.conditions.bonus && pattern.conditions.bonus.length > 0 ? `加分：${pattern.conditions.bonus.join('、')}` : undefined,
          pattern.conditions.breaking && pattern.conditions.breaking.length > 0 ? `破格：${pattern.conditions.breaking.join('、')}` : undefined,
        ].filter(Boolean).join('；')
      : '无条件摘要';

    return [
      `- ${pattern.name}（${pattern.level}）`,
      `  说明：${pattern.description}`,
      `  涉及：${pattern.palaces.join('、')}`,
      `  条件：${conditions}`,
      pattern.source ? `  出处：${pattern.source}` : undefined,
    ].filter(Boolean).join('\n');
  }).join('\n');
}

export function buildZiweiChartContext(chart: AiChartPayload): string {
  const mingPalace = chart.palaces.find(palace => palace.branch === chart.mingGongBranch);
  const shenPalace = chart.palaces.find(palace => palace.branch === chart.shenGongBranch);

  return [
    '【脱敏说明】以下摘要已移除姓名、精确出生日期、出生城市、省份和经度。',
    '',
    '【命盘总览】',
    `五行局：${chart.wuxingJuName}`,
    `当前年龄：${chart.currentAge}岁`,
    `命宫：${mingPalace ? `${mingPalace.name}（${BRANCH_NAMES[mingPalace.branch] ?? '?'}宫）` : '未知'}`,
    `身宫：${shenPalace ? `${shenPalace.name}（${BRANCH_NAMES[shenPalace.branch] ?? '?'}宫）` : '未知'}`,
    `当前大限：${summarizeCurrentDaXian(chart)}`,
    '',
    '【十二宫摘要】',
    chart.palaces.map(summarizePalace).join('\n'),
    '',
    '【结构化判读（供 AI 优先参考）】',
    formatInterpretationFindings(buildInterpretationFindings(chart)),
    '',
    '【格局识别】',
    summarizePatterns(chart),
  ].join('\n');
}
