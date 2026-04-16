'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getGirlImageUrl } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'
import { businessDate } from '@/lib/business-date'
import { sortSchedulesForToday } from '@/lib/schedule/sort-schedules'
import { dedupeSchedulesByGirlPerDay } from '@/lib/schedule/dedupe-schedules'
import WaitLocationPin from '@/components/WaitLocationPin'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

// ============================================
// 朝8時基準の日付・時刻（@/lib/business-date）
// ============================================

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function getRollingDates(startDate: string, days = 7): string[] {
  return Array.from({ length: days }, (_, i) => addDays(startDate, i))
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

function monthStart(dateStr: string): { year: number; month: number } {
  const d = new Date(dateStr + 'T00:00:00Z')
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}

function getCalendarWeeks(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0))
  const startDow = firstDay.getUTCDay() // 0=Sun
  const mondayOffset = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = lastDay.getUTCDate()

  const weeks: (string | null)[][] = []
  let currentWeek: (string | null)[] = []

  for (let i = 0; i < mondayOffset; i++) currentWeek.push(null)

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    currentWeek.push(dateStr)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }
  return weeks
}

// ============================================
// カード
// ============================================

const WAIT_STATUS_CONFIG: Record<number, { label: string; bg: string; text: string; dim?: boolean }> = {
  1: { label: '待機中', bg: 'bg-green-500', text: 'text-white' },
  2: { label: '接客中', bg: 'bg-orange-500', text: 'text-white', dim: true },
  3: { label: '受付終了', bg: 'bg-gray-500', text: 'text-white', dim: true },
}

