import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getTodaySchedule } from '@/lib/brand/brand-queries'
import ScheduleSection from '../components/ScheduleSection'
import StoreAreaNav from '@/components/StoreAreaNav'
import OtherAreaLinks from '@/components/OtherAreaLinks'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export default async function NishifunaPage() {
  const [brand, schedules] = await Promise.all([getBrand(SLUG), getTodaySchedule(SLUG)])

  return (
    <main className="min-h-screen bg-white text-[#1c1917] pb-20">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 戻る
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            人妻の蜜 西船橋店
          </h1>
        </div>
      </header>

      <StoreAreaNav />

      <section className="max-w-2xl mx-auto px-4 pt-5">
        <p className="text-xs text-[#44403c] leading-relaxed tracking-wider">
          西船橋駅周辺のホテルへ即派遣。船橋・幕張・市川市方面も送迎対応でご案内します。
        </p>
        <div className="mt-2 text-[11px] text-[#78716c] tracking-wider">
          <Link href="/kasai" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
            葛西店の出勤表はこちら
          </Link>
          <span className="mx-2 text-[#d6d3d1]" aria-hidden>
            ·
          </span>
          <Link href="/kinshicho" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
            錦糸町店の出勤表はこちら
          </Link>
        </div>
      </section>

      <ScheduleSection brandId={brand.id} initialSchedules={schedules} />

      <div className="max-w-2xl mx-auto px-4">
        <OtherAreaLinks />
      </div>
    </main>
  )
}

