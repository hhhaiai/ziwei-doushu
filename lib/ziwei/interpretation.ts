import type { Palace, Star } from '@/lib/ziwei/types';
import type { AiChartPayload } from '@/lib/ai/ziwei-context';

export type InterpretationTopic = 'overall' | 'career' | 'wealth' | 'love' | 'timing';
export type InterpretationConfidence = '谨慎参考' | '中等' | '较高';

export interface InterpretationFinding {
  topic: InterpretationTopic;
  conclusion: string;
  confidence: InterpretationConfidence;
  evidence: string[];
  risks: string[];
  advice: string[];
}

const BRANCH_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const OPENING_STARS = ['七杀', '破军', '贪狼', '武曲'];
const STABILITY_STARS = ['紫微', '天府', '天相', '天梁'];
const THINKING_STARS = ['天机', '巨门', '文昌', '文曲'];
const WEALTH_STARS = ['武曲', '天府', '太阴', '禄存'];
const RELATIONSHIP_STARS = ['天同', '太阴', '天相', '贪狼', '廉贞'];
const SHA_STARS = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

function palaceByName(chart: AiChartPayload, name: string): Palace | undefined {
  return chart.palaces.find(palace => palace.name.includes(name));
}

function palaceByBranch(chart: AiChartPayload, branch: number): Palace | undefined {
  return chart.palaces.find(palace => palace.branch === branch);
}

function starNames(palace?: Palace): string[] {
  return palace?.stars.map(star => star.name) ?? [];
}

function majorStarNames(palace?: Palace): string[] {
  return palace?.stars.filter(star => star.type === 'major').map(star => star.name) ?? [];
}

function starsOfType(palace: Palace | undefined, names: string[]): string[] {
  return starNames(palace).filter(name => names.includes(name));
}

function siHuaStars(palace?: Palace): Star[] {
  return palace?.stars.filter(star => Boolean(star.siHua)) ?? [];
}

function describePalace(palace?: Palace): string {
  if (!palace) return '未知宫位';
  const branch = BRANCH_NAMES[palace.branch] ?? '?';
  const majors = majorStarNames(palace);
  const majorText = majors.length > 0 ? majors.join('、') : '无主星';
  return `${palace.name}（${branch}宫，${majorText}）`;
}

function confidenceFromEvidence(evidence: string[], risks: string[]): InterpretationConfidence {
  if (evidence.length >= 3 && risks.length <= 1) return '较高';
  if (evidence.length >= 2) return '中等';
  return '谨慎参考';
}

function analyzeOverall(chart: AiChartPayload): InterpretationFinding {
  const ming = palaceByBranch(chart, chart.mingGongBranch);
  const shen = palaceByBranch(chart, chart.shenGongBranch);
  const mingStars = majorStarNames(ming);
  const stable = starsOfType(ming, STABILITY_STARS);
  const opening = starsOfType(ming, OPENING_STARS);
  const thinking = starsOfType(ming, THINKING_STARS);
  const sha = starsOfType(ming, SHA_STARS);
  const evidence = [
    `命宫结构：${describePalace(ming)}`,
    `身宫结构：${describePalace(shen)}`,
    stable.length > 0 ? `稳定/统筹信号：${stable.join('、')}` : undefined,
    opening.length > 0 ? `开创/变化信号：${opening.join('、')}` : undefined,
    thinking.length > 0 ? `思考/表达信号：${thinking.join('、')}` : undefined,
  ].filter((item): item is string => Boolean(item));
  const risks = [
    sha.length > 0 ? `命宫见${sha.join('、')}，做判断时要避免急躁、焦虑或过度消耗。` : undefined,
    ming?.isEmpty ? `命宫空宫，性格和人生主轴要结合对宫借星一起看，不能只凭单宫下结论。` : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    topic: 'overall',
    conclusion: mingStars.length > 0
      ? `整体主轴落在“${mingStars.join('、')}”的组合上，适合先抓性格底层动力，再看事业与关系选择。`
      : '整体主轴需要结合借对宫和三方四正判断，不能用单一星曜直接下结论。',
    confidence: confidenceFromEvidence(evidence, risks),
    evidence,
    risks,
    advice: [
      '先把优势用在可长期积累的方向，不要只看短期情绪起伏。',
      '遇到重大选择时，优先看是否能发挥你的主星优势，而不是只看外部机会是否诱人。',
    ],
  };
}