function ScheduleCard({
  schedule,
  ended,
  locationPinLabel,
}: {
  schedule: Schedule
  ended?: boolean
  locationPinLabel?: React.ReactNode
}) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = getGirlImageUrl(girl)
  const ws = (girl as Record<string, unknown> | undefined)?.wait_status as number | undefined
  const attendEndTime = (girl as Record<string, unknown> | undefined)?.attend_end_time as string | null | undefined
  const wsConfig = ws ? WAIT_STATUS_CONFIG[ws] : undefined
  const wsLabel = ws === 2 && attendEndTime ? `接客中 〜 ${attendEndTime.slice(0, 5)}` : wsConfig?.label

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group ${
        ended ? 'opacity-40' : wsConfig?.dim ? 'opacity-60' : ''
      }`}
    >
      <div className="aspect-[3/4] bg-[#f5f5f4] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={girl?.name || ''}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              ended ? 'grayscale' : wsConfig?.dim ? 'grayscale-[30%]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-15">👤</span>
          </div>
        )}
        {locationPinLabel != null && (
          <div className="absolute bottom-1.5 left-1.5">
            <WaitLocationPin
              label={locationPinLabel}
              title="待機・出勤エリア"
              className="bg-white/90 backdrop-blur border-[#b8860b]/20"
              icon="📍"
            />
          </div>
        )}
        {ended ? (
          <span className="absolute top-1.5 right-1.5 text-[10px] bg-gray-500 text-white rounded-full px-2 py-0.5 shadow-sm font-medium">
            本日終了
          </span>
        ) : wsConfig ? (
          <span className={`absolute top-1.5 right-1.5 text-[10px] ${wsConfig.bg} ${wsConfig.text} rounded-full px-2 py-0.5 shadow-sm font-medium`}>
            {wsLabel}
          </span>
        ) : null}
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
  locationPinLabel,
  storeId,
}: {
  brandId: string
  initialSchedules: Schedule[]
  locationPinLabel?: React.ReactNode
  storeId?: number | string
}) {
  const sid = useMemo(() => (storeId != null ? Number(storeId) : 1), [storeId])
  const today = useMemo(() => businessDate(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [windowStart, setWindowStart] = useState(today)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [schedules, setSchedules] = useState<Schedule[]>(() =>
    dedupeSchedulesByGirlPerDay(initialSchedules)
  )
  const [loading, setLoading] = useState(false)
  const displayWeek = useMemo(() => getRollingDates(windowStart, 7), [windowStart])
  const isViewingToday = selectedDate === today
  const { sorted: sortedSchedules, endedIds } = useMemo(
    () => sortSchedulesForToday(schedules, isViewingToday),
    [schedules, isViewingToday]
  )

  const initialYM = useMemo(() => monthStart(today), [today])
  const [calYear, setCalYear] = useState(initialYM.year)
  const [calMonth, setCalMonth] = useState(initialYM.month)
  const calendarWeeks = useMemo(() => getCalendarWeeks(calYear, calMonth), [calYear, calMonth])
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [monthLoading, setMonthLoading] = useState(false)

  const fetchSchedules = useCallback(async () => {
    if (selectedDate === today) {
      setSchedules(dedupeSchedulesByGirlPerDay(initialSchedules))
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`https://crm.h-mitsu.com/api/idol/schedules?store_id=${sid}&date=${selectedDate}`)
      if (!res.ok) throw new Error('API format mismatch')
      const json = await res.json()
      
      const dayData = (json.schedules || []).find((s: any) => s.date === selectedDate)
      
      const mappedSchedules = dayData ? dayData.casts.map((c: any) => ({
        id: `${selectedDate}-${c.id}`,
        girl_id: String(c.cast_id),
        brand_id: brandId || '1',
        date: selectedDate,
        start_time: c.start_time,
        end_time: c.end_time,
        status: c.status,
        schedule_text: c.schedule_text || '',
        girl: {
          id: String(c.cast_id),
          name: c.name,
          images: [c.idol_image_path || c.image].filter(Boolean),
          brand_id: brandId || '1',
          is_active: true,
          created_at: '',
          updated_at: ''
        }
      })) : []
      
      setSchedules(dedupeSchedulesByGirlPerDay(mappedSchedules as Schedule[]))
    } catch (e) {
      console.error(e)
      setSchedules([])
    }
    setLoading(false)
  }, [brandId, selectedDate, today, initialSchedules, sid])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const fetchMonthCounts = useCallback(async () => {
    setMonthLoading(true)
    try {
      const days = calendarWeeks
        .flat()
        .filter((d): d is string => !!d)
        .filter((d) => d >= today)

      const counts: Record<string, number> = {}
      const concurrency = 4
      let idx = 0
      const worker = async () => {
        while (idx < days.length) {
          const i = idx++
          const date = days[i]
          try {
            const res = await fetch(`https://crm.h-mitsu.com/api/idol/schedules?store_id=${sid}&date=${date}`)
            if (!res.ok) continue
            const json = await res.json()
            const dayData = (json.schedules || []).find((s: any) => s.date === date)
            const c =
              typeof dayData?.cast_count === 'number' ? dayData.cast_count : (dayData?.casts?.length ?? 0)
            counts[date] = c
          } catch {
            // ignore per-day failures
          }
        }
      }
      await Promise.all(Array.from({ length: concurrency }, worker))
      setMonthCounts((prev) => ({ ...prev, ...counts }))
    } finally {
      setMonthLoading(false)
    }
  }, [calendarWeeks, today, sid])

  useEffect(() => {
    if (viewMode === 'month') fetchMonthCounts()
  }, [fetchMonthCounts, viewMode])

  const selectDate = (dateStr: string) => {
    if (dateStr < today) return
    setSelectedDate(dateStr)
  }

  const goNextWeek = () => {
    const nextStart = addDays(windowStart, 7)
    setWindowStart(nextStart)
    if (selectedDate < nextStart) setSelectedDate(nextStart)
  }

  const backToToday = () => {
    setWindowStart(today)
    setSelectedDate(today)
  }

  const goMonth = (offset: number) => {
    let newMonth = calMonth + offset
    let newYear = calYear
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    }
    if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    const currentMonthStart = today.slice(0, 7) // YYYY-MM
    const nextMonthStart = `${newYear}-${String(newMonth).padStart(2, '0')}`
    if (nextMonthStart < currentMonthStart) return
    setCalYear(newYear)
    setCalMonth(newMonth)
  }

  const selectFromCalendar = (dateStr: string) => {
    if (dateStr < today) return
    setWindowStart(dateStr)
    setSelectedDate(dateStr)
    setViewMode('week')
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

        {/* 表示切り替え */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex rounded-lg bg-white border border-[#e7e5e4] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-xs font-medium tracking-wider transition ${
                viewMode === 'week' ? 'bg-[#b8860b] text-white' : 'text-[#78716c] hover:bg-[#b8860b]/5'
              }`}
            >
              週表示
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-xs font-medium tracking-wider transition ${
                viewMode === 'month' ? 'bg-[#b8860b] text-white' : 'text-[#78716c] hover:bg-[#b8860b]/5'
              }`}
            >
              月カレンダー
            </button>
          </div>
        </div>

        {/* 週タブ */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          {/* 次週 */}
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
            <div className="w-[3.5em]" aria-hidden />
            {selectedDate !== today && (
              <button
                onClick={backToToday}
                className="text-[10px] text-[#b8860b] underline hover:no-underline"
              >
                今日に戻る
              </button>
            )}
            <button
              onClick={goNextWeek}
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
                  onClick={() => selectDate(dateStr)}
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
        )}

        {viewMode === 'month' && (
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f4]">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="text-[11px] text-[#78716c] hover:text-[#b8860b] transition"
              >
                ◀ 前月
              </button>
              <p className="text-sm tracking-wider text-[#1c1917]" style={{ fontFamily: serif }}>
                {calYear}年{calMonth}月
              </p>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="text-[11px] text-[#78716c] hover:text-[#b8860b] transition"
              >
                次月 ▶
              </button>
            </div>

            <div className="grid grid-cols-7 px-3 pt-3 pb-2">
              {['月', '火', '水', '木', '金', '土', '日'].map((l, i) => (
                <div
                  key={l}
                  className={`text-center text-[10px] font-medium ${
                    i === 6 ? 'text-red-400' : i === 5 ? 'text-blue-400' : 'text-[#78716c]'
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>

            {monthLoading ? (
              <div className="text-center py-10">
                <div className="inline-block w-5 h-5 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="px-3 pb-3 space-y-1">
                {calendarWeeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.map((dateStr, di) => {
                      if (!dateStr) return <div key={di} className="aspect-square" />
                      const day = new Date(dateStr + 'T00:00:00Z').getUTCDate()
                      const count = monthCounts[dateStr] || 0
                      const isPast = dateStr < today
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => selectFromCalendar(dateStr)}
                          disabled={isPast}
                          className={`aspect-square rounded-lg border text-left p-1 transition ${
                            isPast
                              ? 'bg-[#f5f5f4]/40 border-transparent text-[#d6d3d1] cursor-not-allowed'
                              : count > 0
                                ? 'bg-white border-[#e7e5e4] hover:border-[#b8860b]/40'
                                : 'bg-[#fafaf9] border-[#f5f5f4] hover:border-[#e7e5e4]'
                          }`}
                        >
                          <span className="block text-[11px] font-medium text-[#44403c]">{day}</span>
                          {count > 0 && (
                            <span className="inline-flex mt-1 text-[10px] font-bold text-[#b8860b]">
                              {count}名
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 人数 */}
        {!loading && viewMode === 'week' && (
          <p className="text-center text-[#b8860b] text-sm tracking-wider mb-6">
            {schedules.length}名
          </p>
        )}

        {/* コンテンツ */}
        {viewMode === 'week' && (loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-5 h-5 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
          </div>
        ) : schedules.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {sortedSchedules.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                ended={endedIds.has(s.id)}
                locationPinLabel={locationPinLabel}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#a8a29e] text-sm py-8">
            本日の出勤予定はありません
          </p>
        ))}

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
