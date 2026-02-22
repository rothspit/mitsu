import Link from 'next/link'
import type { Metadata } from 'next'
import { getBrand } from '@/lib/brand/get-brand'
import { getDiariesByBrand } from '@/lib/brand/brand-queries'
import type { Diary } from '@/lib/brand/brand-queries'

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand(SLUG)
  return {
    title: `写メ日記｜${brand.name}`,
    description: `${brand.name}のキャストによる写メ日記一覧。`,
  }
}

function DiaryCard({ diary }: { diary: Diary }) {
  const girlName = diary.girl ? (diary.girl as any).name : null
  const date = diary.published_at
    ? new Date(diary.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <Link
      href={`/diaries/${diary.slug}`}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group"
    >
      <div className="aspect-video bg-[#f5f5f4] flex items-center justify-center overflow-hidden">
        {diary.thumbnail_url ? (
          <img
            src={diary.thumbnail_url}
            alt={diary.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-3xl opacity-10">📝</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-[#1c1917] line-clamp-2">{diary.title}</p>
        <div className="flex items-center justify-between mt-2">
          {girlName && <p className="text-[10px] text-[#b8860b]">{girlName}</p>}
          <p className="text-[10px] text-[#78716c] ml-auto">{date}</p>
        </div>
      </div>
    </Link>
  )
}

export default async function MitsuDiariesPage() {
  const [brand, diaries] = await Promise.all([
    getBrand(SLUG),
    getDiariesByBrand({ forceSlug: SLUG }),
  ])

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 戻る
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            写メ日記
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-center text-[#a8a29e] text-xs tracking-wider mb-10">{brand.name}</p>

        {diaries.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {diaries.map((d) => (
              <DiaryCard key={d.id} diary={d} />
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
