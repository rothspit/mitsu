import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '錦糸町 デリヘル｜人妻の蜜 出勤情報',
  description: '錦糸町エリアの人妻・熟女デリヘル「人妻の蜜」の出勤情報。本日出勤中のキャストを写真付きでご紹介。30代〜50代の魅力的な大人の女性が錦糸町でお待ちしております。',
  keywords: ['錦糸町', 'デリヘル', '人妻', '熟女', '出勤情報', '人妻の蜜'],
  alternates: {
    canonical: 'https://h-mitsu.com/kinshicho',
  },
  openGraph: {
    title: '錦糸町 デリヘル｜人妻の蜜 出勤情報',
    description: '錦糸町エリアの人妻デリヘル「人妻の蜜」本日の出勤キャスト一覧。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '錦糸町 デリヘル｜人妻の蜜 出勤情報',
    images: ['/main_mitsu.jpg'],
  },
}

export default function KinshichoLayout({ children }: { children: React.ReactNode }) {
  return children
}
