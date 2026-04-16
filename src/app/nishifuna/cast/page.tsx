import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getGirlsByBrand } from '@/lib/brand/brand-queries'
import GirlCard from '@/components/GirlCard'
import { STORE_ID_BY_KEY } from '@/lib/store-map'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export default async function NishifunaCastPage() {
  const storeId = STORE_ID_BY_KEY.nishifuna
  const [brand, girls] = await Promise.all([
    getBrand(SLUG),
    getGirlsByBrand({ forceSlug: SLUG, storeId }),
  ])

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917] pb-20">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/nishifuna" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 店舗トップへ
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            在籍キャスト（西船橋店）
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-center text-[#a8a29e] text-xs tracking-wider mb-10">
          {brand.name}｜西船橋店
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

