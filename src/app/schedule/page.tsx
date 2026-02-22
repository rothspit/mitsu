'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getGirlImageUrl } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"
const BRAND_SLUG = 'hitomitsu'
const MAX_OFFSET_DAYS = 7

function jstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`
}

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000)
}

function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

function ScheduleRow({ schedule }: { schedule: Schedule }) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = getGirlImageUrl(girl)
  const areaName = (schedule.area as any)?.name

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="w-16 h-16 rounded-lg bg-[#f5f5f4] flex-shrink-0 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={girl?.name || ''} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl opacity-15">👤</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1c1917] truncate" style={{ fontFamily: serif }}>
          {girl?.name || '—'}
        </p>
        {girl?.age && <p className="text-[10px] text-[#78716c] mt-0.5">{girl.age}歳</p>}
        {areaName && <p className="text-[10px] text-[#b8860b]/70 mt-0.5">{areaName}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-medium text-[#b8860b]" style={{ fontFamily: serif }}>
          {formatTime(schedule.start_time)}
        </p>
        <p className="text-[10px] text-[#a8a29e]">〜 {formatTime(schedule.end_time)}</p>
      </div>
    </Link>
  )
}

export default function MitsuSchedulePage() {
  const today = jstToday()
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialDate = params?.get('date') || today

  const [currentDate, setCurrentDate] = useState(initialDate)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Resolve brand UUID
  useEffect(() => {
    supabase.from('brands').select('id').eq('slug', BRAND_SLUG).single()
      .then(({ data }) => { if (data) setBrandId(data.id) })
  }, [])

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    if (!brandId) return
    setLoading(true)
    const { data } = await supabase
      .from('schedules')
      .select('*, girl:girls(*), area:areas(id, name, slug)')
      .eq('brand_id', brandId)
      .eq('date', currentDate)
      .eq('status', 'working')
      .order('start_time', { ascending: true })
    setSchedules((data ?? []) as Schedule[])
    setLoading(false)
  }, [brandId, currentDate])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  // Update URL
  useEffect(() => {
    const url = currentDate === today ? '/schedule' : `/schedule?date=${currentDate}`

    window.history.replaceState(null, '', url)
  }, [currentDate, today])

  const diff = dayDiff(currentDate, today)
  const canPrev = diff > -MAX_OFFSET_DAYS
  const canNext = diff < MAX_OFFSET_DAYS
  const isToday = currentDate === today

  const goDate = (dateStr: string) => setCurrentDate(dateStr)

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917] pb-20">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 戻る
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            出勤情報
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Date nav */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => goDate(addDays(currentDate, -1))}
            disabled={!canPrev}
            className="px-3 py-1.5 text-xs text-[#b8860b] border border-[#b8860b]/30 rounded hover:bg-[#b8860b]/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ◀ 前日
          </button>
          <div className="text-center min-w-[180px]">
            <p className="text-sm font-medium text-[#b8860b] tracking-wider" style={{ fontFamily: serif }}>
              {formatDateLabel(currentDate)}
            </p>
            {isToday && <p className="text-[9px] text-[#b8860b]/60 mt-0.5">TODAY</p>}
          </div>
          <button
            onClick={() => goDate(addDays(currentDate, 1))}
            disabled={!canNext}
            className="px-3 py-1.5 text-xs text-[#b8860b] border border-[#b8860b]/30 rounded hover:bg-[#b8860b]/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            翌日 ▶
          </button>
        </div>

        {!isToday && (
          <div className="text-center mb-6">
            <button
              onClick={() => goDate(today)}
              className="text-[10px] text-[#b8860b]/60 underline hover:text-[#b8860b] transition"
            >
              今日に戻る
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#a8a29e] text-sm">読み込み中...</p>
          </div>
        ) : schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((s) => (
              <ScheduleRow key={s.id} schedule={s} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#a8a29e] text-sm mb-2">この日の出勤情報はまだありません</p>
            <p className="text-[#a8a29e]/60 text-xs">出勤情報は随時更新されます</p>
          </div>
        )}
      </div>
    </main>
  )
}
