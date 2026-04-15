import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '西船橋のデリヘルなら人妻の蜜 西船橋店 | 人妻・熟女専門の熟成風俗',
  description:
    '西船橋エリアで人妻・熟女デリヘルをお探しなら人妻の蜜 西船橋店。厳選キャストが極上の癒やしを提供。西船橋駅周辺へ即配、出勤情報も毎日更新。',
  keywords: ['西船橋', 'デリヘル', '人妻', '熟女', '出勤情報', '人妻の蜜'],
  alternates: {
    canonical: 'https://h-mitsu.com/nishifuna',
  },
  openGraph: {
    title: '西船橋のデリヘルなら人妻の蜜 西船橋店 | 人妻・熟女専門の熟成風俗',
    description:
      '西船橋エリアで人妻・熟女デリヘルをお探しなら人妻の蜜 西船橋店。出勤情報を写真付きでご案内。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '西船橋のデリヘルなら人妻の蜜 西船橋店 | 人妻・熟女専門の熟成風俗',
    images: ['/main_mitsu.jpg'],
  },
}

export default function NishifunaLayout({ children }: { children: React.ReactNode }) {
  return children
}
