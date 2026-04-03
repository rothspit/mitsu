'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getGirlImageUrl } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'
import { businessDate, jstNow } from '@/lib/business-date'
import StoreAreaNav from '@/components/StoreAreaNav'
import OtherAreaLinks from '@/components/OtherAreaLinks'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"
const BRAND_SLUG = 'hitomitsu'

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

// ============================================
// カレンダーユーティリティ
// ============================================

/** 月の初日 */
function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/** 月の末日 */
function monthEnd(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 0)) // month is 1-indexed, so month=0 of next month = last day
  return d.toISOString().slice(0, 10)
}

/** カレンダー表示用の週配列を返す（前月・翌月パディング込み） */
function getCalendarWeeks(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const lastDay = new Date(Date.UTC(year, month, 0))
  const startDow = firstDay.getUTCDay() // 0=日
  // 月曜始まり: 月=0, 火=1, ... 日=6
  const mondayOffset = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = lastDay.getUTCDate()

  const weeks: (string | null)[][] = []
  let currentWeek: (string | null)[] = []

  // 前月パディング
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

  // 翌月パディング
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return weeks
}

// ============================================
// ソート（空き状況ベース）
// ============================================

function sTimeToMin(t: string | null | undefined): number {
  if (!t) return 0
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + (m || 0)
}

function getScheduleCategory(s: Schedule, nowMin: number): number {
  const start = sTimeToMin(s.start_time)
  const end = sTimeToMin(s.end_time)
  const isOvernight = end > 0 && end < start
  const effectiveEnd = isOvernight ? end + 1440 : end

  if (!isOvernight && end > 0 && end <= nowMin) return 4

  if (start <= nowMin && nowMin < effectiveEnd) {
    const girl = s.girl as Record<string, unknown> | undefined
    const ws = (girl?.wait_status as number) || 0
    return ws === 3 ? 2 : 1
  }

  if (start > nowMin && start - nowMin <= 120) return 3

  return 5
}

function getSortKey(s: Schedule, category: number): number {
  if (category === 1) {
    const girl = s.girl as Record<string, unknown> | undefined
    const ws = (girl?.wait_status as number) || 0
    if (ws === 1) return 0
    if (ws === 2) {
      const aEnd = (girl?.attend_end_time as string) || ''
      return aEnd ? sTimeToMin(aEnd) : 9999
    }
    return 0
  }
  return sTimeToMin(s.start_time)
}

function sortByAvailability(schedules: Schedule[], isToday: boolean): { sorted: Schedule[]; endedIds: Set<string> } {
  if (!isToday) return { sorted: schedules, endedIds: new Set() }
  const now = jstNow()
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  const withInfo = schedules.map(s => {
    const cat = getScheduleCategory(s, nowMin)
    return { s, cat, sortKey: getSortKey(s, cat) }
  })
  withInfo.sort((a, b) => a.cat !== b.cat ? a.cat - b.cat : a.sortKey - b.sortKey)
  const endedIds = new Set(withInfo.filter(x => x.cat === 4).map(x => x.s.id))
  return { sorted: withInfo.map(x => x.s), endedIds }
}

// ============================================
// カード型の出勤表示
// ============================================

const WAIT_STATUS_CONFIG: Record<number, { label: string; bg: string; text: string; dim?: boolean }> = {
  1: { label: '待機中', bg: 'bg-green-500', text: 'text-white' },
  2: { label: '接客中', bg: 'bg-orange-500', text: 'text-white', dim: true },
  3: { label: '受付終了', bg: 'bg-gray-500', text: 'text-white', dim: true },
}

