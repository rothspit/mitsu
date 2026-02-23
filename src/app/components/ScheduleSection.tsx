'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getGirlImageUrl } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

// ============================================
// 朝8時基準ユーティリティ
// ============================================

function jstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

function businessDate(): string {
  const now = jstNow()
  if (now.getUTCHours() < 8) {
    now.setUTCDate(now.getUTCDate() - 1)
  }
  return now.toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function getWeekDates(baseDate: string): string[] {
  const d = new Date(baseDate + 'T00:00:00Z')
  const dow = d.getUTCDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = addDays(baseDate, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function getDow(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay()
}

function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

// ============================================
// カード
// ============================================

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = getGirlImageUrl(girl)

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group"
    >
      <div className="aspect-[3/4] bg-[#f5f5f4] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={girl?.name || ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-15">👤</span>
          </div>
        )}
        {schedule.schedule_text && (
          <span className="absolute top-1.5 left-1.5 text-[10px] text-white bg-[#b8860b] rounded-full px-2 py-0.5 shadow-sm">
            {schedule.schedule_text}
          </span>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm font-medium text-[#1c1917]" style={{ fontFamily: serif }}>
          {girl?.name || '—'}
        </p>
        <p className="text-[10px] text-[#b8860b] mt-1">
          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
        </p>
      </div>
    </Link>
  )
}

// ============================================
// メインコンポーネント
// ============================================

export default function ScheduleSection({
  brandId,
  initialSchedules,
}: {
  brandId: string
  initialSchedules: Schedule[]
}) {
  const today = useMemo(() => businessDate(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [loading, setLoading] = useState(false)
  const displayWeek = useMemo(() => getWeekDates(selectedDate), [selectedDate])

  // 日付が変わったらfetch（今日はinitialを使う）
  const fetchSchedules = useCallback(async () => {
    if (selectedDate === today) {
      setSchedules(initialSchedules)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('schedules')
      .select('*, girl:girls(*), area:areas(id, name, slug)')
      .eq('brand_id', brandId)
      .eq('date', selectedDate)
      .eq('status', 'working')
      .not('start_time', 'is', null)
      .order('start_time', { ascending: true })
    setSchedules((data ?? []) as Schedule[])
    setLoading(false)
  }, [brandId, selectedDate, today, initialSchedules])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const goWeek = (offset: number) => {
    setSelectedDate(addDays(selectedDate, offset * 7))
  }

  return (
    <section className="py-16 bg-[#fafaf9]">
      <div className="max-w-2xl mx-auto px-4">
        {/* セクション見出し */}
        <div className="text-center mb-6">
          <h3
            className="text-sm tracking-[0.2em] text-[#1c1917] mb-3"
            style={{ fontFamily: serif }}
          >
            出勤情報
          </h3>
          <div className="w-10 h-px bg-[#b8860b] mx-auto" />
        </div>

        {/* 週タブ */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          {/* 前週/次週 */}
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
            <button
              onClick={() => goWeek(-1)}
              className="text-[11px] text-[#78716c] hover:text-[#b8860b] transition"
            >
              ◀ 前週
            </button>
            {selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-[10px] text-[#b8860b] underline hover:no-underline"
              >
                今日に戻る
              </button>
            )}
            <button
              onClick={() => goWeek(1)}
              className="text-[11px] text-[#78716c] hover:text-[#b8860b] transition"
            >
              次週 ▶
            </button>
          </div>
          {/* 日付ボタン */}
          <div className="grid grid-cols-7 pb-1">
            {displayWeek.map((dateStr) => {
              const dow = getDow(dateStr)
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === today
              const isSun = dow === 0
              const isSat = dow === 6

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    flex flex-col items-center py-2 transition-colors relative
                    ${isSelected
                      ? 'text-[#b8860b]'
                      : isSun
                        ? 'text-red-400'
                        : isSat
                          ? 'text-blue-400'
                          : 'text-[#78716c]'
                    }
                  `}
                >
                  <span className="text-[10px] leading-none">{DOW_LABELS[dow]}</span>
                  <span
                    className={`
                      text-sm font-medium mt-1 w-7 h-7 flex items-center justify-center rounded-full
                      ${isSelected ? 'bg-[#b8860b] text-white' : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-[#b8860b]/40' : ''}
                    `}
                  >
                    {new Date(dateStr + 'T00:00:00Z').getUTCDate()}
                  </span>
                  {isSelected && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#b8860b] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 人数 */}
        {!loading && (
          <p className="text-center text-[#b8860b] text-sm tracking-wider mb-6">
            {schedules.length}名
          </p>
        )}

        {/* コンテンツ */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-5 h-5 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
          </div>
        ) : schedules.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {schedules.map((s) => (
              <ScheduleCard key={s.id} schedule={s} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#a8a29e] text-sm py-8">
            本日の出勤予定はありません
          </p>
        )}

        {/* 出勤表ページへのリンク */}
        <div className="mt-8 text-center">
          <Link
            href="/schedule"
            className="inline-block border border-[#b8860b]/30 text-[#b8860b] text-xs px-8 py-3 tracking-[0.15em] hover:bg-[#b8860b]/5 transition"
          >
            出勤情報をもっと見る
          </Link>
        </div>
      </div>
    </section>
  )
}
