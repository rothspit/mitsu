/**
 * 日本時間（Asia/Tokyo）の壁時計を基準にしたユーティリティ。
 * 出勤カレンダーの「今日」は 朝8時未満なら前日を営業日として扱う。
 */

const TOKYO = 'Asia/Tokyo'

/**
 * 現在時刻を JST の壁時計に合わせた Date（UTCフィールドがJST相当）として扱う既存ロジック。
 * 空き状況ソート等の「今何時」判定用。
 */
export function jstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

/**
 * 営業日ベースの「今日」YYYY-MM-DD（日本時間で 8 時未満 → 前日）。
 */
export function businessDate(): string {
  const now = new Date()
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: TOKYO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(now)
  const y = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)

  if (Number.isNaN(y) || Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(hour)) {
    return new Date().toISOString().slice(0, 10)
  }

  let yy = y
  let mm = month
  let dd = day
  if (hour < 8) {
    const t = new Date(Date.UTC(yy, mm - 1, dd))
    t.setUTCDate(t.getUTCDate() - 1)
    yy = t.getUTCFullYear()
    mm = t.getUTCMonth() + 1
    dd = t.getUTCDate()
  }
  return `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}
