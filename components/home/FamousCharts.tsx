'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FAMOUS_PERSONS, FAMOUS_CATEGORIES, type FamousPerson } from '@/lib/ziwei/famous';
import type { Theme } from '@/components/ThemeProvider';
// 时辰索引 → 典型钟点（用于 URL 传参）
const HOUR_TO_CLOCK: Record<number, { h: number; mi: number }> = {
  0: { h: 0, mi: 0 },    // 子时
  1: { h: 2, mi: 0 },    // 丑时
  2: { h: 4, mi: 0 },    // 寅时
  3: { h: 6, mi: 0 },    // 卯时
  4: { h: 8, mi: 0 },    // 辰时
  5: { h: 10, mi: 0 },   // 巳时
  6: { h: 12, mi: 0 },   // 午时
  7: { h: 14, mi: 0 },   // 未时
  8: { h: 16, mi: 0 },   // 申时
  9: { h: 18, mi: 0 },   // 酉时
  10: { h: 20, mi: 0 },  // 戌时
  11: { h: 22, mi: 0 },  // 亥时
};

const CATEGORY_LABELS: Record<string, { icon: string; color: string }> = {
  '商业': { icon: '💼', color: '#4ade80' },
  '文艺': { icon: '🎨', color: '#c084fc' },
  '历史': { icon: '📜', color: '#facc15' },
  '科技': { icon: '🚀', color: '#60a5fa' },
  '体育': { icon: '🏆', color: '#fb923c' },
};

interface FamousChartsColors {
  goldLine: string;
  tagText: string;
  goldSolid: string;
  textSecond: string;
  textFaint: string;
  textPrimary: string;
  cardBg: string;
  cardShadow: string;
  ctaBg: string;
  ctaText: string;
}

export default function FamousCharts({ colors: c, theme }: { colors: FamousChartsColors; theme: Theme }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const filtered = activeCategory
    ? FAMOUS_PERSONS.filter(p => p.category === activeCategory)
    : FAMOUS_PERSONS;

  const goToChart = (p: FamousPerson) => {
    const clock = HOUR_TO_CLOCK[p.hour] ?? { h: 8, mi: 0 };
    const params = new URLSearchParams({
      n: p.name,
      y: String(p.year),
      m: String(p.month),
      d: String(p.day),
      h: String(clock.h),
      mi: String(clock.mi),
      g: p.gender === 'male' ? 'm' : 'f',
    });
    router.push(`/chart?${params.toString()}`);
  };

  return (
    <section className="relative z-10 px-6 md:px-10 lg:px-14 py-20 lg:py-24">
      <div className="mx-auto" style={{ maxWidth: '1280px' }}>
        {/* 标题 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${c.goldLine})` }} />
            <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: c.tagText }}>
              Famous Charts
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${c.goldLine})` }} />
          </div>
          <h2 className={`grad-text ${isDark ? 'grad-text-dark' : 'grad-text-light'} font-bold mb-4 tracking-tight`}
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
            名人命盘库
          </h2>
          <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: c.textSecond }}>
            点击任意名人，即刻查看其紫微命盘 · 出生时辰为公开文献估算值，仅供研究参考
          </p>
        </div>

        {/* 分类筛选 */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(null)}
            className="text-xs px-4 py-1.5 rounded-full transition-all duration-200"
            style={{
              border: `1px solid ${!activeCategory ? c.goldSolid : c.goldLine}`,
              color: !activeCategory ? c.ctaText : c.goldSolid,
              background: !activeCategory ? c.ctaBg : 'transparent',
              fontWeight: !activeCategory ? 600 : 400,
            }}>
            全部
          </motion.button>
          {FAMOUS_CATEGORIES.map(cat => {
            const info = CATEGORY_LABELS[cat];
            const active = activeCategory === cat;
            return (
              <motion.button key={cat}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(active ? null : cat)}
                className="text-xs px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5"
                style={{
                  border: `1px solid ${active ? info.color : c.goldLine}`,
                  color: active ? (isDark ? '#08080a' : '#fff') : c.goldSolid,
                  background: active ? info.color : 'transparent',
                  fontWeight: active ? 600 : 400,
                }}>
                <span className="text-[11px]">{info.icon}</span>
                {cat}
              </motion.button>
            );
          })}
        </div>

        {/* 名人卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((person, i) => {
              const catInfo = CATEGORY_LABELS[person.category] ?? { icon: '★', color: '#d4a843' };
              return (
                <motion.button
                  key={person.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  whileHover={{ y: -4, boxShadow: `0 8px 28px ${catInfo.color}22` }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => goToChart(person)}
                  className="text-left rounded-xl p-5 transition-all duration-200 cursor-pointer group"
                  style={{
                    background: c.cardBg,
                    border: `1px solid ${catInfo.color}30`,
                    boxShadow: c.cardShadow,
                  }}
                >
                  {/* 顶部：分类 + 性别 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ color: catInfo.color, background: `${catInfo.color}12`, border: `1px solid ${catInfo.color}30` }}>
                      {catInfo.icon} {person.category}
                    </span>
                    <span className="text-[10px]" style={{ color: c.textFaint }}>
                      {person.gender === 'male' ? '♂ 男命' : '♀ 女命'}
                    </span>
                  </div>

                  {/* 名字 + 年份 */}
                  <div className="mb-2">
                    <div className="text-base font-semibold tracking-wide group-hover:tracking-wider transition-all duration-200"
                      style={{ color: c.textPrimary }}>
                      {person.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: c.textFaint }}>
                      {person.year}年 · {person.description}
                    </div>
                  </div>

                  {/* 命盘亮点 */}
                  <div className="text-[11px] leading-relaxed mt-3 px-3 py-2.5 rounded-lg"
                    style={{
                      color: c.textSecond,
                      background: `${catInfo.color}08`,
                      border: `1px solid ${catInfo.color}18`,
                    }}>
                    <span className="font-medium mr-1" style={{ color: catInfo.color }}>亮点：</span>
                    {person.notable.length > 60 ? person.notable.slice(0, 60) + '…' : person.notable}
                  </div>

                  {/* 底部提示 */}
                  <div className="flex items-center justify-end mt-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-[10px]" style={{ color: catInfo.color }}>查看命盘</span>
                    <span className="text-[10px]" style={{ color: catInfo.color }}>→</span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-10">
          <p className="text-[10px] tracking-wider" style={{ color: c.textFaint }}>
            ⚠️ 出生时辰为公开文献估算值，仅供文化研究与学习参考
          </p>
        </div>
      </div>
    </section>
  );
}
