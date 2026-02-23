import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '錦糸町の出勤情報 | 人妻の蜜 錦糸町の熟女デリヘル',
  description: '人妻の蜜 錦糸町エリアの出勤情報。錦糸町で本日出勤中の人妻・熟女キャストをチェック。',
  keywords: ['デリヘル', '錦糸町', '出勤情報', '人妻', '熟女', 'スケジュール'],
  alternates: {
    canonical: 'https://h-mitsu.com/kinshicho',
  },
  openGraph: {
    title: '錦糸町の出勤情報 | 人妻の蜜',
    description: '人妻の蜜 錦糸町エリアの出勤情報。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '錦糸町の出勤情報 | 人妻の蜜',
    images: ['/main_mitsu.jpg'],
  },
}

export default function KinshichoLayout({ children }: { children: React.ReactNode }) {
  return children
}
