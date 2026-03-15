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
const STORE_ID = 1 // H-Mitsu store ID

// ============================================
// Girls
// ============================================

export async function getGirlsByBrand(opts?: {
  limit?: number
  status?: string
  forceSlug?: string
}): Promise<Girl[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/idol/casts?store_id=${STORE_ID}`, {
      cache: 'no-store' // Completely disable cache for real-time updates
    })
    if (!res.ok) throw new Error('Failed to fetch casts')
    
    const data = await res.json()
    let casts = data.casts || data.data || []
    
    // Map CRM API structure to the expected `Girl` interface
    casts = casts.map((c: any) => ({
      ...c,
      brand_id: String(STORE_ID),
      is_active: c.status !== '退店' && c.status !== 'お休み中',
      images: [c.idol_image_path || c.image].filter(Boolean)
    }))

    if (opts?.status) {
      casts = casts.filter((c: any) => c.status === opts.status)
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

export async function getTodaySchedule(forceSlug?: string): Promise<Schedule[]> {
  // JST (UTC+9) で朝8時基準の営業日を取得
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  if (jstNow.getUTCHours() < 8) {
    jstNow.setUTCDate(jstNow.getUTCDate() - 1)
  }
  const today = jstNow.toISOString().slice(0, 10) // YYYY-MM-DD

  return getScheduleByDate(today, forceSlug)
}

export async function getScheduleByDate(date: string, forceSlug?: string): Promise<Schedule[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/idol/schedules?store_id=${STORE_ID}&date=${date}`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch schedules')
    
    const data = await res.json()
    const dayData = (data.schedules || []).find((s: any) => s.date === date)
    if (!dayData) return []
    
    return dayData.casts.map((c: any) => ({
      id: `${date}-${c.id}`,
      girl_id: String(c.cast_id),
      brand_id: String(STORE_ID),
      date: date,
      start_time: c.start_time,
      end_time: c.end_time,
      status: c.status,
      girl: {
        id: String(c.cast_id),
        name: c.name,
        images: [c.idol_image_path || c.image].filter(Boolean),
        brand_id: String(STORE_ID),
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

export async function getWeekScheduleByGirl(girlId: string, weekStart: string, forceSlug?: string): Promise<Schedule[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/idol/schedules?store_id=${STORE_ID}`, {
      cache: 'no-store'
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
          brand_id: String(STORE_ID),
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
}): Promise<Diary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/idol/diaries?store_id=${STORE_ID}`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch diaries')
    
    const data = await res.json()
    let diaries: Diary[] = (data.diaries || []).map((d: any) => ({
      id: String(d.id),
      brand_id: String(STORE_ID),
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
        brand_id: String(STORE_ID),
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
