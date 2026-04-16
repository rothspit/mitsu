import { getBrand } from './get-brand'

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
const DEFAULT_STORE_ID = 1 // H-Mitsu store ID (fallback)

// ============================================
// Girls
// ============================================

export async function getGirlsByBrand(opts?: {
  limit?: number
  status?: string
  forceSlug?: string
  includeInactive?: boolean
  storeId?: number | string
  /**
   * 返却前に除外したいCRM status（例: ['退店']）
   * `status` オプション（=指定statusのみ抽出）よりも先に適用されます。
   */
  excludeStatuses?: string[]
}): Promise<Girl[]> {
  try {
    const storeId = opts?.storeId != null ? Number(opts.storeId) : DEFAULT_STORE_ID
    const res = await fetch(`${API_BASE_URL}/idol/casts?store_id=${storeId}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    })
    if (!res.ok) throw new Error('Failed to fetch casts')
    
    const data = await res.json()
    let casts = data.casts || data.data || []
    
    // Map CRM API structure to the expected `Girl` interface
    casts = casts.map((c: any) => {
      // CRM側は `id` と `cast_id` が混在して返ってくることがあり、
      // 同一人物が別レコード扱い（別 `id`）で重複するケースがある。
      // 画面側で安定した key / URL を作るため、`cast_id` を正規IDとして扱う。
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
      return {
        ...c,
        id: canonicalId,
        brand_id: String(storeId),
        // CRM連動: 退店は非表示（inactive）。
        // 「お休み中」は在籍扱いで表示したい運用が多いため active のままにする。
        is_active: crmStatus !== '退店',
        // CRM側の未入力デフォルト（新人アイドル 等）は表示しない
        catch_copy: catchCopy,
        images: [c.idol_image_path || c.image].filter(Boolean),
      }
    })

    // Deduplicate by canonical id (cast_id).
    // Prefer: has image > active > latest updated_at/created_at > stable fallback.
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
      // Keep existing as stable default.
    }
    if (duplicateGroups > 0) {
      console.warn(`[getGirlsByBrand] deduped duplicate cast records: ${duplicateGroups}`)
    }
    casts = Array.from(deduped.values())

    // Filter by CRM status rules
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

    // Safety net: if filtering unexpectedly removes everything, fall back to unfiltered (deduped) list.
    if (casts.length === 0 && beforeFilter > 0) {
      console.warn(
        `[getGirlsByBrand] filtered to 0 unexpectedly (before=${beforeFilter}). Falling back to unfiltered deduped list.`
      )
      casts = Array.from(deduped.values())
    }

    if (opts?.limit) {
      casts = casts.slice(0, opts.limit)
    }

    return casts
  } catch (err) {
    console.error('[getGirlsByBrand]', err)
    return []
  }
}

export async function getGirlsCount(forceSlug?: string): Promise<number> {
  const girls = await getGirlsByBrand({ forceSlug })
  return girls.length
}

export async function getGirlById(id: string, forceSlug?: string): Promise<Girl | null> {
  const girls = await getGirlsByBrand({ forceSlug })
  const girl = girls.find(g => String(g.id) === String(id))
  
  if (!girl) return null
  
  return girl
}

// ============================================
// Schedules
// ============================================

export async function getTodaySchedule(forceSlug?: string, storeId?: number | string): Promise<Schedule[]> {
  // JST (UTC+9) で朝8時基準の営業日を取得
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  if (jstNow.getUTCHours() < 8) {
    jstNow.setUTCDate(jstNow.getUTCDate() - 1)
  }
  const today = jstNow.toISOString().slice(0, 10) // YYYY-MM-DD

  return getScheduleByDate(today, { forceSlug, storeId })
}

export async function getScheduleByDate(
  date: string,
  opts?: { forceSlug?: string; storeId?: number | string }
): Promise<Schedule[]> {
  try {
    const storeId = opts?.storeId != null ? Number(opts.storeId) : DEFAULT_STORE_ID
    const res = await fetch(`${API_BASE_URL}/idol/schedules?store_id=${storeId}&date=${date}`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) throw new Error('Failed to fetch schedules')
    
    const data = await res.json()
    const dayData = (data.schedules || []).find((s: any) => s.date === date)
    if (!dayData) return []
    
    return dayData.casts.map((c: any) => ({
      id: `${date}-${c.id}`,
      girl_id: String(c.cast_id),
      brand_id: String(storeId),
      date: date,
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
        updated_at: ''
      }
    }))
  } catch (err) {
    console.error('[getScheduleByDate]', err)
    return []
  }
}

export async function getWeekScheduleByGirl(
  girlId: string,
  weekStart: string,
  forceSlug?: string,
  storeId?: number | string
): Promise<Schedule[]> {
  try {
    const sid = storeId != null ? Number(storeId) : DEFAULT_STORE_ID
    const res = await fetch(`${API_BASE_URL}/idol/schedules?store_id=${sid}`, {
      next: { revalidate: 60 }
    })
    if (!res.ok) throw new Error('Failed to fetch schedules')
    
    const data = await res.json()
    const schedules: Schedule[] = []
    
    for (const day of (data.schedules || [])) {
      const castSchedule = day.casts.find((c: any) => String(c.cast_id) === String(girlId))
      if (castSchedule && castSchedule.start_time) {
        schedules.push({
          id: `${day.date}-${castSchedule.id}`,
          girl_id: String(castSchedule.cast_id),
          brand_id: String(sid),
          date: day.date,
          start_time: castSchedule.start_time,
          end_time: castSchedule.end_time,
          status: castSchedule.status
        })
      }
    }
    return schedules
  } catch (err) {
    console.error('[getWeekScheduleByGirl]', err)
    return []
  }
}

// ============================================
// Diaries
// ============================================

export async function getDiariesByBrand(opts?: {
  limit?: number
  category?: string
  forceSlug?: string
  storeId?: number | string
}): Promise<Diary[]> {
  try {
    const storeId = opts?.storeId != null ? Number(opts.storeId) : DEFAULT_STORE_ID
    const res = await fetch(`${API_BASE_URL}/idol/diaries?store_id=${storeId}`, {
      next: { revalidate: 60 }
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
        updated_at: ''
      }
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
  return diaries.find(d => String(d.slug) === String(slug)) || null
}

// ============================================
// Photo Diaries (写メ日記)
// ============================================

export async function getPhotoDiaries(opts?: {
  limit?: number
  forceSlug?: string
}): Promise<PhotoDiary[]> {
  // Mapping standard diaries to PhotoDiary since CRM API handles them similarly
  const diaries = await getDiariesByBrand(opts)
  
  return diaries.map(d => ({
    id: d.id,
    girl_id: d.girl_id || '',
    brand_id: d.brand_id,
    image_url: d.thumbnail_url || '',
    comment: d.content || null,
    published_at: d.published_at || d.created_at,
    created_at: d.created_at,
    girl: d.girl ? { id: d.girl.id, name: d.girl.name } : null
  }))
}
