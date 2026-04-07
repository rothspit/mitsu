'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useGirlImageResolver } from '@/hooks/useCrmCastImageMap'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'
import { businessDate } from '@/lib/business-date'
import { sortSchedulesForToday } from '@/lib/schedule/sort-schedules'
import { dedupeSchedulesByGirlPerDay } from '@/lib/schedule/dedupe-schedules'
import StoreAreaNav from '@/components/StoreAreaNav'
import OtherAreaLinks from '@/components/OtherAreaLinks'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"
const BRAND_SLUG = 'hitomitsu'
/** 錦糸町はエリア別スケジュール（管理画面で錦糸町に登録＝選択された行のみ表示） */
const AREA_SLUG = 'kinshicho'

// ============================================
// 日付ユーティリティ（営業日の今日は @/lib/business-date）
// ============================================

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function getRollingDates(startDate: string, days = 7): string[] {
  return Array.from({ length: days }, (_, i) => addDays(startDate, i))
}

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function getDow(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay()
}

function fullDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日(${DOW_LABELS[d.getUTCDay()]})`
}

function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

/** 備考・出勤テキストから「西船橋店待機→錦糸町エリア」系か推定（管理でキーワードを入れて識別） */
function isNishifunaWaitForKinshicho(schedule: Schedule): boolean {
  const g = schedule.girl as Record<string, unknown> | undefined
  const blob = [schedule.comment, schedule.schedule_text, g?.manager_comment, g?.memo]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join('\n')
  return /西船待機|西船橋店|西船より|【西船】|西船橋.*待機|西船.*待機/i.test(blob)
}

// ============================================
// カレンダーユーティリティ
// ============================================

function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function monthEnd(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 0))
  return d.toISOString().slice(0, 10)
}

function getCalendarWeeks(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0))
  const startDow = firstDay.getUTCDay()
  const mondayOffset = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = lastDay.getUTCDate()

  const weeks: (string | null)[][] = []
  let currentWeek: (string | null)[] = []

  for (let i = 0; i < mondayOffset; i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    currentWeek.push(dateStr)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return weeks
}

// ============================================
// カード型の出勤表示
// ============================================

function CastCard({
  schedule,
  resolveGirlImage,
}: {
  schedule: Schedule
  resolveGirlImage: (girl: Girl | undefined | null) => string | null
}) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = resolveGirlImage(girl)
  const nishifunaWait = isNishifunaWaitForKinshicho(schedule)

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group"
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
            <span className="text-4xl opacity-10">👤</span>
          </div>
        )}
        {nishifunaWait && (
          <span className="absolute top-2 right-2 z-[1] max-w-[calc(100%-0.5rem)] text-[8px] font-bold leading-tight text-amber-900 bg-amber-100/95 border border-amber-300/80 rounded px-1.5 py-0.5 shadow-sm text-right">
            西船待機・別途交通費
          </span>
        )}
        {schedule.schedule_text && (
          <span className="absolute top-2 left-2 text-[10px] text-white bg-[#b8860b] rounded-full px-2.5 py-0.5 shadow-sm">
            {schedule.schedule_text}
          </span>
        )}
      </div>
      <div className="px-3 py-3">
        <p className="text-sm font-medium text-[#1c1917] truncate" style={{ fontFamily: serif }}>
          {girl?.name || '—'}
        </p>
        <p className="text-xs text-[#b8860b] mt-1 font-medium">
          {formatTime(schedule.start_time)} 〜 {formatTime(schedule.end_time)}
        </p>
      </div>
    </Link>
  )
}

// ============================================
// メインページ
// ============================================

type ViewMode = 'week' | 'month'

export default function KinshichoSchedulePage() {
  const today = useMemo(() => businessDate(), [])

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialDateRaw = params?.get('date') || today
  const initialDate = initialDateRaw < today ? today : initialDateRaw

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [windowStart, setWindowStart] = useState(initialDate)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [areaId, setAreaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 月カレンダー用
  const [calYear, setCalYear] = useState(() => {
    const d = new Date(initialDate + 'T00:00:00Z')
    return d.getUTCFullYear()
  })
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(initialDate + 'T00:00:00Z')
    return d.getUTCMonth() + 1
  })
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [monthNames, setMonthNames] = useState<Record<string, string[]>>({})
  const [monthLoading, setMonthLoading] = useState(false)

  const resolveGirlImage = useGirlImageResolver()

  const displayWeek = useMemo(() => getRollingDates(windowStart, 7), [windowStart])
  const isViewingToday = selectedDate === today
  const { sorted: sortedSchedules } = useMemo(
    () => sortSchedulesForToday(schedules, isViewingToday),
    [schedules, isViewingToday]
  )
  const calendarWeeks = useMemo(() => getCalendarWeeks(calYear, calMonth), [calYear, calMonth])

  useEffect(() => {
    Promise.all([
      supabase.from('brands').select('id').eq('slug', BRAND_SLUG).single(),
      supabase.from('areas').select('id').eq('slug', AREA_SLUG).single(),
    ]).then(([brandRes, areaRes]) => {
      if (brandRes.data) setBrandId(brandRes.data.id)
      if (areaRes.data) setAreaId(areaRes.data.id)
    })
  }, [])

  const fetchSchedules = useCallback(async () => {
    if (!brandId || !areaId) return
    setLoading(true)
    const { data } = await supabase
      .from('schedules')
      .select('*, girl:girls(*), area:areas(id, name, slug)')
      .eq('brand_id', brandId)
      .eq('area_id', areaId)
      .eq('date', selectedDate)
      .eq('status', 'working')
      .not('start_time', 'is', null)
      .order('start_time', { ascending: true })
    setSchedules(dedupeSchedulesByGirlPerDay((data ?? []) as Schedule[]))
    setLoading(false)
  }, [brandId, areaId, selectedDate])

  useEffect(() => {
    if (viewMode === 'week') fetchSchedules()
  }, [fetchSchedules, viewMode])

  const fetchMonthData = useCallback(async () => {
    if (!brandId || !areaId) return
    setMonthLoading(true)
    const start = monthStart(calYear, calMonth)
    const end = monthEnd(calYear, calMonth)

    const { data } = await supabase
      .from('schedules')
      .select('date, girl:girls(name)')
      .eq('brand_id', brandId)
      .eq('area_id', areaId)
      .eq('status', 'working')
      .not('start_time', 'is', null)
      .gte('date', start)
      .lte('date', end)

    const counts: Record<string, number> = {}
    const names: Record<string, string[]> = {}
    for (const row of (data ?? []) as any[]) {
      const d = row.date as string
      counts[d] = (counts[d] || 0) + 1
      const name = row.girl?.name
      if (name) {
        if (!names[d]) names[d] = []
        if (!names[d].includes(name)) names[d].push(name)
      }
    }
    setMonthCounts(counts)
    setMonthNames(names)
    setMonthLoading(false)
  }, [brandId, areaId, calYear, calMonth])

  useEffect(() => {
    if (viewMode === 'month') fetchMonthData()
  }, [fetchMonthData, viewMode])

  // URL同期
  useEffect(() => {
    if (viewMode === 'week') {
      const url = selectedDate === today ? '/kinshicho' : `/kinshicho?date=${selectedDate}`
      window.history.replaceState(null, '', url)
    }
  }, [selectedDate, today, viewMode])

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
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
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
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917] pb-24">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition"
          >
            ← 戻る
          </Link>
          <div className="min-w-0 flex-1">
            <h1
              className="text-base text-[#1c1917] tracking-[0.2em] font-medium"
              style={{ fontFamily: serif }}
            >
              錦糸町の出勤情報
            </h1>
            <p className="text-[10px] text-[#a8a29e] mt-1 leading-snug">
              錦糸町エリアは、管理で錦糸町に登録（選択）された出勤のみ表示されます（西船橋・葛西とは別枠）。
            </p>
          </div>
        </div>
      </header>

      {/* ===== 週/月 切り替えタブ ===== */}
      <div className="sticky top-[53px] z-40 bg-white border-b border-[#e7e5e4]">
        <div className="max-w-2xl mx-auto">
          <StoreAreaNav />
          <div className="flex">
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 py-2.5 text-xs font-medium tracking-wider transition-colors ${
                viewMode === 'week'
                  ? 'text-[#b8860b] border-b-2 border-[#b8860b]'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              週表示
            </button>
            <button
              onClick={() => {
                setViewMode('month')
                const d = new Date(selectedDate + 'T00:00:00Z')
                setCalYear(d.getUTCFullYear())
                setCalMonth(d.getUTCMonth() + 1)
              }}
              className={`flex-1 py-2.5 text-xs font-medium tracking-wider transition-colors ${
                viewMode === 'month'
                  ? 'text-[#b8860b] border-b-2 border-[#b8860b]'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              月カレンダー
            </button>
          </div>

          {/* 週表示ヘッダ */}
          {viewMode === 'week' && (
            <>
              <div className="flex items-center justify-between px-4 pt-2 pb-1">
                <div className="w-[3.5em]" aria-hidden />
                {selectedDate !== today && (
                  <button
                    onClick={backToToday}
                    className="text-[10px] text-[#b8860b] underline hover:no-underline transition"
                  >
                    今日に戻る
                  </button>
                )}
                <button
                  onClick={goNextWeek}
                  className="text-xs text-[#78716c] hover:text-[#b8860b] transition px-2 py-1"
                >
                  次週 ▶
                </button>
              </div>
              <div className="grid grid-cols-7">
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
                        flex flex-col items-center py-2.5 transition-colors relative
                        ${isSelected
                          ? 'text-[#b8860b]'
                          : isSun
                            ? 'text-red-400 hover:text-red-500'
                            : isSat
                              ? 'text-blue-400 hover:text-blue-500'
                              : 'text-[#78716c] hover:text-[#1c1917]'
                        }
                      `}
                    >
                      <span className="text-[10px] leading-none">{DOW_LABELS[dow]}</span>
                      <span
                        className={`
                          text-sm font-medium mt-1 w-8 h-8 flex items-center justify-center rounded-full
                          ${isSelected ? 'bg-[#b8860b] text-white' : ''}
                          ${isToday && !isSelected ? 'ring-2 ring-[#b8860b]/40' : ''}
                        `}
                      >
                        {new Date(dateStr + 'T00:00:00Z').getUTCDate()}
                      </span>
                      {isSelected && (
                        <span className="block absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#b8860b] rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== 週表示コンテンツ ===== */}
      {viewMode === 'week' && (
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
          <div className="text-center mb-6">
            <p className="text-xs text-[#78716c] tracking-wider">
              {fullDateLabel(selectedDate)}
            </p>
            {!loading && (
              <p
                className="text-2xl font-medium text-[#b8860b] mt-2 tracking-wider"
                style={{ fontFamily: serif }}
              >
                {selectedDate === today ? '本日' : ''}の出勤{' '}
                <span className="text-3xl">{schedules.length}</span>名
              </p>
            )}
          </div>

          <div className="mb-5 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] px-3.5 py-3 text-left text-[11px] leading-relaxed text-[#57534e]">
            <p className="font-semibold text-[#44403c] mb-1.5">交通費について</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <span className="font-medium text-[#44403c]">西船橋店待機</span>
                から錦糸町エリアへ向かうご案内の場合は、
                <span className="font-medium text-amber-900">別途交通費</span>
                がかかります。
              </li>
              <li>
                <span className="font-medium text-[#44403c]">錦糸町エリアで待機</span>
                のキャストは、西船橋店からの移動がないため、上記の
                <span className="font-medium">別途交通費はかかりません</span>。
              </li>
            </ul>
            <p className="mt-2 text-[10px] text-[#a8a29e]">
              キャストごとの待機は出勤コメント等でご確認ください。コメントに「西船待機」等がある行はカードに表示されます。
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-6 h-6 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
              <p className="text-[#a8a29e] text-sm mt-3">読み込み中...</p>
            </div>
          ) : schedules.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {sortedSchedules.map((s) => (
                <CastCard key={s.id} schedule={s} resolveGirlImage={resolveGirlImage} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#b8860b]/5 flex items-center justify-center">
                <span className="text-2xl opacity-30">📅</span>
              </div>
              <p className="text-[#78716c] text-sm">本日の出勤予定はありません</p>
              <p className="text-[#a8a29e] text-xs mt-1.5">出勤情報は随時更新されます</p>
            </div>
          )}
        </div>
      )}

      {/* ===== 月カレンダー表示 ===== */}
      {viewMode === 'month' && (
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => goMonth(-1)}
              className="text-xs text-[#78716c] hover:text-[#b8860b] transition px-3 py-1"
            >
              ◀ 前月
            </button>
            <p
              className="text-lg font-medium text-[#1c1917] tracking-wider"
              style={{ fontFamily: serif }}
            >
              {calYear}年{calMonth}月
            </p>
            <button
              onClick={() => goMonth(1)}
              className="text-xs text-[#78716c] hover:text-[#b8860b] transition px-3 py-1"
            >
              次月 ▶
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['月', '火', '水', '木', '金', '土', '日'].map((label, i) => (
              <div
                key={label}
                className={`text-center text-[10px] font-medium py-1 ${
                  i === 6 ? 'text-red-400' : i === 5 ? 'text-blue-400' : 'text-[#78716c]'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {monthLoading ? (
            <div className="text-center py-16">
              <div className="inline-block w-6 h-6 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((dateStr, di) => {
                    if (!dateStr) {
                      return <div key={di} className="aspect-square" />
                    }

                    const day = new Date(dateStr + 'T00:00:00Z').getUTCDate()
                    const count = monthCounts[dateStr] || 0
                    const names = monthNames[dateStr] || []
                    const isToday = dateStr === today
                    const dow = getDow(dateStr)
                    const isSun = dow === 0
                    const isSat = dow === 6

                    return (
                      <button
                        key={dateStr}
                        onClick={() => selectFromCalendar(dateStr)}
                        className={`
                          rounded-lg p-1 text-left transition-colors min-h-[60px]
                          ${count > 0
                            ? 'bg-white shadow-sm hover:shadow-md'
                            : 'bg-[#f5f5f4]/50 hover:bg-white'
                          }
                          ${isToday ? 'ring-2 ring-[#b8860b]/50' : ''}
                        `}
                      >
                        <span
                          className={`text-xs font-medium block ${
                            isToday
                              ? 'text-[#b8860b]'
                              : isSun
                                ? 'text-red-400'
                                : isSat
                                  ? 'text-blue-400'
                                  : 'text-[#44403c]'
                          }`}
                        >
                          {day}
                        </span>
                        {count > 0 && (
                          <>
                            <span className="text-[10px] font-bold text-[#b8860b] block mt-0.5">
                              {count}名
                            </span>
                            {names.length > 0 && (
                              <span className="block mt-0.5 overflow-hidden">
                                {names.slice(0, 2).map((n) => (
                                  <span key={n} className="block text-[8px] text-[#78716c] truncate leading-tight">
                                    {n}
                                  </span>
                                ))}
                                {names.length > 2 && (
                                  <span className="block text-[8px] text-[#a8a29e]">+{names.length - 2}</span>
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-[#78716c]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-white shadow-sm inline-block" /> 出勤あり
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#f5f5f4]/50 inline-block" /> 出勤なし
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded ring-2 ring-[#b8860b]/50 inline-block" /> 今日
            </span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pb-8">
        <OtherAreaLinks />
      </div>
    </main>
  )
}
