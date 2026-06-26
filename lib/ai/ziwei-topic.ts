import 'server-only';

import type { InterpretationTopic } from '@/lib/ziwei/interpretation';
import type { AiMessage } from './types';

export interface ZiweiTopicFocus {
  topic: InterpretationTopic;
  label: string;
  userIntent: string;
  palacePriority: string[];
  answerFocus: string[];
}

const TOPIC_CONFIG: Record<InterpretationTopic, Omit<ZiweiTopicFocus, 'topic' | 'userIntent'>> = {
  overall: {
    label: '整体总览',
    palacePriority: ['命宫', '身宫', '福德宫', '当前大限'],
    answerFocus: ['先讲性格底层动力', '再讲当下阶段', '最后给最重要的现实建议'],
  },
  career: {
    label: '事业工作',
    palacePriority: ['官禄宫', '命宫', '身宫', '财帛宫', '迁移宫', '当前大限'],
    answerFocus: ['适合的工作方式', '稳定/跳槽/创业取舍', '风险控制', '下一步行动'],
  },
  wealth: {
    label: '财运资产',
    palacePriority: ['财帛宫', '田宅宫', '官禄宫', '福德宫', '当前大限'],
    answerFocus: ['赚钱方式', '现金流与资产累积', '合伙/投资风险', '可执行的财务纪律'],
  },
  love: {
    label: '感情关系',
    palacePriority: ['夫妻宫', '福德宫', '命宫', '身宫', '当前大限'],
    answerFocus: ['亲密关系模式', '择偶/相处课题', '冲突点', '沟通与边界建议'],
  },
  timing: {
    label: '当前阶段',
    palacePriority: ['当前大限', '命宫', '迁移宫', '官禄宫', '财帛宫'],
    answerFocus: ['阶段主题', '现在适合推进还是蓄力', '近期决策节奏', '该避免的误判'],
  },
};

const TOPIC_KEYWORDS: Record<InterpretationTopic, string[]> = {
  overall: ['整体', '总览', '性格', '人生', '命怎么样', '看不懂', '分析一下', '全面'],
  career: ['事业', '工作', '职业', '上班', '跳槽', '换工作', '创业', '老板', '管理', '升职', '互联网', '行业', 'offer', '公司'],
  wealth: ['财', '钱', '收入', '投资', '理财', '资产', '买房', '田宅', '副业', '现金流', '合伙赚钱'],
  love: ['感情', '婚姻', '恋爱', '对象', '伴侣', '夫妻', '桃花', '分手', '复合', '关系', '结婚'],
  timing: ['最近', '今年', '明年', '当前', '现在', '阶段', '运势', '大限', '流年', '什么时候', '近期'],
};

function scoreTopic(text: string, topic: InterpretationTopic): number {
  return TOPIC_KEYWORDS[topic].reduce((score, keyword) => (
    text.includes(keyword.toLowerCase()) ? score + keyword.length : score
  ), 0);
}

function latestUserText(messages: AiMessage[]): string {
  const latest = [...messages].reverse().find(message => message.role === 'user');
  return latest?.content ?? '';
}

export function detectZiweiTopicFocus(messages: AiMessage[], background: string, mode: 'overview' | 'chat'): ZiweiTopicFocus {
  const userIntent = [latestUserText(messages), background].filter(Boolean).join('\n').toLowerCase();
  const topics: InterpretationTopic[] = ['career', 'wealth', 'love', 'timing', 'overall'];
  const bestTopic = topics
    .map(topic => ({ topic, score: scoreTopic(userIntent, topic) }))
    .sort((a, b) => b.score - a.score)[0];
  const topic = bestTopic && bestTopic.score > 0 ? bestTopic.topic : (mode === 'overview' ? 'overall' : 'timing');
  const config = TOPIC_CONFIG[topic];

  return {
    topic,
    label: config.label,
    palacePriority: config.palacePriority,
    answerFocus: config.answerFocus,
    userIntent: userIntent || '用户未提供明确问题，按整体总览处理。',
  };
}

export function formatTopicFocus(focus: ZiweiTopicFocus): string {
  return [
    `主题：${focus.label}`,
    `用户意图：${focus.userIntent}`,
    `优先查看：${focus.palacePriority.join('、')}`,
    `回答重点：${focus.answerFocus.join('；')}`,
  ].join('\n');
}
