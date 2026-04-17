import { resolveHitodumaStoreId } from '@/lib/crm/resolve-hitoduma-store'
import type { Girl, Schedule } from '@/lib/brand/brand-queries'

const API_BASE_URL = 'https://crm.h-mitsu.com/api'

export type HitodumaCastFetchOpts = {
  limit?: number
  status?: string
  includeInactive?: boolean
  excludeStatuses?: string[]
}

/** When CRM enriches `/idol/casts`, pick Hitoduma `stores.code` for reservations. */
function hitodumaReserveStoreCodeFromCastRow(c: Record<string, unknown>): string | undefined {
  const direct =
    (typeof c.primary_store_code === 'string' && c.primary_store_code) ||
    (typeof c.hitoduma_primary_store_code === 'string' && c.hitoduma_primary_store_code) ||
    (typeof c.primaryStoreCode === 'string' && c.primaryStoreCode)
  if (typeof direct === 'string') {
    const t = direct.trim()
    if (t) return t
  }
  const nested = c.primary_store as { code?: string } | undefined
  if (nested && typeof nested.code === 'string' && nested.code.trim()) {
    return nested.code.trim()
  }
  const lists = [c.cast_stores, c.castStores, c.stores]
  for (const raw of lists) {
    if (!Array.isArray(raw)) continue
    const primary = raw.find(
      (row: any) => row?.is_primary === true || row?.is_primary === 1 || row?.isPrimary === true,
    )
    if (!primary) continue
    const code =
      (typeof primary.store_code === 'string' && primary.store_code) ||
      (typeof primary.storeCode === 'string' && primary.storeCode) ||
      (primary.store && typeof primary.store.code === 'string' && primary.store.code)
    if (typeof code === 'string') {
      const t = code.trim()
      if (t) return t
    }
  }
  return undefined
}

function normalizeCastRows(casts: any[], storeId: number): any[] {
  casts = casts.map((c: any) => {
    const canonicalId = c.cast_id != null ? String(c.cast_id) : String(c.id)
    const crmStatus = typeof c.status === 'string' ? c.status : ''
    const rawCatch =
      typeof c.catch_copy === 'string'
        ? c.catch_copy
        : typeof c.catchCopy === 'string'
          ? c.catchCopy
          : typeof c.profile_catch_copy === 'string'
            ? c.profile_catch_copy
            : null
    const catchCopy =
      rawCatch && rawCatch.trim() && rawCatch.trim() !== '新人アイドル' ? rawCatch.trim() : undefined
    const hitoduma_reserve_store_code = hitodumaReserveStoreCodeFromCastRow(c)
    return {
      ...c,
      id: canonicalId,
      brand_id: String(storeId),
      is_active: crmStatus !== '退店',
      catch_copy: catchCopy,
      images: [c.idol_image_path || c.image].filter(Boolean),
      ...(hitoduma_reserve_store_code ? { hitoduma_reserve_store_code } : {}),
    }
  })

  const score = (c: any): number => {
    const images = Array.isArray(c.images) ? c.images : []
    const hasImage = images.some(Boolean)
    const isActive = c.is_active === true
    return (hasImage ? 1000 : 0) + (isActive ? 100 : 0)
  }
  const timeValue = (c: any): number => {
    const t = c.updated_at || c.created_at || c.update_time || c.create_time
    if (typeof t !== 'string') return 0
    const ms = Date.parse(t)
    return Number.isFinite(ms) ? ms : 0
  }

  const deduped = new Map<string, any>()
  let duplicateGroups = 0
  for (const c of casts) {
    const id = String(c.id)
    const prev = deduped.get(id)
    if (!prev) {
      deduped.set(id, c)
      continue
    }
    duplicateGroups++
    const aScore = score(prev)
    const bScore = score(c)
    if (bScore !== aScore) {
      if (bScore > aScore) deduped.set(id, c)
      continue
    }
    const aTime = timeValue(prev)
    const bTime = timeValue(c)
    if (bTime !== aTime) {
      if (bTime > aTime) deduped.set(id, c)
      continue
    }
  }
  if (duplicateGroups > 0) {
    console.warn(`[hitoduma-client] deduped duplicate cast records: ${duplicateGroups}`)
  }
  return Array.from(deduped.values())
}

