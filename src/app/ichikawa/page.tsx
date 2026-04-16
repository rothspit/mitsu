import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getTodaySchedule } from '@/lib/brand/brand-queries'
import ScheduleSection from '../components/ScheduleSection'
import OtherAreaLinks from '@/components/OtherAreaLinks'
import { HITODUMA_PAGE_TO_STORE_CODE } from '@/lib/hitoduma/hitoduma-store'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export default async function IchikawaPage() {
  const storeCode = HITODUMA_PAGE_TO_STORE_CODE.ichikawa
  const [brand, schedules] = await Promise.all([
    getBrand(SLUG),
    getTodaySchedule(SLUG, { hitodumaStore: storeCode }),
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

      <ScheduleSection brandId={brand.id} initialSchedules={schedules} hitodumaStore={storeCode} />

      <div className="max-w-2xl mx-auto px-4 pt-10">
        <Link
          href="/ichikawa/cast"
          className="block bg-[#fafaf9] border border-[#b8860b]/20 rounded-xl p-5 shadow-sm hover:shadow-md transition"
        >
          <p className="text-[10px] text-[#b8860b] tracking-[0.3em] mb-2" style={{ fontFamily: serif }}>
            CAST LIST
          </p>
          <p className="text-sm text-[#1c1917] tracking-wider" style={{ fontFamily: serif }}>
            在籍一覧を見る →
          </p>
          <p className="text-[11px] text-[#78716c] mt-2 tracking-wider">
            在籍キャストのプロフィールはこちら
          </p>
        </Link>
      </div>
      <div className="max-w-2xl mx-auto px-4">
        <OtherAreaLinks />
      </div>
    </main>
  )
}

