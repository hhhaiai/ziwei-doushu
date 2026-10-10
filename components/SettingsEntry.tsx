'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 全局的 AI 设置入口。
 *
 * 挂在 app/layout.tsx 上，所以每个页面右下角都能看到；
 * 但它本身是运维性质的功能，不该出现在营销页面最显眼的位置，
 * 所以默认只露一个齿轮图标，鼠标悬停 / 键盘聚焦时才展开「AI 设置」文字。
 * 在 /settings 页面上会自动隐藏（没必要自己链自己）。
 */
export default function SettingsEntry() {
  const pathname = usePathname();

  if (pathname === '/settings') return null;

  return (
    <Link
      href="/settings"
      title="AI 服务商设置"
      aria-label="AI 服务商设置"
      className="settings-fab"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      <span>AI 设置</span>
    </Link>
  );
}
