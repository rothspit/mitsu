import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '葛西のデリヘルなら人妻の蜜 葛西店 | 江戸川区・西葛西エリアも送迎対応',
  description:
    '葛西エリアで人妻・熟女デリヘルをお探しなら人妻の蜜 葛西店。葛西駅・西葛西駅周辺へ即派遣、江戸川区内も送迎対応。出勤情報・写メ日記も毎日更新。',
  keywords: ['葛西', 'デリヘル', '人妻', '熟女', '出勤情報', '人妻の蜜'],
  alternates: {
    canonical: 'https://h-mitsu.com/kasai',
  },
  openGraph: {
    title: '葛西のデリヘルなら人妻の蜜 葛西店 | 江戸川区・西葛西エリアも送迎対応',
    description:
      '葛西エリアで人妻・熟女デリヘルをお探しなら人妻の蜜 葛西店。出勤情報を写真付きでご案内。',
    images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '葛西のデリヘルなら人妻の蜜 葛西店 | 江戸川区・西葛西エリアも送迎対応',
    images: ['/main_mitsu.jpg'],
  },
}

export default function KasaiLayout({ children }: { children: React.ReactNode }) {
  return children
}
