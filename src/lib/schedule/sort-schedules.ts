import type { Schedule } from '@/lib/brand/brand-queries'
import { jstNow } from '@/lib/business-date'

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

  // 本日終了
  if (!isOvernight && end > 0 && end <= nowMin) return 4

  // 出勤中
  if (start <= nowMin && nowMin < effectiveEnd) {
    const girl = s.girl as Record<string, unknown> | undefined
    const ws = (girl?.wait_status as number) || 0
    return ws === 3 ? 2 : 1 // 受付終了=満員, otherwise=空きあり
  }

  // もうすぐ出勤（2時間以内）
  if (start > nowMin && start - nowMin <= 120) return 3

  // それ以降
  return 5
}

function getSortKey(s: Schedule, category: number): number {
  if (category === 1) {
    const girl = s.girl as Record<string, unknown> | undefined
    const ws = (girl?.wait_status as number) || 0
    if (ws === 1) return 0 // 待機中 → 今すぐ
    if (ws === 2) {
      const aEnd = (girl?.attend_end_time as string) || ''
      return aEnd ? sTimeToMin(aEnd) : 9999
    }
    return 0
  }
  return sTimeToMin(s.start_time)
}

/** 今日の出勤は「今すぐ/直近」を上に（それ以外の日は順序を変えない） */
export function sortSchedulesForToday(
  schedules: Schedule[],
  isToday: boolean
): { sorted: Schedule[]; endedIds: Set<string> } {
  if (!isToday) return { sorted: schedules, endedIds: new Set() }
  const now = jstNow()
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  const withInfo = schedules.map((s) => {
    const cat = getScheduleCategory(s, nowMin)
    return { s, cat, sortKey: getSortKey(s, cat) }
  })
  withInfo.sort((a, b) => (a.cat !== b.cat ? a.cat - b.cat : a.sortKey - b.sortKey))
  const endedIds = new Set(withInfo.filter((x) => x.cat === 4).map((x) => x.s.id))
  return { sorted: withInfo.map((x) => x.s), endedIds }
}

