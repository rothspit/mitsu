import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '錦糸町のデリヘル 人妻の蜜 錦糸町店 | 2024年秋・新店舗オープン',
  description:
    '錦糸町で人妻・熟女デリヘルをお探しなら人妻の蜜 錦糸町店。厳選キャストが極上の癒やしを提供。錦糸町駅周辺へ即配、出勤情報も毎日更新。',
  keywords: ['錦糸町', 'デリヘル', '人妻', '熟女', '出勤情報', '人妻の蜜', '新店舗'],
  alternates: {
    canonical: 'https://h-mitsu.com/kinshicho',
  },
  openGraph: {
    title: '錦糸町のデリヘル 人妻の蜜 錦糸町店 | 2024年秋・新店舗オープン',
    description: '錦糸町で人妻・熟女デリヘルをお探しなら人妻の蜜 錦糸町店。出勤情報を写真付きでご案内。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '錦糸町のデリヘル 人妻の蜜 錦糸町店 | 2024年秋・新店舗オープン',
    images: ['/main_mitsu.jpg'],
  },
}

export default function KinshichoLayout({ children }: { children: React.ReactNode }) {
  return children
}

