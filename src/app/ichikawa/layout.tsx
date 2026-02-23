import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '市川の出勤情報 | 人妻の蜜 市川への出張デリヘル',
  description: '人妻の蜜 市川エリアへの出張対応。西船橋店より出張で人妻・熟女キャストがお伺いします。',
  keywords: ['デリヘル', '市川', '出張', '人妻', '熟女', '出勤情報'],
  alternates: {
    canonical: 'https://h-mitsu.com/ichikawa',
  },
  openGraph: {
    title: '市川の出勤情報 | 人妻の蜜',
    description: '人妻の蜜 市川エリアへの出張対応。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '市川の出勤情報 | 人妻の蜜',
    images: ['/main_mitsu.jpg'],
  },
}

export default function IchikawaLayout({ children }: { children: React.ReactNode }) {
  return children
}