function analyzeCareer(chart: AiChartPayload): InterpretationFinding {
  const career = palaceByName(chart, '官禄');
  const wealth = palaceByName(chart, '财帛');
  const move = palaceByName(chart, '迁移');
  const current = chart.daXians[chart.currentDaXianIndex];
  const careerOpening = starsOfType(career, OPENING_STARS);
  const careerStable = starsOfType(career, STABILITY_STARS);
  const careerThinking = starsOfType(career, THINKING_STARS);
  const careerSha = starsOfType(career, SHA_STARS);
  const evidence = [
    `官禄宫：${describePalace(career)}`,
    `财帛宫：${describePalace(wealth)}`,
    `迁移宫：${describePalace(move)}`,
    current ? `当前大限：${current.palaceName}宫，${current.startAge}-${current.endAge}岁` : undefined,
    careerStable.length > 0 ? `管理/组织型事业信号：${careerStable.join('、')}` : undefined,
    careerOpening.length > 0 ? `开创/执行型事业信号：${careerOpening.join('、')}` : undefined,
    careerThinking.length > 0 ? `策划/表达/技术型事业信号：${careerThinking.join('、')}` : undefined,
  ].filter((item): item is string => Boolean(item));
  const risks = [
    careerSha.length > 0 ? `官禄宫见${careerSha.join('、')}，事业上容易有压力、冲突或阶段性波动。` : undefined,
    career?.isEmpty ? '官禄宫空宫，需要借对宫判断事业，不宜只看职位名称，要看工作内容是否匹配能力。' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    topic: 'career',
    conclusion: careerOpening.length > 0
      ? '事业上有开创和承担难题的倾向，适合在变化中找机会，但要控制节奏和风险。'
      : careerStable.length > 0
        ? '事业上更适合走资源整合、管理协作或稳定累积路线。'
        : '事业判断需要结合命宫、财帛宫和当前大限一起看，单看官禄宫不宜讲太满。',
    confidence: confidenceFromEvidence(evidence, risks),
    evidence,
    risks,
    advice: [
      '如果考虑换工作，优先选能扩大职责、资源和长期能力的位置。',
      '如果考虑创业，建议先小规模验证需求、现金流和合伙稳定性，再加大投入。',
      '不要只追求“看起来风光”的岗位，要看是否能持续发挥你的主星结构。',
    ],
  };
}

function analyzeWealth(chart: AiChartPayload): InterpretationFinding {
  const wealth = palaceByName(chart, '财帛');
  const property = palaceByName(chart, '田宅');
  const career = palaceByName(chart, '官禄');
  const wealthSignals = starsOfType(wealth, WEALTH_STARS);
  const wealthSha = starsOfType(wealth, SHA_STARS);
  const sihua = siHuaStars(wealth);
  const evidence = [
    `财帛宫：${describePalace(wealth)}`,
    `田宅宫：${describePalace(property)}`,
    `官禄宫：${describePalace(career)}`,
    wealthSignals.length > 0 ? `财务累积信号：${wealthSignals.join('、')}` : undefined,
    sihua.length > 0 ? `财帛宫四化：${sihua.map(star => `${star.name}化${star.siHua}`).join('、')}` : undefined,
  ].filter((item): item is string => Boolean(item));
  const risks = [
    wealthSha.length > 0 ? `财帛宫见${wealthSha.join('、')}，钱财上要防冲动投入、计划外损耗或合伙分歧。` : undefined,
    wealth?.isEmpty ? '财帛宫空宫，财运要借对宫和事业宫一起判断，不能只凭“空”就说没财。' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    topic: 'wealth',
    conclusion: wealthSignals.length > 0
      ? '财务更适合靠能力、资源或长期资产累积，不宜只赌短线机会。'
      : '财运判断偏向“跟事业路径绑定”，赚钱方式要结合工作能力和资源位置来看。',
    confidence: confidenceFromEvidence(evidence, risks),
    evidence,
    risks,
    advice: [
      '先建立稳定现金流，再考虑风险型投资或创业投入。',
      '重大资金决策尽量做预算上限和退出条件，避免情绪化加码。',
      '若要合伙赚钱，先把权责、分账和退出机制写清楚。',
    ],
  };
}

