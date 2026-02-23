import type { Metadata } from 'next'
import { Noto_Serif_JP, Noto_Sans_JP } from 'next/font/google'
import { getBrand } from '@/lib/brand/get-brand'
import { BrandProvider } from '@/lib/brand/brand-context'
import { ThemeInjector } from '@/components/brand/theme-injector'
import './globals.css'

const SLUG = 'hitomitsu'

const notoSerif = Noto_Serif_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  preload: false,
  variable: '--font-noto-serif',
})

const notoSans = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  preload: false,
  variable: '--font-noto-sans',
})

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand(SLUG)
  return {
    title: {
      template: '%s｜人妻の蜜',
      default: '人妻の蜜｜西船橋・葛西・錦糸町の熟女・人妻デリヘル',
    },
    description: '西船橋・葛西・錦糸町エリアの人妻・熟女専門デリヘル「人妻の蜜」。30代・40代・50代の魅力的な大人の女性が多数在籍。出張エリアも充実。',
    keywords: ['デリヘル', '人妻', '熟女', '西船橋', '葛西', '錦糸町', '市川', '幕張', '出張'],
    alternates: {
      canonical: 'https://h-mitsu.com',
    },
    openGraph: {
      title: '人妻の蜜｜西船橋・葛西・錦糸町の熟女・人妻デリヘル',
      description: '西船橋・葛西・錦糸町エリアの人妻・熟女専門デリヘル。30代〜50代の魅力的な大人の女性が多数在籍。',
      siteName: brand.name,
      locale: 'ja_JP',
      type: 'website',
      images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '人妻の蜜｜西船橋・葛西・錦糸町の熟女・人妻デリヘル',
      description: '西船橋・葛西・錦糸町エリアの人妻・熟女専門デリヘル。30代〜50代の魅力的な大人の女性が多数在籍。',
      images: ['/main_mitsu.jpg'],
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const brand = await getBrand(SLUG)

  return (
    <html lang="ja">
      <body
        className={`${notoSerif.variable} ${notoSans.variable} antialiased`}
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        <BrandProvider brand={brand}>
          <ThemeInjector />
          {children}
        </BrandProvider>
      </body>
    </html>
  )
}
