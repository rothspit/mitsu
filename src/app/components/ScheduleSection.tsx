'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { CastImageWithFallback } from '@/components/CastImageWithFallback'
import { getGirlImageUrlCandidates } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'
import { businessDate } from '@/lib/business-date'
import { getCrmScheduleCardDisplay, sortSchedulesForTodayBoard } from '@/lib/crm/schedule-display'
import type { CrmScheduleCardDisplay } from '@/lib/crm/schedule-display'
import { dedupeSchedulesByGirlPerDay } from '@/lib/schedule/dedupe-schedules'
import { mapHitodumaDayCastsToSchedules } from '@/lib/schedule/map-hitoduma-day'
import { formatAgeAndBwhLine, girlExtrasFromScheduleCastRow } from '@/lib/cast-display/format-age-bwh'
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

const SOKUHIME_POLL_MS = 90_000

// ============================================
// カード
// ============================================

function ScheduleCard({
  schedule,
  display,
  locationPinLabel,
}: {
  schedule: Schedule
  display: CrmScheduleCardDisplay
  locationPinLabel?: React.ReactNode
}) {
  const girl = schedule.girl as Girl | undefined
  const imageCandidates = girl ? getGirlImageUrlCandidates(girl) : []
  const { ended, showSokuhime, waitStatus: ws, footerLabel, footerTone } = display
  const cardDimmed = ended || (showSokuhime && ws === 3) || Boolean(schedule.is_full)
  const imageMuted =
    ended || cardDimmed || (showSokuhime && ws === 2)

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group ${
        cardDimmed ? 'opacity-50' : showSokuhime && ws === 2 ? 'opacity-90' : ''
      }`}
    >
      <div className="aspect-[3/4] bg-[#f5f5f4] relative overflow-hidden">
        {imageCandidates.length > 0 ? (
          <CastImageWithFallback
            candidates={imageCandidates}
            alt={girl?.name || ''}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageMuted ? 'grayscale-[35%]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center px-2">
            <p className="text-[10px] text-[#78716c] tracking-wider text-center leading-relaxed">
              画像を準備中です
            </p>
          </div>
        )}
        {/* 地域ピンはトップ（集約）ページのみ。店舗ページでは渡さない。 */}
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
      </div>

      <div className="p-3 text-center">
        <p className="text-sm font-medium text-[#1c1917]" style={{ fontFamily: serif }}>
          {girl?.name || '—'}
        </p>
        {(() => {
          const line = formatAgeAndBwhLine(girl as Record<string, unknown> | undefined)
          return line ? (
            <p className="text-[10px] text-[#78716c] mt-1 leading-snug tabular-nums">{line}</p>
          ) : null
        })()}
        <p className="text-[10px] text-[#b8860b] mt-1 tabular-nums">
          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
        </p>

        {footerLabel && (
          <p
            className={`mt-1 text-[11px] leading-snug ${
              footerTone === 'sokuhime'
                ? 'font-bold text-red-600'
                : footerTone === 'busy'
                  ? 'font-bold text-orange-700'
                  : 'font-medium text-[#a8a29e]'
            }`}
          >
            {footerLabel}
          </p>
        )}
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
  hitodumaStore,
  scheduleMoreHref = '/nishifuna/schedule',
}: {
  brandId: string
  initialSchedules: Schedule[]
  locationPinLabel?: React.ReactNode
  /** CRM `stores.code` for 人妻の蜜（例: kasai）。クライアントは数値 store_id を持たない。 */
  hitodumaStore: string
  /** 店舗別の出勤表フルページ */
  scheduleMoreHref?: string
}) {
  const today = useMemo(() => businessDate(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const [windowStart, setWindowStart] = useState(today)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [schedules, setSchedules] = useState<Schedule[]>(() =>
    dedupeSchedulesByGirlPerDay(initialSchedules)
  )
  const [loading, setLoading] = useState(false)
  /** 日付連打時に古いレスポンスで出勤が上書きされないようにする */
  const fetchGenerationRef = useRef(0)
  const selectedDateRef = useRef(selectedDate)
  const isFirstFetchRef = useRef(true)
  selectedDateRef.current = selectedDate
  const displayWeek = useMemo(() => getRollingDates(windowStart, 7), [windowStart])
  const isViewingToday = selectedDate === today
  const { sorted: sortedSchedules, displayById } = useMemo(
    () => sortSchedulesForTodayBoard(schedules, isViewingToday),
    [schedules, isViewingToday]
  )

  /** `/idol/schedules` には年齢・looks が無いことが多い → `/api/hitoduma/casts` で補完 */
  const [castExtrasById, setCastExtrasById] = useState(() => new Map<string, ReturnType<typeof girlExtrasFromScheduleCastRow>>())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/hitoduma/casts?store=${encodeURIComponent(hitodumaStore)}`)
        if (!res.ok) return
        const json = (await res.json()) as Record<string, unknown>
        const rows = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.casts)
            ? json.casts
            : Array.isArray(json)
              ? json
              : []
        const m = new Map<string, ReturnType<typeof girlExtrasFromScheduleCastRow>>()
        for (const row of rows) {
          if (!row || typeof row !== 'object') continue
          const r = row as Record<string, unknown>
          const id = r.cast_id != null ? String(r.cast_id) : r.id != null ? String(r.id) : ''
          if (!id) continue
          m.set(id, girlExtrasFromScheduleCastRow(r))
        }
        if (!cancelled) setCastExtrasById(m)
      } catch {
        if (!cancelled) setCastExtrasById(new Map())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hitodumaStore])

  const schedulesForCards = useMemo(() => {
    if (castExtrasById.size === 0) return sortedSchedules
    return sortedSchedules.map((s) => {
      const g = s.girl as Girl | undefined
      const id = g?.id ? String(g.id) : s.girl_id != null ? String(s.girl_id) : ''
      if (!id || !g) return s
      const extra = castExtrasById.get(id)
      if (!extra) return s
      return {
        ...s,
        girl: {
          ...g,
          ...extra,
        },
      }
    })
  }, [sortedSchedules, castExtrasById])

  const initialYM = useMemo(() => monthStart(today), [today])
  const [calYear, setCalYear] = useState(initialYM.year)
  const [calMonth, setCalMonth] = useState(initialYM.month)
  const calendarWeeks = useMemo(() => getCalendarWeeks(calYear, calMonth), [calYear, calMonth])
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [monthLoading, setMonthLoading] = useState(false)

  const fetchSchedules = useCallback(
    async (opts?: { silent?: boolean; date?: string }) => {
      const date = opts?.date ?? selectedDateRef.current
      const silent = opts?.silent ?? false
      const generation = ++fetchGenerationRef.current

      if (!silent) setLoading(true)
      try {
        const q = new URLSearchParams({ store: hitodumaStore, date })
        const res = await fetch(`/api/hitoduma/schedules?${q}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('API format mismatch')
        const json = await res.json()

        // より新しい日付リクエストが走っていたら捨てる（未来→本日で未来が残る原因）
        if (generation !== fetchGenerationRef.current) return
        if (date !== selectedDateRef.current) return

        const dayData = (json.schedules || []).find((s: { date?: string }) => s.date === date)
        const mappedSchedules = dayData?.casts
          ? mapHitodumaDayCastsToSchedules(dayData.casts, date, brandId || '1')
          : []

        setSchedules(dedupeSchedulesByGirlPerDay(mappedSchedules as Schedule[]))
      } catch (e) {
        if (generation !== fetchGenerationRef.current) return
        if (date !== selectedDateRef.current) return
        console.error(e)
        // silent でも日付不一致のまま残さない（本日に戻したのに未来が出勤のまま、を防ぐ）
        setSchedules([])
      } finally {
        if (generation === fetchGenerationRef.current && !silent) {
          setLoading(false)
        }
      }
    },
    [brandId, hitodumaStore],
  )

  useEffect(() => {
    // 初回のみ SSR の本日分を残したまま裏で更新。日付変更時は必ず loading。
    const silentFirstToday = isFirstFetchRef.current && selectedDate === today
    isFirstFetchRef.current = false
    fetchSchedules({ silent: silentFirstToday, date: selectedDate })
  }, [fetchSchedules, selectedDate, today])

  useEffect(() => {
    if (!isViewingToday || viewMode !== 'week') return
    const timer = window.setInterval(() => {
      fetchSchedules({ silent: true, date: selectedDateRef.current })
    }, SOKUHIME_POLL_MS)
    return () => window.clearInterval(timer)
  }, [fetchSchedules, isViewingToday, viewMode])

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
            const q = new URLSearchParams({ store: hitodumaStore, date })
            const res = await fetch(`/api/hitoduma/schedules?${q}`)
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
  }, [calendarWeeks, today, hitodumaStore])

  useEffect(() => {
    if (viewMode === 'month') fetchMonthCounts()
  }, [fetchMonthCounts, viewMode])

  const selectDate = (dateStr: string) => {
    if (dateStr < today) return
    if (dateStr === selectedDate) return
    // 先に選択日を変え、古い出勤リストを残さない
    setSelectedDate(dateStr)
    setSchedules([])
    setLoading(true)
  }

  const goNextWeek = () => {
    const nextStart = addDays(windowStart, 7)
    setWindowStart(nextStart)
    if (selectedDate < nextStart) {
      setSelectedDate(nextStart)
      setSchedules([])
      setLoading(true)
    }
  }

  const backToToday = () => {
    setWindowStart(today)
    if (selectedDate !== today) {
      setSelectedDate(today)
      setSchedules([])
      setLoading(true)
    }
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
    setViewMode('week')
    if (dateStr !== selectedDate) {
      setSelectedDate(dateStr)
      setSchedules([])
      setLoading(true)
    }
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
            {schedulesForCards.map((s) => (
              <ScheduleCard
                key={`${selectedDate}-${s.id}`}
                schedule={s}
                display={
                  displayById.get(s.id) ??
                  getCrmScheduleCardDisplay(s, { isToday: isViewingToday })
                }
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
            href={scheduleMoreHref}
            className="inline-block border border-[#b8860b]/30 text-[#b8860b] text-xs px-8 py-3 tracking-[0.15em] hover:bg-[#b8860b]/5 transition"
          >
            出勤情報をもっと見る
          </Link>
        </div>
      </div>
    </section>
  )
}
