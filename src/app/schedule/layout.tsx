import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '出勤情報 | 人妻の蜜 西船橋・錦糸町・葛西の熟女デリヘル',
  description: '人妻の蜜の出勤情報。西船橋・錦糸町・葛西エリアで本日出勤中の熟女キャストをチェック。週間・月間スケジュールも確認できます。',
  keywords: ['デリヘル', '出勤情報', '西船橋', '錦糸町', '葛西', '人妻', '熟女', 'スケジュール'],
  alternates: {
    canonical: 'https://h-mitsu.com/schedule',
  },
  openGraph: {
    title: '出勤情報 | 人妻の蜜 西船橋・錦糸町・葛西の熟女デリヘル',
    description: '人妻の蜜の出勤情報。本日出勤中の熟女キャストをチェック。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '出勤情報 | 人妻の蜜',
    images: ['/main_mitsu.jpg'],
  },
}

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children
}
