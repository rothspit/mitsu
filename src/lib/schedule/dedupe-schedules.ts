import type { Schedule } from '@/lib/brand/brand-queries'

/**
 * 同一日・同一 girl_id の行が複数ある場合は1件にまとめる（DBや同期の重複対策）。
 * 複数ある場合は start_time が最も早い行を残す。
 */
export function dedupeSchedulesByGirlPerDay(schedules: Schedule[]): Schedule[] {
  const best = new Map<string, Schedule>()
  for (const s of schedules) {
    const gid = String(s.girl_id)
    const prev = best.get(gid)
    if (!prev) {
      best.set(gid, s)
      continue
    }
    const a = (prev.start_time || '').slice(0, 8)
    const b = (s.start_time || '').slice(0, 8)
    if (b && (!a || b < a)) best.set(gid, s)
  }
  return Array.from(best.values())
}
