import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '幕張の出勤情報 | 人妻の蜜 幕張への出張デリヘル',
  description: '人妻の蜜 幕張エリアへの出張対応。西船橋店より出張で人妻・熟女キャストがお伺いします。',
  keywords: ['デリヘル', '幕張', '出張', '人妻', '熟女', '出勤情報'],
  alternates: {
    canonical: 'https://h-mitsu.com/makuhari',
  },
  openGraph: {
    title: '幕張の出勤情報 | 人妻の蜜',
    description: '人妻の蜜 幕張エリアへの出張対応。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '幕張の出勤情報 | 人妻の蜜',
    images: ['/main_mitsu.jpg'],
  },
}

export default function MakuhariLayout({ children }: { children: React.ReactNode }) {
  return children
}
