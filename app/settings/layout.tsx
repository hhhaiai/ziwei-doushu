import type { Metadata } from 'next';

/**
 * /settings 是运维页面，不该出现在搜索结果里。
 * 页面本身是 client component（不能导出 metadata），所以在这里设 noindex；
 * app/robots.ts 里也同步 disallow 了 /settings，两道一起上。
 */
export const metadata: Metadata = {
  title: 'AI 服务商设置 · 紫微命盘',
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
