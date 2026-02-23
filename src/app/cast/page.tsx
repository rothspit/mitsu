import Link from 'next/link'
import type { Metadata } from 'next'
import { getBrand } from '@/lib/brand/get-brand'
import { getGirlsByBrand, getGirlsCount } from '@/lib/brand/brand-queries'
import type { Girl } from '@/lib/brand/brand-queries'
import { getGirlImageUrl } from '@/lib/brand/image-utils'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '在籍キャスト一覧｜人妻の蜜',
    description: '人妻の蜜の在籍キャスト一覧。西船橋・葛西・錦糸町エリアで活躍中の30代〜50代の魅力的な人妻・熟女キャストを写真付きでご紹介。',
    keywords: ['在籍キャスト', 'デリヘル', '人妻', '熟女', '西船橋', '葛西', '錦糸町'],
    alternates: {
      canonical: 'https://h-mitsu.com/cast',
    },
    openGraph: {
      title: '在籍キャスト一覧｜人妻の蜜',
      description: '人妻の蜜の在籍キャスト一覧。30代〜50代の魅力的な人妻・熟女キャストを写真付きでご紹介。',
      images: [{ url: '/main_mitsu.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '在籍キャスト一覧｜人妻の蜜',
      images: ['/main_mitsu.jpg'],
    },
  }
}

function GirlCard({ girl }: { girl: Girl }) {
  const imageUrl = getGirlImageUrl(girl)

  return (
    <Link
      href={`/girls/${girl.id}`}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group"
    >
      <div className="aspect-[3/4] bg-[#f5f5f4] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={girl.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-5xl opacity-10">&#x1f464;</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-[#1c1917]" style={{ fontFamily: serif }}>
          {girl.name}
        </p>
        {girl.age && <p className="text-[10px] text-[#78716c] mt-0.5">{girl.age}歳</p>}
        {girl.catch_copy && (
          <p className="text-[10px] text-[#78716c] mt-1 truncate">{girl.catch_copy}</p>
        )}
      </div>
    </Link>
  )
}

export default async function MitsuCastPage() {
  const [brand, girls, girlsCount] = await Promise.all([
    getBrand(SLUG),
    getGirlsByBrand({ forceSlug: SLUG }),
    getGirlsCount(SLUG),
  ])

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917] pb-20">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            &#x2190; 戻る
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            在籍キャスト
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-center text-[#a8a29e] text-xs tracking-wider mb-2">
          {brand.name}｜{brand.area || ''}
        </p>
        <p className="text-center text-[#b8860b] text-sm tracking-wider mb-10">
          在籍 {girlsCount}名
        </p>

        {girls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {girls.map((g) => (
              <GirlCard key={g.id} girl={g} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#a8a29e] text-sm">準備中</p>
          </div>
        )}
      </div>
    </main>
  )
}