function CastCard({ schedule, ended }: { schedule: Schedule; ended?: boolean }) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = getGirlImageUrl(girl)
  const ws = (girl as Record<string, unknown> | undefined)?.wait_status as number | undefined
  const attendEndTime = (girl as Record<string, unknown> | undefined)?.attend_end_time as string | null | undefined
  const wsConfig = ws ? WAIT_STATUS_CONFIG[ws] : undefined
  const wsLabel = ws === 2 && attendEndTime ? `接客中 〜 ${attendEndTime.slice(0, 5)}` : wsConfig?.label

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group ${
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
            <span className="text-4xl opacity-10">👤</span>
          </div>
        )}
        {ended ? (
          <span className="absolute top-2 right-2 text-[10px] bg-gray-500 text-white rounded-full px-2.5 py-0.5 shadow-sm font-medium">
            本日終了
          </span>
        ) : wsConfig ? (
          <span className={`absolute top-2 right-2 text-[10px] ${wsConfig.bg} ${wsConfig.text} rounded-full px-2.5 py-0.5 shadow-sm font-medium`}>
            {wsLabel}
          </span>
        ) : null}
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

export default function MitsuSchedulePage() {
  const today = useMemo(() => businessDate(), [])

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialDateRaw = params?.get('date') || today
  const initialDate = initialDateRaw < today ? today : initialDateRaw

  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [windowStart, setWindowStart] = useState(initialDate)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const isViewingToday = selectedDate === today
  const { sorted: sortedSchedules, endedIds } = useMemo(
    () => sortByAvailability(schedules, isViewingToday),
    [schedules, isViewingToday]
  )

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

  const displayWeek = useMemo(() => getRollingDates(windowStart, 7), [windowStart])
  const calendarWeeks = useMemo(() => getCalendarWeeks(calYear, calMonth), [calYear, calMonth])

  // brand_id 解決
  useEffect(() => {
    supabase
      .from('brands')
      .select('id')
      .eq('slug', BRAND_SLUG)
      .single()
      .then(({ data }) => {
        if (data) setBrandId(data.id)
      })
  }, [])

  // 週表示: 出勤データ取得
  const fetchSchedules = useCallback(async () => {
    if (!brandId) return
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
  }, [brandId, selectedDate])

  useEffect(() => {
    if (viewMode === 'week') fetchSchedules()
  }, [fetchSchedules, viewMode])

  // 月表示: 月間データ取得（人数 + キャスト名）
  const fetchMonthData = useCallback(async () => {
    if (!brandId) return
    setMonthLoading(true)
    const start = monthStart(calYear, calMonth)
    const end = monthEnd(calYear, calMonth)

    const { data } = await supabase
      .from('schedules')
      .select('date, girl:girls(name)')
      .eq('brand_id', brandId)
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
  }, [brandId, calYear, calMonth])

  useEffect(() => {
    if (viewMode === 'month') fetchMonthData()
  }, [fetchMonthData, viewMode])

  // URL同期
  useEffect(() => {
    if (viewMode === 'week') {
      const url = selectedDate === today ? '/schedule' : `/schedule?date=${selectedDate}`
      window.history.replaceState(null, '', url)
    }
  }, [selectedDate, today, viewMode])

  // 週ナビ
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

  // 月ナビ
  const goMonth = (offset: number) => {
    let newMonth = calMonth + offset
    let newYear = calYear
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    setCalYear(newYear)
    setCalMonth(newMonth)
  }

  // カレンダーから日付タップ → 週表示に切り替え
  const selectFromCalendar = (dateStr: string) => {
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
          <h1
            className="text-base text-[#1c1917] tracking-[0.2em] font-medium"
            style={{ fontFamily: serif }}
          >
            出勤情報
          </h1>
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
                // 選択中の日付に合わせてカレンダー月を設定
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
                {selectedDate === today ? '本日の' : ''}出勤{' '}
                <span className="text-3xl">{schedules.length}</span>名
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-6 h-6 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
              <p className="text-[#a8a29e] text-sm mt-3">読み込み中...</p>
            </div>
          ) : schedules.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {sortedSchedules.map((s) => (
                <CastCard key={s.id} schedule={s} ended={endedIds.has(s.id)} />
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
          {/* 月ナビ */}
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

          {/* 曜日ヘッダ */}
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

          {/* カレンダーグリッド */}
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

          {/* 凡例 */}
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
