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
const BRAND_SLUG = 'hitomitsu'

// ============================================
// 朝8時基準の日付ユーティリティ
// ============================================

/** JST現在時刻を取得 */
function jstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

/** 朝8時基準の「営業日」を返す（0:00〜7:59は前日扱い） */
function businessDate(): string {
  const now = jstNow()
  const hour = now.getUTCHours() // JSTオフセット済みなのでUTC時間がJST時間
  if (hour < 8) {
    // 深夜0〜7時台 → 前日扱い
    now.setUTCDate(now.getUTCDate() - 1)
  }
  return now.toISOString().slice(0, 10)
}

/** 日付文字列にn日加算 */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** 今週の月曜日を起点に7日分の日付配列を返す */
function getWeekDates(baseDate: string): string[] {
  const d = new Date(baseDate + 'T00:00:00Z')
  const dow = d.getUTCDay() // 0=日, 1=月, ...
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = addDays(baseDate, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** 曜日ラベル（短縮） */
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function getDow(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay()
}

/** 日付 → "M/D" */
function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
}

/** 日付 → "YYYY年M月D日(曜)" */
function fullDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日(${DOW_LABELS[d.getUTCDay()]})`
}

/** 出勤時間のフォーマット（翌朝表記対応） */
function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

// ============================================
// カード型の出勤表示
// ============================================

function CastCard({ schedule }: { schedule: Schedule }) {
  const girl = schedule.girl as Girl | undefined
  const imageUrl = getGirlImageUrl(girl)

  return (
    <Link
      href={girl ? `/girls/${girl.id}` : '#'}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 group"
    >
      {/* 写真 */}
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
        {/* schedule_text バッジ */}
        {schedule.schedule_text && (
          <span className="absolute top-2 left-2 text-[10px] text-white bg-[#b8860b] rounded-full px-2.5 py-0.5 shadow-sm">
            {schedule.schedule_text}
          </span>
        )}
      </div>
      {/* 情報 */}
      <div className="px-3 py-3">
        <p
          className="text-sm font-medium text-[#1c1917] truncate"
          style={{ fontFamily: serif }}
        >
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

export default function MitsuSchedulePage() {
  const today = useMemo(() => businessDate(), [])
  const weekDates = useMemo(() => getWeekDates(today), [today])

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialDate = params?.get('date') || today

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  // 出勤データ取得
  const fetchSchedules = useCallback(async () => {
    if (!brandId) return
    setLoading(true)
    const { data } = await supabase
      .from('schedules')
      .select('*, girl:girls(*), area:areas(id, name, slug)')
      .eq('brand_id', brandId)
      .eq('date', selectedDate)
      .eq('status', 'working')
      .order('start_time', { ascending: true })
    setSchedules((data ?? []) as Schedule[])
    setLoading(false)
  }, [brandId, selectedDate])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // URL同期
  useEffect(() => {
    const url = selectedDate === today ? '/schedule' : `/schedule?date=${selectedDate}`
    window.history.replaceState(null, '', url)
  }, [selectedDate, today])

  // 前週・次週ナビ
  const weekStart = weekDates[0]
  const goWeek = (offset: number) => {
    const newBase = addDays(selectedDate, offset * 7)
    setSelectedDate(newBase)
  }

  // 次週の日付配列（selectedDateが今週外の場合に対応）
  const displayWeek = useMemo(() => getWeekDates(selectedDate), [selectedDate])

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

      {/* ===== 週タブ ===== */}
      <div className="sticky top-[53px] z-40 bg-white border-b border-[#e7e5e4]">
        <div className="max-w-2xl mx-auto">
          {/* 週ナビ */}
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <button
              onClick={() => goWeek(-1)}
              className="text-xs text-[#78716c] hover:text-[#b8860b] transition px-2 py-1"
            >
              ◀ 前週
            </button>
            {selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-[10px] text-[#b8860b] underline hover:no-underline transition"
              >
                今日に戻る
              </button>
            )}
            <button
              onClick={() => goWeek(1)}
              className="text-xs text-[#78716c] hover:text-[#b8860b] transition px-2 py-1"
            >
              次週 ▶
            </button>
          </div>
          {/* 日付タブ */}
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
                  onClick={() => setSelectedDate(dateStr)}
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
                  {/* 選択インジケータ */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#b8860b] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== メインコンテンツ ===== */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        {/* 日付・人数ヘッダ */}
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

        {/* コンテンツ */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
            <p className="text-[#a8a29e] text-sm mt-3">読み込み中...</p>
          </div>
        ) : schedules.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {schedules.map((s) => (
              <CastCard key={s.id} schedule={s} />
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
    </main>
  )
}
