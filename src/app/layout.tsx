import type { Metadata } from 'next'
import { Noto_Serif_JP, Noto_Sans_JP } from 'next/font/google'
import { getBrand } from '@/lib/brand/get-brand'
import { BrandProvider } from '@/lib/brand/brand-context'
import { ThemeInjector } from '@/components/brand/theme-injector'
import AgeVerification from '@/components/AgeVerification'
import CtaBar from '@/components/CtaBar'
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
  const siteTitle = '【公式】人妻の蜜（ひとづまのみつ）| 西船橋・葛西・錦糸町のデリヘル'
  const siteDescription =
    '西船橋・葛西・錦糸町で人妻・熟女デリヘルをお探しなら「人妻の蜜」。厳選キャストが極上の癒やしをお届け。出勤情報・写メ日記も毎日更新。'
  return {
    title: {
      template: '%s | 人妻の蜜（ひとづまのみつ）',
      default: siteTitle,
    },
    description: siteDescription,
    keywords: ['デリヘル', '人妻', '熟女', '西船橋', '葛西', '錦糸町', '市川', '幕張', '出張'],
    alternates: {
      canonical: 'https://h-mitsu.com',
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: brand.name,
      locale: 'ja_JP',
      type: 'website',
      images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
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
        <AgeVerification />
        <BrandProvider brand={brand}>
          <ThemeInjector />
          {children}
          <CtaBar />
        </BrandProvider>
      </body>
    </html>
  )
}
