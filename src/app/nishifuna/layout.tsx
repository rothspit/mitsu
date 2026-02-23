import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '西船橋の出勤情報 | 人妻の蜜 西船橋の熟女デリヘル',
  description: '人妻の蜜 西船橋エリアの出勤情報。西船橋で本日出勤中の人妻・熟女キャストをチェック。',
  keywords: ['デリヘル', '西船橋', '出勤情報', '人妻', '熟女', 'スケジュール'],
  alternates: {
    canonical: 'https://h-mitsu.com/nishifuna',
  },
  openGraph: {
    title: '西船橋の出勤情報 | 人妻の蜜',
    description: '人妻の蜜 西船橋エリアの出勤情報。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '西船橋の出勤情報 | 人妻の蜜',
    images: ['/main_mitsu.jpg'],
  },
}

export default function NishifunaLayout({ children }: { children: React.ReactNode }) {
  return children
}
