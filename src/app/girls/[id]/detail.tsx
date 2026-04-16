'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { CastExperienceBadge, CastPlayMatrix, CastProfileQA } from '@/components/cast-profile'
import { extractCastProfileExtra } from '@/lib/cast-profile/extract'
import { getGirlImageUrls } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'
import type { Brand } from '@/lib/brand/brand-context'
import { supabase } from '@/lib/supabase'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

// ============================================
// 画像スライダー
// ============================================

function ImageSlider({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  const goTo = useCallback((idx: number) => {
    setCurrent(Math.max(0, Math.min(idx, images.length - 1)))
  }, [images.length])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      touchDeltaX.current = e.touches[0].clientX - touchStartX.current
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (Math.abs(touchDeltaX.current) > 40) {
      goTo(current + (touchDeltaX.current < 0 ? 1 : -1))
    }
    touchStartX.current = null
    touchDeltaX.current = 0
  }, [current, goTo])

  const single = images.length <= 1

  return (
    <div className="relative">
      <div
        className="aspect-[3/4] bg-[#f5f5f4] overflow-hidden relative"
        onTouchStart={single ? undefined : onTouchStart}
        onTouchMove={single ? undefined : onTouchMove}
        onTouchEnd={single ? undefined : onTouchEnd}
      >
        {images.length > 0 ? (
          <img
            src={images[current]}
            alt={`${name} ${current + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl opacity-10">&#128100;</span>
          </div>
        )}

        {/* 左右タップエリア */}
        {!single && (
          <>
            <button
              type="button"
              aria-label="前の画像"
              className="absolute inset-y-0 left-0 w-1/3 z-10"
              onClick={() => goTo(current - 1)}
            />
            <button
              type="button"
              aria-label="次の画像"
              className="absolute inset-y-0 right-0 w-1/3 z-10"
              onClick={() => goTo(current + 1)}
            />
          </>
        )}
      </div>

      {/* ドットインジケーター */}
      {!single && (
        <div className="flex justify-center gap-1.5 py-3">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`画像 ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-[#b8860b]' : 'bg-[#d6d3d1]'
              }`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// 詳細ページ本体
// ============================================

function formatTime(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

function WeekSchedule({ schedules, weekStart }: { schedules: Schedule[]; weekStart: string }) {
  const days = ['月', '火', '水', '木', '金', '土', '日']
  const jstToday = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const scheduleMap = new Map(schedules.map((s) => [s.date, s]))

  return (
    <div>
      <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
      <h3
        className="text-xs tracking-[0.2em] text-[#78716c] mb-4"
        style={{ fontFamily: serif }}
      >
        今週の出勤予定
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((dateStr, i) => {
          const sched = scheduleMap.get(dateStr)
          const isWorking = sched?.status === 'working'
          const isToday = dateStr === jstToday
          const dayNum = new Date(dateStr + 'T00:00:00').getDate()

          return (
            <div
              key={dateStr}
              className={`text-center rounded-lg p-2 ${
                isWorking ? 'bg-[#b8860b]/10' : 'bg-[#fafaf9]'
              } ${isToday ? 'ring-1 ring-[#b8860b]/40' : ''}`}
            >
              <p className={`text-[9px] font-medium ${i >= 5 ? 'text-red-400' : 'text-[#78716c]'}`}>
                {days[i]}
              </p>
              <p className={`text-[10px] ${isToday ? 'font-bold text-[#b8860b]' : 'text-[#a8a29e]'}`}>
                {dayNum}
              </p>
              {isWorking ? (
                <div className="mt-1">
                  <p className="text-[9px] text-[#b8860b] font-medium leading-tight">
                    {formatTime(sched.start_time)}
                  </p>
                  <p className="text-[8px] text-[#a8a29e]">
                    ~{formatTime(sched.end_time)}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-[#d6d3d1] mt-1">-</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReserveModal({
  open,
  onClose,
  castId,
  castName,
  startTime,
}: {
  open: boolean
  onClose: () => void
  castId: string
  castName: string
  startTime: string
}) {
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [placeType, setPlaceType] = useState<'home' | 'hotel' | 'meetup'>('hotel')
  const [placeDetail, setPlaceDetail] = useState('')
  const [nominationType, setNominationType] = useState<'free' | 'photo' | 'main'>('photo')
  const [courseMinutes, setCourseMinutes] = useState<number>(90)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = useCallback(async () => {
    setError('')
    if (!customerPhone.trim()) {
      setError('電話番号を入力してください')
      return
    }
    // startTime から date / in_time を取り出す（"YYYY-MM-DD HH:MM" を優先）
    const m = String(startTime).match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/)
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const date = m?.[1] ?? nowJst.toISOString().slice(0, 10)
    const inTime = m?.[2] ?? ''
    setSubmitting(true)
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: 1,
          date,
          in_time: inTime,
          place_type: placeType,
          place_detail: placeDetail.trim() || null,
          nomination_type: nominationType,
          course_minutes: courseMinutes,
          customer_phone: customerPhone.trim(),
          customer_name: customerName.trim() || null,
          cast_id: Number.isFinite(Number(castId)) ? Number(castId) : null,
          cast_name: castName,
          notes: notes.trim() || null,
          source_url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || '送信に失敗しました')
      setDone(true)
    } catch (e: any) {
      setError(e?.message || '送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }, [castId, castName, startTime, customerPhone, customerName, placeType, placeDetail, nominationType, courseMinutes, notes])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="閉じる" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-3">
        <div className="w-full sm:max-w-md bg-white rounded-2xl shadow-xl border border-[#e7e5e4] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e7e5e4] flex items-center justify-between">
            <p className="text-sm font-medium tracking-wider" style={{ fontFamily: serif }}>
              予約リクエスト
            </p>
            <button type="button" onClick={onClose} className="text-xs text-[#78716c] hover:text-[#1c1917]">
              閉じる
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="bg-[#fafaf9] rounded-lg p-4 border border-[#f5f5f4]">
              <p className="text-[10px] text-[#a8a29e] tracking-wider mb-1">指名</p>
              <p className="text-sm text-[#1c1917]" style={{ fontFamily: serif }}>
                {castName}
              </p>
              <p className="text-[10px] text-[#78716c] mt-2">希望時間: {startTime}</p>
            </div>

            {done ? (
              <div className="bg-[#fafaf9] rounded-lg p-5 text-center">
                <p className="text-sm text-[#44403c] leading-relaxed">
                  送信しました。店舗から折り返しご連絡します。
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">お名前（任意）</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="山田"
                    className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">電話番号 *</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="090-1234-5678"
                    className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">場所 *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={placeType}
                      onChange={(e) => setPlaceType(e.target.value as any)}
                      className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
                    >
                      <option value="home">自宅</option>
                      <option value="hotel">ホテル</option>
                      <option value="meetup">待ち合わせ</option>
                    </select>
                    <input
                      value={placeDetail}
                      onChange={(e) => setPlaceDetail(e.target.value)}
                      placeholder="例）錦糸町駅付近"
                      className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">指名 *</label>
                    <select
                      value={nominationType}
                      onChange={(e) => setNominationType(e.target.value as any)}
                      className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
                    >
                      <option value="free">フリー</option>
                      <option value="photo">写真指名</option>
                      <option value="main">本指名</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">コース *</label>
                    <select
                      value={courseMinutes}
                      onChange={(e) => setCourseMinutes(Number(e.target.value))}
                      className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
                    >
                      {[60, 90, 120, 150, 180].map((m) => (
                        <option key={m} value={m}>
                          {m}分
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">備考（任意）</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="到着5分前に電話ください など"
                    className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#b8860b] resize-none"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="w-full text-center bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xs font-bold py-3 px-3 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? '送信中…' : '予約を送信'}
                </button>
                <p className="text-[10px] text-[#a8a29e] leading-relaxed">※送信後、店舗より折り返しのご連絡をします。</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MitsuGirlDetail({
  girl,
  brand,
  weekSchedules = [],
  weekStart = '',
}: {
  girl: Girl | null
  brand: Brand
  weekSchedules?: Schedule[]
  weekStart?: string
}) {
  if (!girl) {
    return (
      <main className="min-h-screen bg-white text-[#1c1917] flex flex-col items-center justify-center p-4">
        <p className="text-[#78716c] text-base mb-6">キャストが見つかりません</p>
        <Link
          href="/girls"
          className="border border-[#b8860b]/30 text-[#b8860b] text-xs px-6 py-2.5 tracking-wider hover:bg-[#b8860b]/5 transition"
        >
          一覧に戻る
        </Link>
      </main>
    )
  }

  const imageUrls = getGirlImageUrls(girl)
  const extra = girl as any
  const castExtra = extractCastProfileExtra(girl as Record<string, unknown>)
  const hasPlayMatrix = Object.keys(castExtra.playAvailability).length > 0
  const [reserveOpen, setReserveOpen] = useState(false)
  const [reserveStartTime, setReserveStartTime] = useState<string>('なるべく早め')
  const [nextAvailableText, setNextAvailableText] = useState<string>('スケジュール確認中')
  const [courseRows, setCourseRows] = useState<Array<{ duration_minutes: number; price: number; name: string }>>([])
  const [serviceOptions, setServiceOptions] = useState<
    Array<{ id: number; name: string; category: string | null; price: number; duration_minutes: number }>
  >([])

  const crmCastId = useMemo(() => {
    const raw = (girl as any)?.cast_id ?? (girl as any)?.crm_cast_id ?? girl.id
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }, [girl])

  useEffect(() => {
    let cancelled = false

    // 料金表（CRM同期済みのSupabase masterを読む）
    ;(async () => {
      const { data } = await supabase
        .from('store_courses')
        .select('name,duration_minutes,price,is_active,display_order,store_code')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('duration_minutes', { ascending: true })
      if (cancelled) return
      const rows = (data ?? [])
        .filter((r: any) => typeof r.duration_minutes === 'number' && typeof r.price === 'number')
        .map((r: any) => ({ name: String(r.name || ''), duration_minutes: r.duration_minutes, price: r.price }))
      setCourseRows(rows)
    })().catch(() => {})

    // 可能プレイ・オプション（CRM同期済み）
    ;(async () => {
      const { data } = await supabase
        .from('service_options')
        .select('id,name,category,price,duration_minutes,is_active,display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      if (cancelled) return
      setServiceOptions((data ?? []) as any)
    })().catch(() => {})

    // 最短のご案内（CRMスケジュールから計算）
    ;(async () => {
      if (!crmCastId) return
      const res = await fetch(`/api/crm/schedules?store_id=1`)
      if (!res.ok) return
      const json = await res.json()
      const schedules = json.schedules || []

      const now = new Date()
      const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
      const todayStr = jstNow.toISOString().slice(0, 10)
      const curMin = jstNow.getUTCHours() * 60 + jstNow.getUTCMinutes()

      const timeToMin = (t: string | null | undefined) => {
        if (!t) return null
        const m = String(t).match(/^(\d{1,2}):(\d{2})/)
        if (!m) return null
        return Number(m[1]) * 60 + Number(m[2])
      }

      let best: { date: string; start: string | null; end: string | null } | null = null

      for (const day of schedules) {
        const date = String(day.date || '')
        if (!date) continue
        const c = (day.casts || []).find((x: any) => Number(x.cast_id) === crmCastId)
        if (!c) continue
        const start = c.start_time ?? null
        const end = c.end_time ?? null
        if (!best) best = { date, start, end }
        if (date < (best?.date || date)) best = { date, start, end }
      }

      if (!best) {
        if (!cancelled) setNextAvailableText('スケジュール未掲載')
        return
      }

      if (best.date === todayStr) {
        const s = timeToMin(best.start)
        const e = timeToMin(best.end)
        if (s != null && e != null) {
          const endMin = e <= s ? e + 24 * 60 : e
          if (curMin < endMin) {
            if (curMin < s) {
              if (!cancelled) setNextAvailableText(`本日 ${String(best.start).slice(0, 5)}〜 ご案内可能`)
            } else {
              if (!cancelled) setNextAvailableText('🔥 本日 只今すぐご案内可能！')
            }
            return
          }
        }
      }

      const d = new Date(best.date + 'T00:00:00Z')
      const label = `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${best.start ? String(best.start).slice(0, 5) : ''}〜 ご案内可能`
      if (!cancelled) setNextAvailableText(label.trim())
    })().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [crmCastId])

  return (
    <main className="min-h-screen bg-white text-[#1c1917] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#b8860b]/30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/girls" className="text-[#78716c] text-xs tracking-wider hover:text-[#b8860b] transition">
            ← 一覧
          </Link>
          <h1 className="text-base text-[#1c1917] tracking-[0.2em] font-medium" style={{ fontFamily: serif }}>
            {girl.name}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Photo Slider */}
        <ImageSlider images={imageUrls} name={girl.name} />

        {/* Profile */}
        <div className="px-5 py-10">
          <h2
            className="text-2xl font-medium tracking-[0.2em] text-[#1c1917] mb-1"
            style={{ fontFamily: serif }}
          >
            {girl.name}
          </h2>
          {girl.catch_copy && (
            <p className="text-[#b8860b] text-sm mt-2 tracking-wider">{girl.catch_copy}</p>
          )}
          {castExtra.experienceStatus && (
            <div className="mt-4">
              <CastExperienceBadge status={castExtra.experienceStatus} />
            </div>
          )}

          <div className="w-10 h-px bg-[#b8860b] my-8" />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {girl.age && (
              <div className="bg-[#fafaf9] rounded-lg p-4">
                <p className="text-[10px] text-[#a8a29e] mb-1 tracking-wider">年齢</p>
                <p className="font-medium" style={{ fontFamily: serif }}>{girl.age}歳</p>
              </div>
            )}
            {extra.height && (
              <div className="bg-[#fafaf9] rounded-lg p-4">
                <p className="text-[10px] text-[#a8a29e] mb-1 tracking-wider">身長</p>
                <p className="font-medium" style={{ fontFamily: serif }}>{extra.height}cm</p>
              </div>
            )}
            {(extra.bust || extra.waist || extra.hip) && (
              <div className="bg-[#fafaf9] rounded-lg p-4 col-span-2">
                <p className="text-[10px] text-[#a8a29e] mb-1 tracking-wider">スリーサイズ</p>
                <p className="font-medium" style={{ fontFamily: serif }}>
                  B{extra.bust || '?'} / W{extra.waist || '?'} / H{extra.hip || '?'}
                </p>
              </div>
            )}
          </div>

          {/* Bio */}
          {extra.bio && (
            <>
              <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
              <h3
                className="text-xs tracking-[0.2em] text-[#78716c] mb-4"
                style={{ fontFamily: serif }}
              >
                自己紹介
              </h3>
              <p className="text-sm text-[#44403c] leading-loose whitespace-pre-line">
                {extra.bio}
              </p>
            </>
          )}

          {/* Manager Comment */}
          {extra.manager_comment && (
            <>
              <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
              <h3
                className="text-xs tracking-[0.2em] text-[#78716c] mb-4"
                style={{ fontFamily: serif }}
              >
                店長コメント
              </h3>
              <div className="bg-[#fafaf9] rounded-lg p-5">
                <p className="text-sm text-[#44403c] leading-loose whitespace-pre-line">
                  {extra.manager_comment}
                </p>
              </div>
            </>
          )}

          {/* ↓↓↓ ここから新しいUI（料金表＆オプション） ↓↓↓ */}
          
          {/* --- 1. 料金表エリア --- */}
          <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-sm tracking-[0.2em] text-[#78716c] font-bold" style={{ fontFamily: serif }}>
              料金表
            </h3>
            {extra?.course_type && (
              <span className="text-[10px] bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-[#44403c] px-2 py-0.5 rounded-sm shadow-sm font-bold">
                {extra.course_type === 'platinum' ? '💎 プラチナクラス' : 
                 extra.course_type === 'gold' ? '👑 ゴールドクラス' : '✨ スタンダードクラス'}
              </span>
            )}
          </div>

          {courseRows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {courseRows.map((c) => (
                <div
                  key={`${c.duration_minutes}-${c.price}`}
                  className="flex items-center justify-between border-b border-[#e7e5e4] py-3 px-1"
                >
                  <span className="text-sm text-[#44403c] tracking-wider">{c.duration_minutes}分</span>
                  <span className="text-base font-bold text-[#b8860b]" style={{ fontFamily: serif }}>
                    &yen;{c.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-[#d6d3d1] rounded-lg bg-[#fafaf9] mb-8">
              <p className="text-sm text-[#78716c] tracking-widest leading-relaxed" style={{ fontFamily: serif }}>
                料金表は準備中です。<br className="md:hidden" />
                詳細はお電話にてお問い合わせください。
              </p>
            </div>
          )}

          {/* 各種手数料 */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              { label: '入会金', value: '¥1,000' }, { label: '指名料', value: '¥1,000' },
              { label: '本指名料', value: '¥2,000' }, { label: '延長30分', value: '¥8,000' },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between bg-[#fafaf9]/60 border border-[#f5f5f4] rounded px-3 py-2">
                <span className="text-[11px] text-[#78716c]">{f.label}</span>
                <span className="text-[11px] font-medium text-[#44403c]">{f.value}</span>
              </div>
            ))}
          </div>

          {/* --- 2. オプションエリア（CRM連動） --- */}
          <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
          <h3 className="text-sm tracking-[0.2em] text-[#78716c] font-bold mb-4" style={{ fontFamily: serif }}>
            対応可能プレイ・オプション
          </h3>

          {hasPlayMatrix && (
            <div className="mb-2">
              <CastPlayMatrix availability={castExtra.playAvailability} />
            </div>
          )}

          {serviceOptions.length > 0 && (
            <div className={hasPlayMatrix ? 'mt-7' : ''}>
              {hasPlayMatrix && (
                <h4 className="text-xs tracking-[0.2em] text-[#78716c] mb-3 font-medium" style={{ fontFamily: serif }}>
                  オプション一覧
                </h4>
              )}
              <div className="flex flex-wrap gap-2">
                {serviceOptions.slice(0, 60).map((opt) => (
                  <span
                    key={opt.id}
                    className="text-[11px] text-[#44403c] bg-[#fafaf9] border border-[#e7e5e4] rounded px-3 py-1.5 shadow-sm"
                    title={opt.price ? `¥${opt.price.toLocaleString()}` : undefined}
                  >
                    {opt.name}
                    {opt.price ? `（¥${opt.price.toLocaleString()}）` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!hasPlayMatrix &&
            (!Array.isArray(extra.play_options) || extra.play_options.length === 0) && (
            <div className="py-6 text-center border border-dashed border-[#d6d3d1] rounded-lg bg-[#fafaf9]">
              <p className="text-xs text-[#78716c] tracking-widest" style={{ fontFamily: serif }}>
                オプション詳細は店舗までお問い合わせください。
              </p>
            </div>
          )}

          {castExtra.profileQa && (
            <>
              <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
              <h3 className="text-sm tracking-[0.2em] text-[#78716c] font-bold mb-4" style={{ fontFamily: serif }}>
                プロフィールQ&amp;A
              </h3>
              <CastProfileQA qa={castExtra.profileQa} />
            </>
          )}

          {/* リアルタイム空き枠＆ワンタップ予約カレンダー */}
          <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
          <h3 className="text-sm tracking-[0.2em] text-[#78716c] font-bold mb-4" style={{ fontFamily: serif }}>
            出勤スケジュール＆予約
          </h3>
          
          {(() => {
            // --- ここから追加・更新 ---
            const getNextAvailableText = (schedules: any[]) => {
              if (!schedules || schedules.length === 0) return "スケジュール確認中";

              const now = new Date();
              const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
              const currentTimeStr = now.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });

              // 文字列の時刻を「分（数値）」に変換するヘルパー関数
              const timeToMins = (timeStr: string) => {
                if (!timeStr) return 0;
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + (m || 0);
              };

              const currentMins = timeToMins(currentTimeStr);

              for (const s of schedules) {
                if (s.is_off) continue;
                if (s.is_full) continue;

                let startMins = timeToMins(s.start_time);
                let endMins = timeToMins(s.end_time);

                // ★日またぎ（翌朝終了）の対応：終了が開始より前なら、24時間(1440分)を足す
                if (endMins <= startMins) {
                  endMins += 24 * 60;
                }

                if (s.date === todayStr) {
                  if (currentMins < endMins) {
                    if (currentMins < startMins) {
                      return `本日 ${s.start_time.slice(0,5)}〜 ご案内可能`;
                    } else {
                      return `🔥 本日 只今すぐご案内可能！`;
                    }
                  }
                } else if (s.date > todayStr) {
                  const dateObj = new Date(s.date);
                  const tomorrow = new Date(now);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

                  if (s.date === tomorrowStr) {
                    return `明日 ${s.start_time?.slice(0,5)}〜 ご案内可能`;
                  } else {
                    return `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${s.start_time?.slice(0,5)}〜 ご案内可能`;
                  }
                }
              }
              return "🈵 本日はご予約満了です";
            };

            const nextAvailableTextResolved = nextAvailableText
            // --- ここまで追加・更新 ---

            return (
              <>
                {/* 最短のご案内（リアルタイム空き枠アピール） */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-bold">最短のご案内</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">{nextAvailableTextResolved}</span>
                </div>

                {/* スケジュールリスト */}
                <div className="flex overflow-x-auto pb-4 gap-3 snap-x">
                  {weekSchedules?.map((schedule: any, i: number) => {
                    const dateObj = new Date(schedule.date);
                    const dayStr = ['日','月','火','水','木','金','土'][dateObj.getDay()];
                    const isToday = i === 0;

                    return (
                      <div key={schedule.date} className={`min-w-[110px] snap-start border rounded-xl overflow-hidden shadow-sm flex flex-col ${isToday ? 'border-[#b8860b]' : 'border-gray-200'}`}>
                        <div className={`text-center py-1 text-xs font-bold ${isToday ? 'bg-[#b8860b] text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {dateObj.getMonth() + 1}/{dateObj.getDate()} ({dayStr})
                        </div>
                        
                        <div className="p-2 flex-grow flex flex-col items-center justify-center bg-white">
                          {schedule.is_off ? (
                            <span className="text-gray-400 text-sm font-bold my-4">お休み</span>
                          ) : schedule.is_full ? (
                            /* ★ 満了の場合のUI（グレーアウト） */
                            <div className="w-full flex flex-col gap-2 mt-1">
                              <span className="text-sm font-bold text-gray-400 text-center line-through decoration-gray-300">
                                {schedule.start_time?.slice(0,5)}<br/>|<br/>{schedule.end_time?.slice(0,5)}
                              </span>
                              <button disabled className="w-full text-center bg-gray-400 text-white text-[10px] font-bold py-1.5 px-2 rounded shadow-sm cursor-not-allowed">
                                🈵 ご予約満了
                              </button>
                            </div>
                          ) : (
                            /* 空きがある場合のUI（赤い予約ボタン） */
                            <div className="w-full flex flex-col gap-2 mt-1">
                              <span className="text-sm font-bold text-[#44403c] text-center">
                                {schedule.start_time?.slice(0,5)}<br/>|<br/>{schedule.end_time?.slice(0,5)}
                              </span>
                              {/* ワンタップ電話予約ボタン（将来的にログイン予約へ変更予定） */}
                              <button
                                type="button"
                                onClick={() => {
                                  const start = schedule.date
                                    ? `${schedule.date} ${String(schedule.start_time || '').slice(0, 5)}`
                                    : String(schedule.start_time || '')
                                  setReserveStartTime(start.trim() || 'なるべく早め')
                                  setReserveOpen(true)
                                }}
                                className="w-full text-center bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-[10px] font-bold py-1.5 px-2 rounded shadow-sm transition-transform active:scale-95"
                              >
                                ここから予約
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
          
          {/* ↑↑↑ ここまで ↑↑↑ */}

          {/* 口コミ（CRMメイン運用のため公式側では非対応） */}

          {/* Phone CTA */}
          {brand.phone && (
            <>
              <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
              <button
                type="button"
                onClick={() => {
                  setReserveStartTime('なるべく早め')
                  setReserveOpen(true)
                }}
                className="w-full text-center border border-[#b8860b]/40 text-[#b8860b] py-4 tracking-[0.2em] font-medium hover:bg-[#b8860b]/5 transition"
                style={{ fontFamily: serif }}
              >
                {girl.name}を予約する
              </button>
            </>
          )}
        </div>
      </div>

      <ReserveModal
        open={reserveOpen}
        onClose={() => {
          setReserveOpen(false)
          setReserveStartTime('なるべく早め')
        }}
        castId={String(girl.id)}
        castName={girl.name}
        startTime={reserveStartTime}
      />
    </main>
  )
}
