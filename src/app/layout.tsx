import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '交管法规案例推演助手 | 中国人民公安大学',
    template: '%s | 交管法规案例推演助手',
  },
  description:
    '专为中国人民公安大学交通管理工程专业新生设计的AI辅助学习工具，帮助理解交通事故责任认定的逻辑和法规依据。',
  keywords: [
    '交通事故',
    '责任认定',
    '交通法规',
    '案例分析',
    '道路交通安全法',
    '公安大学',
  ],
  authors: [{ name: '中国人民公安大学' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {children}
      </body>
    </html>
  );
}
