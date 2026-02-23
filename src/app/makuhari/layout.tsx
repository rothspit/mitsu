import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '幕張 デリヘル｜人妻の蜜 出張対応',
  description: '幕張エリアへの出張デリヘル「人妻の蜜」。西船橋店より出張対応いたします。30代〜50代の人妻・熟女キャストがお伺いします。',
  keywords: ['幕張', 'デリヘル', '出張', '人妻', '熟女', '人妻の蜜'],
  alternates: {
    canonical: 'https://h-mitsu.com/makuhari',
  },
  openGraph: {
    title: '幕張 デリヘル｜人妻の蜜 出張対応',
    description: '幕張エリアへの出張デリヘル「人妻の蜜」。西船橋店より出張対応。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '幕張 デリヘル｜人妻の蜜 出張対応',
    images: ['/main_mitsu.jpg'],
  },
}

export default function MakuhariLayout({ children }: { children: React.ReactNode }) {
  return children
}
