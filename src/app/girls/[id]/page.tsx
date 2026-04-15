import type { Metadata } from 'next'
import { getBrand } from '@/lib/brand/get-brand'
import { getGirlById, getWeekScheduleByGirl } from '@/lib/brand/brand-queries'
import type { Schedule } from '@/lib/brand/brand-queries'
import { getGirlImageUrl } from '@/lib/brand/image-utils'
import MitsuGirlDetail from './detail'

const SLUG = 'hitomitsu'

function getMonday(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(now)
  mon.setDate(diff)
  return mon.toISOString().slice(0, 10)
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const [brand, girl] = await Promise.all([getBrand(SLUG), getGirlById(id, SLUG)])
  if (!girl) return { title: `キャスト不明｜${brand.name}` }
  const imageUrl = getGirlImageUrl(girl) ?? '/main_mitsu.jpg'
  const extra = girl as any
  const ageText = girl.age ? `${girl.age}歳` : ''
  const cupText = extra.cup ? ` / ${extra.cup}カップ` : ''
  const titleText = `${girl.name}(${ageText})｜人妻の蜜 西船橋・葛西・錦糸町の人妻デリヘル`
  const descText = `${girl.name}(${ageText}${cupText})のプロフィール。西船橋・葛西・錦糸町エリアの人妻デリヘル「人妻の蜜」在籍キャスト。コース料金・出勤情報も掲載。`
  return {
    title: titleText,
    description: descText,
    keywords: ['デリヘル', '人妻', '西船橋', '葛西', '錦糸町', '指名', girl.name],
    alternates: {
      canonical: `https://h-mitsu.com/girls/${id}`,
    },
    openGraph: {
      title: titleText,
      description: descText,
      type: 'profile',
      images: [{ url: imageUrl, width: 600, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      images: [imageUrl],
    },
  }
}

export default async function MitsuGirlDetailPage({ params }: Props) {
  const { id } = await params
  const weekStart = getMonday()
  const [brand, girl, weekSchedules] = await Promise.all([
    getBrand(SLUG),
    getGirlById(id, SLUG),
    getWeekScheduleByGirl(id, weekStart, SLUG),
  ])
  return <MitsuGirlDetail girl={girl} brand={brand} weekSchedules={weekSchedules} weekStart={weekStart} />
}
