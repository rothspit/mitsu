import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getTodaySchedule, getDiariesByBrand } from '@/lib/brand/brand-queries'
import type { Diary } from '@/lib/brand/brand-queries'
import ScheduleSection from './components/ScheduleSection'
import StoreAreaNav from '@/components/StoreAreaNav'
import OtherAreaLinks from '@/components/OtherAreaLinks'
import WaitLocationPin from '@/components/WaitLocationPin'

export const revalidate = 60

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

// ============================================
// サブコンポーネント
// ============================================

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-10">
      <h3
        className="text-sm tracking-[0.2em] text-[#1c1917] mb-3"
        style={{ fontFamily: serif }}
      >
        {children}
      </h3>
      <div className="w-10 h-px bg-[#b8860b] mx-auto" />
    </div>
  )
}

function DiaryCard({ diary }: { diary: Diary }) {
  const girlName = diary.girl ? (diary.girl as any).name : null
  const imageUrl = (diary as any).image_url || diary.thumbnail_url
  const date = diary.published_at
    ? new Date(diary.published_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    : ''

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="aspect-square bg-[#f5f5f4] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={diary.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl opacity-15">📝</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-[#1c1917] truncate">{diary.title}</p>
        <div className="flex items-center justify-between mt-1.5">
          {girlName && <p className="text-[10px] text-[#b8860b]">{girlName}</p>}
          <p className="text-[10px] text-[#78716c] ml-auto">{date}</p>
        </div>
        {diary.content && (
          <p className="text-[10px] text-[#44403c] leading-relaxed line-clamp-2 mt-1.5">{diary.content}</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// メインページ
// ============================================

export default async function MitsuPage() {
  const [brand, schedules, diaries] = await Promise.all([
    getBrand(SLUG),
    getTodaySchedule(SLUG),
    getDiariesByBrand({ limit: 8, forceSlug: SLUG }),
  ])

  const taglineRaw = brand.site_tagline || '大人の極上癒やし'
  const tagline = '極上の癒しを求道'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '人妻の蜜',
    description: brand.description || tagline || '甘い誘惑…',
    url: 'https://h-mitsu.com',
    telephone: brand.phone || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: '船橋市',
      addressRegion: '千葉県',
      addressCountry: 'JP',
    },
    areaServed: ['西船橋', '葛西', '錦糸町'],
    openingHours: 'Mo-Su 10:00-28:00',
  }

  return (
    <main className="min-h-screen bg-white text-[#1c1917] pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1
            className="text-lg text-[#b8860b] tracking-[0.3em] font-medium"
            style={{ fontFamily: serif }}
          >
            人妻の蜜
          </h1>
        </div>
      </header>

      <StoreAreaNav />

      {/* ===== Hero ===== */}
      <section className="py-20 px-4 text-center">
        <p className="text-[#b8860b] text-[10px] tracking-[0.5em] mb-8 uppercase">
          Delivery Health
        </p>
        <h2
          className="text-3xl md:text-4xl font-medium tracking-[0.3em] text-[#1c1917] mb-6"
          style={{ fontFamily: serif }}
        >
          人妻の蜜
        </h2>
        <div className="w-12 h-px bg-[#b8860b] mx-auto mb-6" />
        <p className="text-[#78716c] text-sm tracking-wider leading-relaxed">
          {tagline}
        </p>
        {brand.area && (
          <p className="text-[#a8a29e] text-xs mt-3 tracking-wider">{brand.area}</p>
        )}

        {/* 下に出勤情報セクションがあるため、ここでは導線を置かない */}
      </section>

      {/* ===== 出勤情報（日付切り替え対応） ===== */}
      <ScheduleSection brandId={brand.id} initialSchedules={schedules} locationPinLabel="西船橋" />

      {/* ===== 写メ日記 ===== */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <SectionHeading>写メ日記</SectionHeading>
          {diaries.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {diaries.map((d) => (
                  <DiaryCard key={d.id} diary={d} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link
                  href="/diary"
                  className="inline-block border border-[#b8860b]/30 text-[#b8860b] text-xs px-8 py-3 tracking-[0.15em] hover:bg-[#b8860b]/5 transition"
                >
                  すべての写メ日記を見る
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-[#a8a29e] text-sm py-8">準備中</p>
          )}
        </div>
      </section>

      {/* ===== エリア別入口（トップはダイジェストに徹する） ===== */}
      <section className="py-16 bg-[#fafaf9]">
        <div className="max-w-2xl mx-auto px-4">
          <SectionHeading>エリアを選ぶ</SectionHeading>
          <p className="text-center text-[#78716c] text-xs tracking-wider mb-8">
            在籍・出勤情報は各店舗ページでご確認ください。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                href: '/nishifuna',
                title: '西船橋',
                desc: '西船橋店の出勤情報',
              },
              {
                href: '/kasai',
                title: '葛西',
                desc: '葛西店の出勤情報',
              },
              {
                href: '/kinshicho',
                title: '錦糸町',
                desc: '錦糸町店の出勤情報',
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="bg-white rounded-xl border border-[#b8860b]/20 shadow-sm hover:shadow-md transition p-5"
              >
                <p className="text-xs text-[#b8860b] tracking-[0.25em] mb-2" style={{ fontFamily: serif }}>
                  AREA
                </p>
                <p className="text-base font-medium tracking-wider text-[#1c1917]" style={{ fontFamily: serif }}>
                  {a.title}
                </p>
                <p className="text-[11px] text-[#78716c] mt-2 tracking-wider">{a.desc}</p>
                <p className="text-[11px] text-[#b8860b] mt-4 tracking-wider">見る →</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/schedule"
              className="inline-block border border-[#b8860b]/30 text-[#b8860b] text-xs px-8 py-3 tracking-[0.15em] hover:bg-[#b8860b]/5 transition"
            >
              出勤情報（総合）を見る
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#fafaf9] border-t border-[#b8860b]/10">
        <div className="w-full max-w-xs mx-auto px-4 py-16 text-center">
          <p
            className="text-base text-[#b8860b] tracking-[0.3em] mb-4"
            style={{ fontFamily: serif }}
          >
            人妻の蜜
          </p>
          <div className="w-8 h-px bg-[#b8860b]/40 mx-auto mb-6" />
          <div className="text-[#78716c] text-xs space-y-1.5 tracking-wider">
            {brand.area && <p>{brand.area}</p>}
            <p>営業時間: 10:00 - 翌4:00</p>
          </div>
          <OtherAreaLinks />
          <p className="text-[#a8a29e] text-[10px] mt-10">
            &copy; {new Date().getFullYear()} {brand.name} All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Sticky Footer is now handled by CtaBar component in layout.tsx */}
    </main>
  )
}

