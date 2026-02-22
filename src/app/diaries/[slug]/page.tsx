import Link from 'next/link'
import type { Metadata } from 'next'
import { getBrand } from '@/lib/brand/get-brand'
import { getDiaryBySlug } from '@/lib/brand/brand-queries'
import { getGirlImageUrl } from '@/lib/brand/image-utils'

const SLUG = 'hitomitsu'
const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [brand, diary] = await Promise.all([getBrand(SLUG), getDiaryBySlug(slug, SLUG)])
  if (!diary) return { title: `記事が見つかりません｜${brand.name}` }
  const ogImage = diary.thumbnail_url || '/main_mitsu.jpg'
  const descText = diary.content?.slice(0, 120) || '西船橋・錦糸町の人妻デリヘル「人妻の蜜」キャストの写メ日記。'
  return {
    title: `${diary.title} | 人妻の蜜 写メ日記`,
    description: descText,
    keywords: ['写メ日記', '人妻', '西船橋', '錦糸町', 'デリヘル'],
    alternates: {
      canonical: `https://h-mitsu.com/diaries/${slug}`,
    },
    openGraph: {
      title: `${diary.title} | 人妻の蜜 写メ日記`,
      description: descText,
      type: 'article',
      publishedTime: diary.published_at || undefined,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${diary.title} | 人妻の蜜 写メ日記`,
      images: [ogImage],
    },
  }
}

export default async function MitsuDiaryDetailPage({ params }: Props) {
  const { slug } = await params
  const [brand, diary] = await Promise.all([getBrand(SLUG), getDiaryBySlug(slug, SLUG)])

  if (!diary) {
    return (
      <main className="min-h-screen bg-white text-[#1c1917] flex flex-col items-center justify-center p-4">
        <p className="text-[#78716c] text-base mb-6">記事が見つかりません</p>
        <Link
          href="/diaries"
          className="border border-[#b8860b]/30 text-[#b8860b] text-xs px-6 py-2.5 tracking-wider hover:bg-[#b8860b]/5 transition"
        >
          日記一覧に戻る
        </Link>
      </main>
    )
  }

  const girlName = diary.girl ? (diary.girl as any).name : null
  const girlImage = diary.girl ? getGirlImageUrl(diary.girl) : null
  const date = diary.published_at
    ? new Date(diary.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <main className="min-h-screen bg-white text-[#1c1917] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/diaries" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 日記一覧
          </Link>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-5 py-12">
        {/* Thumbnail */}
        {diary.thumbnail_url && (
          <div className="aspect-video bg-[#f5f5f4] rounded-lg overflow-hidden mb-8">
            <img
              src={diary.thumbnail_url}
              alt={diary.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1
          className="text-xl md:text-2xl font-medium tracking-wider leading-relaxed text-[#1c1917] mb-5"
          style={{ fontFamily: serif }}
        >
          {diary.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-8">
          {girlName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#f5f5f4] flex items-center justify-center overflow-hidden">
                {girlImage ? (
                  <img src={girlImage} alt={girlName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs opacity-30">👤</span>
                )}
              </div>
              <span className="text-sm text-[#b8860b]">{girlName}</span>
            </div>
          )}
          {date && <span className="text-xs text-[#a8a29e]">{date}</span>}
        </div>

        <div className="w-10 h-px bg-[#b8860b] mb-10" />

        {/* Content */}
        <div className="text-sm text-[#44403c] leading-loose whitespace-pre-line">
          {diary.content}
        </div>

        <div className="w-10 h-px bg-[#b8860b]/30 my-10" />

        {/* Back */}
        <div className="text-center">
          <Link
            href="/diaries"
            className="inline-block border border-[#b8860b]/30 text-[#b8860b] text-xs px-8 py-3 tracking-[0.15em] hover:bg-[#b8860b]/5 transition"
          >
            日記一覧に戻る
          </Link>
        </div>
      </article>
    </main>
  )
}
