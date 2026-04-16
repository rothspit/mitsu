import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getGirlsByBrand, getTodaySchedule } from '@/lib/brand/brand-queries'
import ScheduleSection from '../components/ScheduleSection'
import OtherAreaLinks from '@/components/OtherAreaLinks'
import GirlCard from '@/components/GirlCard'
import { STORE_ID_BY_KEY } from '@/lib/store-map'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export default async function IchikawaPage() {
  const storeId = STORE_ID_BY_KEY.ichikawa
  const [brand, schedules, girls] = await Promise.all([
    getBrand(SLUG),
    getTodaySchedule(SLUG, storeId),
    getGirlsByBrand({ forceSlug: SLUG, storeId }),
  ])

  return (
    <main className="min-h-screen bg-white text-[#1c1917] pb-20">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 戻る
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            市川
          </h1>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 pt-6">
        <p className="text-xs text-[#44403c] leading-relaxed tracking-wider">
          市川・本八幡方面のホテルへ派遣。周辺の待ち合わせもご相談ください。
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-4 pt-10">
        <h2 className="text-sm tracking-[0.2em] text-[#1c1917] mb-6" style={{ fontFamily: serif }}>
          在籍一覧
        </h2>
        {girls.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {girls.map((g) => (
              <GirlCard key={g.id} girl={g} />
            ))}
          </div>
        ) : (
          <p className="text-[#a8a29e] text-sm py-6">準備中</p>
        )}
      </section>

      <ScheduleSection brandId={brand.id} initialSchedules={schedules} storeId={storeId} />
      <div className="max-w-2xl mx-auto px-4">
        <OtherAreaLinks />
      </div>
    </main>
  )
}