function analyzeLove(chart: AiChartPayload): InterpretationFinding {
  const spouse = palaceByName(chart, '夫妻');
  const fortune = palaceByName(chart, '福德');
  const ming = palaceByBranch(chart, chart.mingGongBranch);
  const relationshipSignals = starsOfType(spouse, RELATIONSHIP_STARS);
  const spouseSha = starsOfType(spouse, SHA_STARS);
  const sihua = siHuaStars(spouse);
  const evidence = [
    `夫妻宫：${describePalace(spouse)}`,
    `福德宫：${describePalace(fortune)}`,
    `命宫：${describePalace(ming)}`,
    relationshipSignals.length > 0 ? `关系互动信号：${relationshipSignals.join('、')}` : undefined,
    sihua.length > 0 ? `夫妻宫四化：${sihua.map(star => `${star.name}化${star.siHua}`).join('、')}` : undefined,
  ].filter((item): item is string => Boolean(item));
  const risks = [
    spouseSha.length > 0 ? `夫妻宫见${spouseSha.join('、')}，亲密关系里要注意急躁、误解、距离感或压力累积。` : undefined,
    spouse?.isEmpty ? '夫妻宫空宫，关系判断需要借对宫和命宫性格一起看，不宜直接断稳定或不稳定。' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    topic: 'love',
    conclusion: relationshipSignals.length > 0
      ? '感情里既看重吸引力，也需要稳定沟通和现实配合，不能只靠感觉推进。'
      : '感情判断要重点结合夫妻宫、福德宫和命宫性格，当前不适合下过度绝对的结论。',
    confidence: confidenceFromEvidence(evidence, risks),
    evidence,
    risks,
    advice: [
      '感情问题先区分“对方不合适”和“沟通方式不合适”，不要急着二选一。',
      '关系推进前，重点观察价值观、金钱观和压力下的沟通方式。',
      '如果近期关系反复，先降低对抗，改成明确表达需求和边界。',
    ],
  };
}

function analyzeTiming(chart: AiChartPayload): InterpretationFinding {
  const current = chart.daXians[chart.currentDaXianIndex];
  const currentPalace = current ? palaceByBranch(chart, current.palaceBranch) : undefined;
  const currentSha = starsOfType(currentPalace, SHA_STARS);
  const evidence = [
    current ? `当前大限：${current.palaceName}宫，${current.startAge}-${current.endAge}岁` : '当前大限未命中',
    currentPalace ? `大限所在宫星曜：${describePalace(currentPalace)}` : undefined,
    currentPalace?.isEmpty ? '当前大限所在宫为空宫，需要借对宫看阶段主题。' : undefined,
  ].filter((item): item is string => Boolean(item));
  const risks = [
    currentSha.length > 0 ? `当前大限宫见${currentSha.join('、')}，这个阶段更需要管理压力、节奏和风险。` : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    topic: 'timing',
    conclusion: current
      ? `当前阶段的主线会被“${current.palaceName}宫”放大，适合围绕这个宫位主题做取舍。`
      : '当前阶段需要重新校验大限资料，暂不宜做具体时运判断。',
    confidence: confidenceFromEvidence(evidence, risks),
    evidence,
    risks,
    advice: [
      '当下的问题先看“阶段主题”而不是只看本命性格。',
      '如果最近压力变大，先做节奏管理，再做重大决定。',
    ],
  };
}

export function buildInterpretationFindings(chart: AiChartPayload): InterpretationFinding[] {
  return [
    analyzeOverall(chart),
    analyzeCareer(chart),
    analyzeWealth(chart),
    analyzeLove(chart),
    analyzeTiming(chart),
  ];
}

export function formatInterpretationFindings(findings: InterpretationFinding[]): string {
  return findings.map(finding => [
    `- 主题：${finding.topic}`,
    `  判断：${finding.conclusion}`,
    `  置信度：${finding.confidence}`,
    `  依据：${finding.evidence.join('；') || '暂无'}`,
    `  风险/限制：${finding.risks.join('；') || '暂无明显风险信号'}`,
    `  建议：${finding.advice.join('；')}`,
  ].join('\n')).join('\n');
}
