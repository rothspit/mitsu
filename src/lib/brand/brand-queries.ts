import { resolveHitodumaStoreId } from '@/lib/crm/resolve-hitoduma-store'
import {
  getHitodumaCasts,
  getHitodumaScheduleByDate,
  getHitodumaWeekScheduleForGirl,
} from '@/lib/hitoduma-client'
import { HITODUMA_DEFAULT_STORE_CODE } from '@/lib/hitoduma/hitoduma-store'

// ============================================
// 型定義
// ============================================

export interface Girl {
  id: string
  brand_id: string
  name: string
  age?: number
  status?: string
  images?: string[] | null
  catch_copy?: string
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
  /** CRM が返す主所属なら予約の `store` に使う（人妻 `stores.code`）。 */
  hitoduma_reserve_store_code?: string
  [key: string]: unknown
}

export interface Schedule {
  id: string
  girl_id: string
  brand_id: string
  date: string
  start_time: string
  end_time: string
  status?: string
  comment?: string
  schedule_text?: string
  area_id?: string
  girl?: Girl
  area?: { id: string; name: string; slug: string } | null
  [key: string]: unknown
}

export interface PhotoDiary {
  id: string
  girl_id: string
  brand_id: string
  image_url: string
  comment: string | null
  published_at: string
  created_at: string
  girl?: { id: string; name: string } | null
}

export interface Diary {
  id: string
  brand_id: string
  girl_id?: string
  slug: string
  title: string
  content: string
  category?: string
  thumbnail_url?: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  girl?: Girl
  [key: string]: unknown
}

const API_BASE_URL = 'https://crm.h-mitsu.com/api'

// ============================================
// Girls
// ============================================

export async function getGirlsByBrand(opts?: {
  limit?: number
  status?: string
  forceSlug?: string
  includeInactive?: boolean
  /** CRM `stores.code` for 人妻の蜜（例: kasai, hitoduma_nishi）。 */
  hitodumaStore?: string
  /**
   * 返却前に除外したいCRM status（例: ['退店']）
   * `status` オプション（=指定statusのみ抽出）よりも先に適用されます。
   */
  excludeStatuses?: string[]
}): Promise<Girl[]> {
  const code = opts?.hitodumaStore ?? HITODUMA_DEFAULT_STORE_CODE
  return getHitodumaCasts(code, {
    limit: opts?.limit,
    status: opts?.status,
    includeInactive: opts?.includeInactive,
    excludeStatuses: opts?.excludeStatuses,
  })
}

export async function getGirlsCount(forceSlug?: string): Promise<number> {
  const girls = await getGirlsByBrand({ forceSlug })
  return girls.length
}

export async function getGirlById(id: string, forceSlug?: string): Promise<Girl | null> {
  const girls = await getGirlsByBrand({ forceSlug })
  const girl = girls.find((g) => String(g.id) === String(id))

  if (!girl) return null

  return girl
}

// ============================================
// Schedules
// ============================================

export async function getTodaySchedule(
  forceSlug?: string,
  opts?: { hitodumaStore?: string }
): Promise<Schedule[]> {
  void forceSlug
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  if (jstNow.getUTCHours() < 8) {
    jstNow.setUTCDate(jstNow.getUTCDate() - 1)
  }
  const today = jstNow.toISOString().slice(0, 10)

  return getScheduleByDate(today, { hitodumaStore: opts?.hitodumaStore })
}

export async function getScheduleByDate(
  date: string,
  opts?: { forceSlug?: string; hitodumaStore?: string }
): Promise<Schedule[]> {
  void opts?.forceSlug
  const code = opts?.hitodumaStore ?? HITODUMA_DEFAULT_STORE_CODE
  return getHitodumaScheduleByDate(code, date)
}

export async function getWeekScheduleByGirl(
  girlId: string,
  weekStart: string,
  forceSlug?: string,
  opts?: { hitodumaStore?: string }
): Promise<Schedule[]> {
  void weekStart
  void forceSlug
  const code = opts?.hitodumaStore ?? HITODUMA_DEFAULT_STORE_CODE
  return getHitodumaWeekScheduleForGirl(girlId, code)
}

// ============================================
// Diaries
// ============================================

export async function getDiariesByBrand(opts?: {
  limit?: number
  category?: string
  forceSlug?: string
  hitodumaStore?: string
}): Promise<Diary[]> {
  try {
    const storeId = resolveHitodumaStoreId(opts?.hitodumaStore ?? HITODUMA_DEFAULT_STORE_CODE)
    const res = await fetch(`${API_BASE_URL}/idol/diaries?store_id=${storeId}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch diaries')

    const data = await res.json()
    let diaries: Diary[] = (data.diaries || []).map((d: any) => ({
      id: String(d.id),
      brand_id: String(storeId),
      girl_id: String(d.cast_id),
      slug: String(d.id),
      title: d.title,
      content: d.content,
      thumbnail_url: d.images ? d.images[0] : null,
      is_published: true,
      published_at: d.created_at,
      created_at: d.created_at,
      updated_at: d.created_at,
      girl: {
        id: String(d.cast_id),
        name: d.cast_name,
        images: d.cast_image ? [d.cast_image] : [],
        brand_id: String(storeId),
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    }))

    if (opts?.limit) {
      diaries = diaries.slice(0, opts.limit)
    }

    return diaries
  } catch (err) {
    console.error('[getDiariesByBrand]', err)
    return []
  }
}

export async function getDiaryBySlug(slug: string, forceSlug?: string): Promise<Diary | null> {
  const diaries = await getDiariesByBrand({ forceSlug })
  return diaries.find((d) => String(d.slug) === String(slug)) || null
}

// ============================================
// Photo Diaries (写メ日記)
// ============================================

export async function getPhotoDiaries(opts?: {
  limit?: number
  forceSlug?: string
}): Promise<PhotoDiary[]> {
  const diaries = await getDiariesByBrand(opts)

  return diaries.map((d) => ({
    id: d.id,
    girl_id: d.girl_id || '',
    brand_id: d.brand_id,
    image_url: d.thumbnail_url || '',
    comment: d.content || null,
    published_at: d.published_at || d.created_at,
    created_at: d.created_at,
    girl: d.girl ? { id: d.girl.id, name: d.girl.name } : null,
  }))
}
