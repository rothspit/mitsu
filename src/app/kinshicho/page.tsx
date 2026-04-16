import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getTodaySchedule } from '@/lib/brand/brand-queries'
import ScheduleSection from '../components/ScheduleSection'
import StoreAreaNav from '@/components/StoreAreaNav'
import OtherAreaLinks from '@/components/OtherAreaLinks'
import { HITODUMA_PAGE_TO_STORE_CODE } from '@/lib/hitoduma/hitoduma-store'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export default async function KinshichoPage() {
  const storeCode = HITODUMA_PAGE_TO_STORE_CODE.kinshicho
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
            人妻の蜜 錦糸町店
          </h1>
        </div>
      </header>

      <StoreAreaNav />

      <section className="max-w-2xl mx-auto px-4 pt-5">
        <p className="text-xs text-[#44403c] leading-relaxed tracking-wider">
          錦糸町駅周辺のホテルへ即派遣。墨田区・江東区エリアも送迎対応でご案内します。
        </p>
        <p className="mt-2 text-[11px] text-[#78716c] leading-relaxed tracking-wider">
          錦糸町店は新規プレオープン予定です。
        </p>
        <div className="mt-2 text-[11px] text-[#78716c] tracking-wider">
          <Link href="/nishifuna" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
            西船橋店の出勤表はこちら
          </Link>
          <span className="mx-2 text-[#d6d3d1]" aria-hidden>
            ·
          </span>
          <Link href="/kasai" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
            葛西店の出勤表はこちら
          </Link>
        </div>
      </section>

      <ScheduleSection brandId={brand.id} initialSchedules={schedules} hitodumaStore={storeCode} />

      <div className="max-w-2xl mx-auto px-4 pt-10">
        <Link
          href="/kinshicho/cast"
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
