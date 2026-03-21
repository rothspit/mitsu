'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { getGirlImageUrls } from '@/lib/brand/image-utils'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'
import type { Brand } from '@/lib/brand/brand-context'

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

export interface Review {
  id: string
  nickname: string
  rating: number
  title: string | null
  content: string
  created_at: string
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-[#b8860b]">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  )
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null
  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const date = new Date(r.created_at)
        const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
        return (
          <div key={r.id} className="bg-[#fafaf9] rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#78716c]">{r.nickname}</span>
              <span className="text-[10px] text-[#a8a29e]">{dateStr}</span>
            </div>
            <div className="text-sm mb-1"><Stars count={r.rating} /></div>
            {r.title && <p className="text-sm font-medium text-[#1c1917] mb-1">{r.title}</p>}
            <p className="text-sm text-[#44403c] leading-relaxed whitespace-pre-line">{r.content}</p>
          </div>
        )
      })}
    </div>
  )
}

function ReviewForm({ girlId }: { girlId: string }) {
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState('')
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = useCallback(async () => {
    if (!nickname.trim() || !content.trim()) {
      setError('ニックネームと口コミ内容を入力してください')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ girl_id: girlId, nickname: nickname.trim(), rating, title: title.trim() || null, content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '送信に失敗しました')
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }, [girlId, nickname, rating, title, content])

  if (done) {
    return (
      <div className="bg-[#fafaf9] rounded-lg p-5 text-center">
        <p className="text-sm text-[#44403c]">口コミを投稿しました。<br />承認後に表示されます。</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-[#b8860b]/30 text-[#b8860b] text-xs py-3 tracking-wider hover:bg-[#b8860b]/5 transition rounded-lg"
      >
        口コミを書く
      </button>
    )
  }

  return (
    <div className="bg-[#fafaf9] rounded-lg p-5 space-y-3">
      <div>
        <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">ニックネーム *</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={50}
          className="w-full border border-[#d6d3d1] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
          placeholder="匿名"
        />
      </div>
      <div>
        <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">評価 *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setRating(v)} className="text-xl">
              <span className={v <= rating ? 'text-[#b8860b]' : 'text-[#d6d3d1]'}>★</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">タイトル</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full border border-[#d6d3d1] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#b8860b]"
        />
      </div>
      <div>
        <label className="text-[10px] text-[#a8a29e] tracking-wider block mb-1">口コミ内容 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full border border-[#d6d3d1] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#b8860b] resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex-1 bg-[#b8860b] text-white text-xs py-2.5 rounded tracking-wider hover:bg-[#a0750a] transition disabled:opacity-50"
        >
          {submitting ? '送信中...' : '投稿する'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 text-xs text-[#78716c] border border-[#d6d3d1] rounded hover:bg-[#fafaf9] transition"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

export default function MitsuGirlDetail({
  girl,
  brand,
  weekSchedules = [],
  weekStart = '',
  reviews = [],
}: {
  girl: Girl | null
  brand: Brand
  weekSchedules?: Schedule[]
  weekStart?: string
  reviews?: Review[]
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

          {(() => {
            const courseMaster: Record<string, any> = {
              standard: {
                prices: [
                  { time: '60分', price: 12000 }, { time: '80分', price: 16000 },
                  { time: '100分', price: 20000 }, { time: '120分', price: 24000 },
                  { time: '150分', price: 30000 }, { time: '180分', price: 36000 },
                ],
                longPrices: [
                  { time: '210', label: '210分 (ロング)', price: 42000 },
                  { time: '240', label: '240分 (ロング)', price: 48000 },
                  { time: '300', label: '300分 (ロング)', price: 60000 },
                ]
              },
              gold: {
                prices: [
                  { time: '60分', price: 15000 }, { time: '80分', price: 19000 },
                  { time: '100分', price: 23000 }, { time: '120分', price: 27000 },
                  { time: '150分', price: 33000 }, { time: '180分', price: 39000 },
                ],
                longPrices: [
                  { time: '210', label: '210分 (ロング)', price: 45000 },
                  { time: '240', label: '240分 (ロング)', price: 51000 },
                  { time: '300', label: '300分 (ロング)', price: 63000 },
                ]
              },
              platinum: {
                prices: [
                  { time: '60分', price: 18000 }, { time: '80分', price: 23000 },
                  { time: '100分', price: 28000 }, { time: '120分', price: 33000 },
                  { time: '150分', price: 40000 }, { time: '180分', price: 48000 },
                ],
                longPrices: [
                  { time: '210', label: '210分 (ロング)', price: 56000 },
                  { time: '240', label: '240分 (ロング)', price: 64000 },
                  { time: '300', label: '300分 (ロング)', price: 80000 },
                ]
              }
            };

            const activeCourse = extra?.course_type ? courseMaster[extra.course_type] : null;

            // ★ データが空（未設定）の場合は「電話で確認」を表示
            if (!activeCourse) {
              return (
                <div className="py-10 text-center border border-dashed border-[#d6d3d1] rounded-lg bg-[#fafaf9] mb-8">
                  <p className="text-sm text-[#78716c] tracking-widest leading-relaxed" style={{ fontFamily: serif }}>
                    現在コース設定中です。<br className="md:hidden" />
                    詳細な料金につきましては、<br className="md:hidden" />お電話にてお問い合わせください。
                  </p>
                </div>
              );
            }

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                  {activeCourse.prices.map((c: any) => (
                    <div key={c.time} className="flex items-center justify-between border-b border-[#e7e5e4] py-3 px-1">
                      <span className="text-sm text-[#44403c] tracking-wider">{c.time}</span>
                      <span className="text-base font-bold text-[#b8860b]" style={{ fontFamily: serif }}>
                        &yen;{c.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="flex items-center gap-2">
                    <select 
                      className="w-full text-sm border border-[#d6d3d1] bg-[#fafaf9] rounded-md px-3 py-2 text-[#44403c] focus:outline-none focus:ring-1 focus:ring-[#b8860b]"
                      onChange={(e) => {
                        const targetPrice = e.target.options[e.target.selectedIndex].dataset.price;
                        const priceDisplay = document.getElementById('long-price-display');
                        if (priceDisplay) priceDisplay.innerText = '¥' + Number(targetPrice).toLocaleString();
                      }}
                    >
                      {activeCourse.longPrices.map((lp: any) => (
                        <option key={lp.time} value={lp.time} data-price={lp.price}>
                          {lp.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end py-2 px-1 mt-2 md:mt-0">
                    <span id="long-price-display" className="text-lg font-bold text-[#b8860b]" style={{ fontFamily: serif }}>
                      &yen;{activeCourse.longPrices[0].price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}

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
          
          {/* ★ CRMから取得した extra.play_options などの配列を展開 */}
          {(!extra?.play_options || extra.play_options.length === 0) ? (
            <div className="py-6 text-center border border-dashed border-[#d6d3d1] rounded-lg bg-[#fafaf9]">
              <p className="text-xs text-[#78716c] tracking-widest" style={{ fontFamily: serif }}>
                オプション詳細は店舗までお問い合わせください。
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {extra.play_options.map((option: string, idx: number) => (
                <span key={idx} className="text-[11px] text-[#44403c] bg-[#fafaf9] border border-[#e7e5e4] rounded px-3 py-1.5 shadow-sm">
                  {option}
                </span>
              ))}
            </div>
          )}

          {/* リアルタイム空き枠＆ワンタップ予約カレンダー */}
          <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
          <h3 className="text-sm tracking-[0.2em] text-[#78716c] font-bold mb-4" style={{ fontFamily: serif }}>
            出勤スケジュール＆予約
          </h3>
          
          {/* 最短のご案内（リアルタイム空き枠アピール） */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-red-600">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-bold">最短のご案内</span>
            </div>
            {/* ※実際のバックエンドから「次の空き時間」を取得して表示します */}
            <span className="text-sm font-bold text-red-700">本日 15:30〜 可能</span>
          </div>

          {/* スケジュールリスト */}
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x">
            {weekSchedules?.map((schedule, i) => {
              const dateObj = new Date(schedule.date);
              const dayStr = ['日','月','火','水','木','金','土'][dateObj.getDay()];
              const isToday = i === 0; // 簡易的な本日の判定

              return (
                <div key={schedule.date} className={`min-w-[110px] snap-start border rounded-xl overflow-hidden shadow-sm flex flex-col ${isToday ? 'border-[#b8860b]' : 'border-gray-200'}`}>
                  {/* 日付ヘッダー */}
                  <div className={`text-center py-1 text-xs font-bold ${isToday ? 'bg-[#b8860b] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {dateObj.getMonth() + 1}/{dateObj.getDate()} ({dayStr})
                  </div>
                  
                  {/* 出勤時間＆予約ボタン */}
                  <div className="p-2 flex-grow flex flex-col items-center justify-center bg-white">
                    {schedule.is_off ? (
                      <span className="text-gray-400 text-sm font-bold my-4">お休み</span>
                    ) : (
                      <div className="w-full flex flex-col gap-2 mt-1">
                        <span className="text-sm font-bold text-[#44403c] text-center">
                          {schedule.start_time?.slice(0,5)}<br/>|<br/>{schedule.end_time?.slice(0,5)}
                        </span>
                        {/* ワンタップ予約ボタン：クリックで予約画面へパラメータ付きで遷移（※将来的にはログイン会員用予約へ変更予定） */}
                        <a 
                          href={brand.phone ? `tel:${brand.phone}` : "#"}
                          className="w-full text-center bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-[10px] font-bold py-1.5 px-2 rounded shadow-sm transition-transform active:scale-95"
                        >
                          ここから予約
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* ↑↑↑ ここまで ↑↑↑ */}

          {/* Reviews */}
          <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
          <h3
            className="text-xs tracking-[0.2em] text-[#78716c] mb-4"
            style={{ fontFamily: serif }}
          >
            口コミ
          </h3>
          {reviews.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg text-[#b8860b]" style={{ fontFamily: serif }}>
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <Stars count={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)} />
                <span className="text-[10px] text-[#a8a29e]">({reviews.length}件)</span>
              </div>
              <ReviewList reviews={reviews} />
            </div>
          )}
          <ReviewForm girlId={girl.id} />

          {/* Phone CTA */}
          {brand.phone && (
            <>
              <div className="w-10 h-px bg-[#b8860b]/30 my-8" />
              <a
                href={`tel:${brand.phone}`}
                className="block text-center border border-[#b8860b]/40 text-[#b8860b] py-4 tracking-[0.2em] font-medium hover:bg-[#b8860b]/5 transition"
                style={{ fontFamily: serif }}
              >
                &#9742; {girl.name}を予約する
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
