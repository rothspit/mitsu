import type { Girl } from '@/lib/brand/brand-queries'
import { businessDate } from '@/lib/business-date'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** 在籍キャスト一覧の並び: 直近14日の出勤回数が多い順 → sort_order → 名前 */
export async function fetchHitomitsuGirlsSortedByScheduleCount(opts?: {
  limit?: number
}): Promise<Girl[]> {
  const { data: girlsRaw } = await supabase
    .from('girls')
    .select('*')
    .eq('brand_id', HITOMITSU_BRAND_ID)
    .eq('is_active', true)

  let girls = (girlsRaw ?? []) as Girl[]

  const from = businessDate()
  const to = addDays(from, 14)
  const { data: schRows } = await supabase
    .from('schedules')
    .select('girl_id')
    .eq('brand_id', HITOMITSU_BRAND_ID)
    .eq('status', 'working')
    .not('start_time', 'is', null)
    .gte('date', from)
    .lte('date', to)

  const counts = new Map<string, number>()
  for (const r of (schRows ?? []) as { girl_id: string }[]) {
    const id = String(r.girl_id)
    counts.set(id, (counts.get(id) || 0) + 1)
  }

  girls.sort((a, b) => {
    const ca = counts.get(String(a.id)) || 0
    const cb = counts.get(String(b.id)) || 0
    if (cb !== ca) return cb - ca
    const sa = Number((a as Record<string, unknown>).sort_order ?? 999999)
    const sb = Number((b as Record<string, unknown>).sort_order ?? 999999)
    if (sa !== sb) return sa - sb
    return String(a.name).localeCompare(String(b.name), 'ja')
  })

  if (opts?.limit != null) {
    girls = girls.slice(0, opts.limit)
  }

  return girls
}

export async function countHitomitsuActiveGirls(): Promise<number> {
  const { count } = await supabase
    .from('girls')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', HITOMITSU_BRAND_ID)
    .eq('is_active', true)
  return count ?? 0
}
