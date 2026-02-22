import { supabase } from '@/lib/supabase'
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

// ============================================
// Girls
// ============================================

export async function getGirlsByBrand(opts?: {
  limit?: number
  status?: string
  forceSlug?: string
}): Promise<Girl[]> {
  const brand = await getBrand(opts?.forceSlug)
  let query = supabase
    .from('girls')
    .select('*')
    .eq('brand_id', brand.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (opts?.status) {
    query = query.eq('status', opts.status)
  }
  if (opts?.limit) {
    query = query.limit(opts.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getGirlsByBrand]', error.message)
    return []
  }
  return (data ?? []) as Girl[]
}

export async function getGirlsCount(forceSlug?: string): Promise<number> {
  const brand = await getBrand(forceSlug)
  const { count, error } = await supabase
    .from('girls')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)
    .eq('is_active', true)

  if (error) {
    console.error('[getGirlsCount]', error.message)
    return 0
  }
  return count ?? 0
}

export async function getGirlById(id: string, forceSlug?: string): Promise<Girl | null> {
  const brand = await getBrand(forceSlug)
  const { data, error } = await supabase
    .from('girls')
    .select('*')
    .eq('id', id)
    .eq('brand_id', brand.id)
    .single()

  if (error) {
    console.error('[getGirlById]', error.message)
    return null
  }
  return (data ?? null) as Girl | null
}

// ============================================
// Schedules
// ============================================

export async function getTodaySchedule(forceSlug?: string): Promise<Schedule[]> {
  const brand = await getBrand(forceSlug)
  // JST (UTC+9) で今日の日付を取得
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = jstNow.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('schedules')
    .select('*, girl:girls(*), area:areas(id, name, slug)')
    .eq('brand_id', brand.id)
    .eq('date', today)
    .eq('status', 'working')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[getTodaySchedule]', error.message)
    return []
  }
  return (data ?? []) as Schedule[]
}

export async function getScheduleByDate(date: string, forceSlug?: string): Promise<Schedule[]> {
  const brand = await getBrand(forceSlug)
  const { data, error } = await supabase
    .from('schedules')
    .select('*, girl:girls(*), area:areas(id, name, slug)')
    .eq('brand_id', brand.id)
    .eq('date', date)
    .eq('status', 'working')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[getScheduleByDate]', error.message)
    return []
  }
  return (data ?? []) as Schedule[]
}

export async function getWeekScheduleByGirl(girlId: string, weekStart: string, forceSlug?: string): Promise<Schedule[]> {
  const brand = await getBrand(forceSlug)
  // weekStartから6日後
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const weekEnd = end.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('schedules')
    .select('*, area:areas(id, name, slug)')
    .eq('brand_id', brand.id)
    .eq('girl_id', girlId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true })

  if (error) {
    console.error('[getWeekScheduleByGirl]', error.message)
    return []
  }
  return (data ?? []) as Schedule[]
}

// ============================================
// Diaries
// ============================================

export async function getDiariesByBrand(opts?: {
  limit?: number
  category?: string
  forceSlug?: string
}): Promise<Diary[]> {
  const brand = await getBrand(opts?.forceSlug)
  let query = supabase
    .from('diaries')
    .select('*, girl:girls(id, name, images)')
    .eq('brand_id', brand.id)
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (opts?.category) {
    query = query.eq('category', opts.category)
  }
  if (opts?.limit) {
    query = query.limit(opts.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getDiariesByBrand]', error.message)
    return []
  }
  return (data ?? []) as Diary[]
}

export async function getDiaryBySlug(slug: string, forceSlug?: string): Promise<Diary | null> {
  const brand = await getBrand(forceSlug)
  const { data, error } = await supabase
    .from('diaries')
    .select('*, girl:girls(id, name, images)')
    .eq('slug', slug)
    .eq('brand_id', brand.id)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error('[getDiaryBySlug]', error.message)
    return null
  }
  return (data ?? null) as Diary | null
}

// ============================================
// Photo Diaries (写メ日記)
// ============================================

export async function getPhotoDiaries(opts?: {
  limit?: number
  forceSlug?: string
}): Promise<PhotoDiary[]> {
  const brand = await getBrand(opts?.forceSlug)
  let query = supabase
    .from('photo_diaries')
    .select('*, girl:girls(id, name)')
    .eq('brand_id', brand.id)
    .order('published_at', { ascending: false })

  if (opts?.limit) {
    query = query.limit(opts.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getPhotoDiaries]', error.message)
    return []
  }
  return (data ?? []) as PhotoDiary[]
}
