'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { HITOMITSU_PHONE } from '@/lib/brand/hitomitsu-phone'

const PHONE = HITOMITSU_PHONE
const DISCORD_WEBHOOK = 'https://discordapp.com/api/webhooks/1475912332063408404/odrVJd5Ftsyh-5_oaJq75ELf-gJvTxtqMH18i6trvod2fBpTc7YTHtuY1_882A8IYtmF'
const COURSES = ['60分', '90分', '120分', '180分']
const BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

function generateTimeOptions() {
  const opts: { value: string; label: string }[] = []
  for (let i = 0; i <= 38; i++) {
    const totalMin = 10 * 60 + i * 30
    const h = Math.floor(totalMin / 60) % 24
    const m = totalMin % 60
    const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const prefix = totalMin >= 24 * 60 ? '翌' : ''
    opts.push({ value: val, label: `${prefix}${val}` })
  }
  return opts
}

function generateDateOptions() {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  const days = ['日', '月', '火', '水', '木', '金', '土']
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const suffix = i === 0 ? ' 今日' : i === 1 ? ' 明日' : ''
    opts.push({
      value: `${y}-${m}-${dd}`,
      label: `${m}/${dd}(${days[d.getDay()]})${suffix}`,
    })
  }
  return opts
}

const TIME_OPTIONS = generateTimeOptions()

export default function CtaBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [omakase, setOmakase] = useState(false)
  const [castNames, setCastNames] = useState<string[]>([])
  const [tel, setTel] = useState('')
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [course, setCourse] = useState('')
  const [cast, setCast] = useState('')
  const [area, setArea] = useState('')

  const dateOptions = generateDateOptions()

  useEffect(() => {
    fetch('/api/hitoduma/casts?store=hitoduma_nishi')
      .then((res) => res.json())
      .then((data) => {
        const casts = data.casts || data.data || []
        // Only active casts (not 退店, not お休み中)
        const activeCasts = casts.filter((c: any) => c.status !== '退店' && c.status !== 'お休み中')
        setCastNames(activeCasts.map((g: any) => g.name).filter(Boolean))
      })
      .catch((err) => console.error('Failed to fetch cast names for CtaBar', err))
  }, [])

  if (pathname?.startsWith('/admin')) return null

  const resetForm = () => {
    setTel(''); setName(''); setDate(''); setTime('')
    setCourse(''); setCast(''); setArea('')
    setOmakase(false); setDone(false); setSending(false)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(resetForm, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tel.trim()) return
    setSending(true)

    const lines = [
      `📅 **WEB予約**`,
      `📞 ${tel.trim()}`,
      name.trim() ? `👤 ${name.trim()}` : null,
      omakase ? '✨ **全てお店にお任せ**' : null,
      !omakase && date ? `🗓 希望日: ${date}` : null,
      !omakase && time ? `🕐 希望時間: ${time}` : null,
      !omakase && course ? `⏱ コース: ${course}` : null,
      !omakase && cast ? `💎 指名: ${cast}` : null,
      !omakase && area.trim() ? `📍 場所: ${area.trim()}` : null,
    ].filter(Boolean).join('\n')

    try {
      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: lines }),
      })
      setDone(true)
    } catch {
      alert('送信に失敗しました。お電話にてお問い合わせください。')
      setSending(false)
    }
  }

  const inputClass =
    'w-full bg-white/[0.03] border border-white/[0.12] rounded-lg px-3.5 py-3 text-[15px] text-white placeholder:text-neutral-600 outline-none focus:border-amber-700/50 transition-colors'
  const selectClass = inputClass + ' appearance-none'

  return (
    <>
      {/* Fixed CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] flex border-t border-[#b8860b]/20 bg-white/95 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <a
          href={`tel:${PHONE}`}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] font-semibold text-[#b8860b] hover:bg-[#b8860b]/5 transition-colors"
        >
          <span className="text-base">☎</span>
          電話する
        </a>
        <div className="w-px bg-[#b8860b]/15 my-2" />
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[14px] font-semibold text-white bg-[#b8860b] hover:bg-[#a07508] transition-colors"
        >
          <span className="text-base">📅</span>
          予約する
        </button>
      </div>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-t-2 border-amber-800/40 rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto pb-24 md:pb-6 animate-[slideUp_0.3s_ease-out] relative">
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-5 text-neutral-500 hover:text-white text-2xl leading-none"
            >
              &times;
            </button>

            {!done ? (
              <div className="p-5 pt-6">
                <h2 className="text-center text-amber-500 text-lg tracking-wider mb-5" style={{ fontFamily: "var(--font-noto-serif), 'Noto Serif JP', serif" }}>
                  ご予約・お問い合わせ
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-[13px] text-neutral-400 mb-1.5">
                      お電話番号<span className="text-amber-500 text-[11px] ml-1">必須</span>
                    </label>
                    <input
                      type="tel"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      placeholder="090-1234-5678"
                      required
                      className={inputClass}
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-[13px] text-neutral-400 mb-1.5">お尋ね名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例：タナカ"
                      className={inputClass}
                    />
                  </div>

                  {/* Omakase */}
                  <label className="flex items-center gap-2.5 p-3.5 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={omakase}
                      onChange={(e) => setOmakase(e.target.checked)}
                      className="accent-amber-500 w-[18px] h-[18px]"
                    />
                    <span className="text-amber-500 text-sm font-medium">全てお店にお任せ</span>
                  </label>

                  {/* Detail fields */}
                  <div className={`space-y-4 transition-opacity ${omakase ? 'opacity-30 pointer-events-none' : ''}`}>
                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[13px] text-neutral-400 mb-1.5">希望日</label>
                        <select value={date} onChange={(e) => setDate(e.target.value)} className={selectClass}>
                          <option value="">選択</option>
                          {dateOptions.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] text-neutral-400 mb-1.5">希望時間</label>
                        <select value={time} onChange={(e) => setTime(e.target.value)} className={selectClass}>
                          <option value="">選択</option>
                          {TIME_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Course */}
                    <div>
                      <label className="block text-[13px] text-neutral-400 mb-1.5">コース・時間</label>
                      <select value={course} onChange={(e) => setCourse(e.target.value)} className={selectClass}>
                        <option value="">選択してください</option>
                        {COURSES.map((c) => (
                          <option key={c} value={c}>{c}コース</option>
                        ))}
                      </select>
                    </div>

                    {/* Cast */}
                    <div>
                      <label className="block text-[13px] text-neutral-400 mb-1.5">キャスト指名</label>
                      <select value={cast} onChange={(e) => setCast(e.target.value)} className={selectClass}>
                        <option value="">選択してください</option>
                        <option value="おまかせ">おまかせ</option>
                        {castNames.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    {/* Area */}
                    <div>
                      <label className="block text-[13px] text-neutral-400 mb-1.5">エリア・場所</label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="例：西船橋駅周辺ホテル / 自宅"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={sending || !tel.trim()}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 text-neutral-950 rounded-xl text-base font-bold tracking-wider hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {sending ? '送信中...' : '予約を送信する'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-neutral-300 leading-relaxed text-sm">
                  ご予約を受け付けました。<br />
                  折り返しご連絡いたします。
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 px-8 py-3 bg-white/10 border border-white/20 rounded-lg text-neutral-300 hover:bg-white/20 transition-colors"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation keyframe + body padding */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        body { padding-bottom: 64px !important; }
        select option { background: #1a1a1a; color: #f3f3f3; }
      `}</style>
    </>
  )
}
