import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Audio Chat Visualizer',
  description: '透過 3D 視覺化增強 AI 語音互動的沉浸式體驗平台',
  keywords: ['AI', 'Audio', '3D', 'Visualization', 'Chat', 'Voice'],
  authors: [{ name: 'AI Audio Team' }],
  openGraph: {
    title: 'AI Audio Chat Visualizer',
    description: '透過 3D 視覺化增強 AI 語音互動的沉浸式體驗平台',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