function filterCasts(casts: any[], opts?: HitodumaCastFetchOpts): Girl[] {
  const beforeFilter = casts.length
  const exclude = opts?.excludeStatuses?.length ? opts.excludeStatuses : ['退店']
  if (exclude.length > 0) {
    const excludeSet = new Set(exclude)
    casts = casts.filter((c: any) => !excludeSet.has(String(c.status || '')))
  }
  if (!opts?.includeInactive) {
    casts = casts.filter((c: any) => c.is_active === true)
  }
  if (opts?.status) {
    casts = casts.filter((c: any) => c.status === opts.status)
  }
  if (casts.length === 0 && beforeFilter > 0) {
    console.warn(`[hitoduma-client] filtered to 0 unexpectedly (before=${beforeFilter}).`)
  }
  if (opts?.limit) {
    casts = casts.slice(0, opts.limit)
  }
  return casts as Girl[]
}

/** Server-only: CRM `stores.code` → casts list */
export async function getHitodumaCasts(storeCode: string, opts?: HitodumaCastFetchOpts): Promise<Girl[]> {
  try {
    const storeId = resolveHitodumaStoreId(storeCode)
    const res = await fetch(`${API_BASE_URL}/idol/casts?store_id=${storeId}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch casts')
    const data = await res.json()
    let casts = data.casts || data.data || []
    casts = normalizeCastRows(casts, storeId)
    return filterCasts(casts, opts)
  } catch (e) {
    console.error('[getHitodumaCasts]', e)
    return []
  }
}

/** Server-only: one business day slice mapped to Schedule[] */
export async function getHitodumaScheduleByDate(storeCode: string, date: string): Promise<Schedule[]> {
  try {
    const storeId = resolveHitodumaStoreId(storeCode)
    const res = await fetch(`${API_BASE_URL}/idol/schedules?store_id=${storeId}&date=${date}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch schedules')
    const data = await res.json()
    const dayData = (data.schedules || []).find((s: any) => s.date === date)
    if (!dayData) return []
    return dayData.casts.map((c: any) => ({
      id: `${date}-${c.id}`,
      girl_id: String(c.cast_id),
      brand_id: String(storeId),
      date,
      start_time: c.start_time,
      end_time: c.end_time,
      status: c.status,
      girl: {
        id: String(c.cast_id),
        name: c.name,
        images: [c.idol_image_path || c.image].filter(Boolean),
        brand_id: String(storeId),
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    }))
  } catch (err) {
    console.error('[getHitodumaScheduleByDate]', err)
    return []
  }
}

/** Server-only: week rows for one cast (matches legacy getWeekScheduleByGirl shape). */
export async function getHitodumaWeekScheduleForGirl(girlId: string, storeCode: string): Promise<Schedule[]> {
  try {
    const storeId = resolveHitodumaStoreId(storeCode)
    const res = await fetch(`${API_BASE_URL}/idol/schedules?store_id=${storeId}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch schedules')
    const data = await res.json()
    const schedules: Schedule[] = []
    for (const day of data.schedules || []) {
      const castSchedule = (day.casts || []).find((c: any) => String(c.cast_id) === String(girlId))
      if (castSchedule && castSchedule.start_time) {
        schedules.push({
          id: `${day.date}-${castSchedule.id}`,
          girl_id: String(castSchedule.cast_id),
          brand_id: String(storeId),
          date: day.date,
          start_time: castSchedule.start_time,
          end_time: castSchedule.end_time,
          status: castSchedule.status,
        })
      }
    }
    return schedules
  } catch (err) {
    console.error('[getHitodumaWeekScheduleForGirl]', err)
    return []
  }
}
