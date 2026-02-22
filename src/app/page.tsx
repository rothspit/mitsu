import Link from 'next/link'
import { getBrand } from '@/lib/brand/get-brand'
import { getTodaySchedule, getDiariesByBrand, getGirlsByBrand, getGirlsCount } from '@/lib/brand/brand-queries'
import type { Girl, Schedule, Diary } from '@/lib/brand/brand-queries'
import { getGirlImageUrl } from '@/lib/brand/image-utils'

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

function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = getGirlImageUrl(girl)
  const areaName = schedule.area?.name

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="aspect-[3/4] bg-[#f5f5f4] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={girl?.name || ''} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl opacity-20">👤</span>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm font-medium text-[#1c1917]" style={{ fontFamily: serif }}>
          {girl?.name || '—'}
        </p>
        <p className="text-[10px] text-[#b8860b] mt-1">
          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
        </p>
        <p className="text-[9px] text-[#78716c] mt-0.5">{areaName || '西船橋・葛西・錦糸町'}</p>
      </div>
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
          <span className="text-4xl opacity-15">👤</span>
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

// ============================================
// メインページ
// ============================================

export default async function MitsuPage() {
  const [brand, schedules, diaries, girls, girlsCount] = await Promise.all([
    getBrand(SLUG),
    getTodaySchedule(SLUG),
    getDiariesByBrand({ limit: 8, forceSlug: SLUG }),
    getGirlsByBrand({ limit: 12, forceSlug: SLUG }),
    getGirlsCount(SLUG),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '人妻の蜜',
    description: brand.description || brand.site_tagline || '大人の甘い誘惑…',
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-lg text-[#b8860b] tracking-[0.3em] font-medium"
            style={{ fontFamily: serif }}
          >
            人妻の蜜
          </h1>
          {brand.phone && (
            <a
              href={`tel:${brand.phone}`}
              className="text-[10px] text-[#b8860b] tracking-widest border border-[#b8860b]/40 px-3 py-1.5 hover:bg-[#b8860b]/5 transition"
            >
              TEL
            </a>
          )}
        </div>
      </header>

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
          {brand.site_tagline || '大人の極上癒やし'}
        </p>
        {brand.area && (
          <p className="text-[#a8a29e] text-xs mt-3 tracking-wider">{brand.area}</p>
        )}
      </section>

      {/* ===== 電話 CTA ===== */}
      {brand.phone && (
        <section className="px-4 pb-16">
          <div className="max-w-xs mx-auto text-center">
            <a
              href={`tel:${brand.phone}`}
              className="block border border-[#b8860b]/40 text-[#b8860b] py-4 px-6 tracking-[0.2em] text-base font-medium hover:bg-[#b8860b]/5 transition"
              style={{ fontFamily: serif }}
            >
              ☎ {brand.phone}
            </a>
            <p className="text-[#a8a29e] text-[10px] mt-3 tracking-wider">
              お電話でのご予約・お問い合わせ
            </p>
          </div>
        </section>
      )}

      {/* ===== 本日の出勤 ===== */}
      <section className="py-16 bg-[#fafaf9]">
        <div className="max-w-2xl mx-auto px-4">
          <SectionHeading>本日の出勤</SectionHeading>
          <p className="text-center text-[#b8860b] text-sm tracking-wider mb-6">{schedules.length}名</p>
          {schedules.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {schedules.map((s) => (
                <ScheduleCard key={s.id} schedule={s} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[#a8a29e] text-sm py-8">
              本日の出勤情報はまだありません
            </p>
          )}
        </div>
      </section>

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

      {/* ===== 在籍キャスト ===== */}
      <section className="py-16 bg-[#fafaf9]">
        <div className="max-w-2xl mx-auto px-4">
          <SectionHeading>在籍キャスト</SectionHeading>
          <p className="text-center text-[#b8860b] text-sm tracking-wider mb-6">在籍 {girlsCount}名</p>
          {girls.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {girls.map((g) => (
                  <GirlCard key={g.id} girl={g} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link
                  href="/cast"
                  className="inline-block border border-[#b8860b]/30 text-[#b8860b] text-xs px-8 py-3 tracking-[0.15em] hover:bg-[#b8860b]/5 transition"
                >
                  すべて見る
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-[#a8a29e] text-sm py-8">準備中</p>
          )}
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
            {brand.phone && <p>TEL: {brand.phone}</p>}
          </div>
          <p className="text-[#a8a29e] text-[10px] mt-10">
            &copy; {new Date().getFullYear()} {brand.name} All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* ===== Sticky Footer ===== */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur border-t border-[#b8860b]/15">
        <div className="max-w-md mx-auto flex">
          {brand.phone && (
            <a
              href={`tel:${brand.phone}`}
              className="flex-1 flex flex-col items-center justify-center py-3 text-[#b8860b] hover:bg-[#b8860b]/5 transition"
            >
              <span className="text-base">☎</span>
              <span className="text-[9px] tracking-wider mt-0.5">電話予約</span>
            </a>
          )}
          <Link
            href="/schedule"
            className="flex-1 flex flex-col items-center justify-center py-3 text-[#78716c] hover:text-[#b8860b] transition"
          >
            <span className="text-base">📅</span>
            <span className="text-[9px] tracking-wider mt-0.5">出勤情報</span>
          </Link>
          <Link
            href="/cast"
            className="flex-1 flex flex-col items-center justify-center py-3 text-[#78716c] hover:text-[#b8860b] transition"
          >
            <span className="text-base">👤</span>
            <span className="text-[9px] tracking-wider mt-0.5">キャスト</span>
          </Link>
          <Link
            href="/diary"
            className="flex-1 flex flex-col items-center justify-center py-3 text-[#78716c] hover:text-[#b8860b] transition"
          >
            <span className="text-base">📝</span>
            <span className="text-[9px] tracking-wider mt-0.5">日記</span>
          </Link>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </main>
  )
}
