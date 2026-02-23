import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '葛西の出勤情報 | 人妻の蜜 葛西の熟女デリヘル',
  description: '人妻の蜜 葛西エリアの出勤情報。葛西で本日出勤中の人妻・熟女キャストをチェック。',
  keywords: ['デリヘル', '葛西', '出勤情報', '人妻', '熟女', 'スケジュール'],
  alternates: {
    canonical: 'https://h-mitsu.com/kasai',
  },
  openGraph: {
    title: '葛西の出勤情報 | 人妻の蜜',
    description: '人妻の蜜 葛西エリアの出勤情報。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '葛西の出勤情報 | 人妻の蜜',
    images: ['/main_mitsu.jpg'],
  },
}

export default function KasaiLayout({ children }: { children: React.ReactNode }) {
  return children
}
