import { resolveIdolStoreId } from '@/lib/crm/resolve-idol-store'

const API_BASE_URL = 'https://crm.h-mitsu.com/api'

/** Server-only: Idol brand casts by CRM `stores.code` */
export async function getIdolCasts(storeCode: string): Promise<unknown[]> {
  try {
    const storeId = resolveIdolStoreId(storeCode)
    const res = await fetch(`${API_BASE_URL}/idol/casts?store_id=${storeId}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch idol casts')
    const data = await res.json()
    return data.casts || data.data || []
  } catch (e) {
    console.error('[getIdolCasts]', e)
    return []
  }
}

/** Server-only: Idol schedules (raw CRM JSON shape) */
export async function getIdolSchedulesJson(storeCode: string, date?: string): Promise<unknown> {
  const storeId = resolveIdolStoreId(storeCode)
  const url = new URL(`${API_BASE_URL}/idol/schedules`)
  url.searchParams.set('store_id', String(storeId))
  if (date) url.searchParams.set('date', date)
  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error('Failed to fetch idol schedules')
  return res.json()
}
