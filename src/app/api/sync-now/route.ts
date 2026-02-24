import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const MRVENREY_API = 'https://webapi2.mrvenrey.jp'
const MRVENREY_BLOB = 'https://mrvenreyweb.blob.core.windows.net'
const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'
const SYNC_SECRET = 'mitsu-sync-2026'

interface MrVenreySchedule {
  GirlId: number
  StartTime: string | null
  EndTime: string | null
  ScheduleStatus: number
  ScheduleText: string
  ScheduleDate: string
}

interface MrVenreyGirl {
  GirlId: number
  GirlName: string
  Age: number
  Tall: number
  Bust: number
  Cup: string
  West: number
  Hip: number
  IsNewface: boolean
  Image1?: string
  Image2?: string
  Image3?: string
  Image4?: string
  Image5?: string
  Image6?: string
  Image7?: string
  Image8?: string
  Image9?: string
  Image10?: string
  Image11?: string
  Image12?: string
  Image13?: string
  Image14?: string
  Image15?: string
  [key: string]: any
}

// ============================================
// Helpers
// ============================================

async function getMrVenreyToken(): Promise<string> {
  const id = process.env.MRVENREY_ID
  const pass = process.env.MRVENREY_PASS
  if (!id || !pass) throw new Error('MRVENREY credentials missing')
  const res = await fetch(`${MRVENREY_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(id)}&password=${encodeURIComponent(pass)}`,
  })
  if (!res.ok) throw new Error(`MrVenrey login failed (${res.status})`)
  const data = await res.json()
  return data.access_token
}

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveImageUrl(val: string | null | undefined): string | null {
  if (!val) return null
  if (GUID_RE.test(val)) return `${MRVENREY_BLOB}/girl-image/${val}`
  if (val.startsWith('http')) return val
  return null
}

function extractImages(girl: MrVenreyGirl): string[] {
  const urls: string[] = []
  for (let i = 1; i <= 15; i++) {
    const url = resolveImageUrl(girl[`Image${i}`])
    if (url) urls.push(url)
  }
  return urls
}

function getTodayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function getWeekDatesJST(): string[] {
  const dates: string[] = []
  const nowMs = Date.now() + 9 * 60 * 60 * 1000
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(nowMs + i * 86400000).toISOString().slice(0, 10))
  }
  return dates
}

function parseDate(s: string): string { return s.slice(0, 10) }
function parseTime(s: string | null): string | null {
  if (!s) return null
  const m = s.match(/T(\d{2}:\d{2}:\d{2})/)
  return m ? m[1] : null
}

// ============================================
// POST /api/sync-now
// ============================================

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-sync-secret')
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const result = { girls: { updated: 0, skipped: 0 }, schedules: { upserted: 0, skipped: 0, removed: 0, errors: 0 } }

  try {
    const jwt = await getMrVenreyToken()
    const today = getTodayJST()

    // ============================
    // Girls sync
    // ============================
    const girlsRes = await fetch(`${MRVENREY_API}/api/girls/list`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!girlsRes.ok) throw new Error(`Girls API error (${girlsRes.status})`)
    const girlsData = await girlsRes.json()
    const mrGirls: MrVenreyGirl[] = girlsData.GirlList || girlsData || []

    const { data: dbGirls } = await supabase
      .from('girls')
      .select('id, name, mrvenrey_id')
      .eq('brand_id', HITOMITSU_BRAND_ID)

    const byMrId = new Map<string, any>()
    const byName = new Map<string, any>()
    for (const g of dbGirls || []) {
      if (g.mrvenrey_id) byMrId.set(String(g.mrvenrey_id), g)
      byName.set(g.name, g)
    }

    const matchedMrIds = new Set<string>()
    for (const mr of mrGirls) {
      const match = byMrId.get(String(mr.GirlId)) || byName.get(mr.GirlName)
      if (!match) { result.girls.skipped++; continue }

      matchedMrIds.add(String(mr.GirlId))
      const images = extractImages(mr)
      const { error } = await supabase
        .from('girls')
        .update({
          mrvenrey_id: String(mr.GirlId),
          age: mr.Age || null,
          height: mr.Tall || null,
          bust: mr.Bust || null,
          cup: mr.Cup || null,
          waist: mr.West || null,
          hip: mr.Hip || null,
          images,
          is_new: mr.IsNewface ?? false,
          is_active: true,
        })
        .eq('id', match.id)

      if (!error) result.girls.updated++
    }

    // Deactivate girls not in MrVenrey
    const allMrIds = new Set(mrGirls.map((g) => String(g.GirlId)))
    for (const g of dbGirls || []) {
      if (g.mrvenrey_id && !allMrIds.has(String(g.mrvenrey_id))) {
        await supabase.from('girls').update({ is_active: false }).eq('id', g.id)
      }
    }

    // ============================
    // Schedule sync
    // ============================
    const schRes = await fetch(`${MRVENREY_API}/api/schedules/week`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!schRes.ok) throw new Error(`Schedule API error (${schRes.status})`)
    const schData = await schRes.json()
    const scheduleList: MrVenreySchedule[] = schData.ScheduleList || []

    // Refresh girls map (mrvenrey_id may have been set above)
    const { data: freshGirls } = await supabase
      .from('girls')
      .select('id, mrvenrey_id')
      .eq('brand_id', HITOMITSU_BRAND_ID)
      .not('mrvenrey_id', 'is', null)

    const mrIdToGirlId = new Map<string, string>()
    for (const g of freshGirls || []) {
      mrIdToGirlId.set(String(g.mrvenrey_id), g.id)
    }

    const byDate = new Map<string, MrVenreySchedule[]>()
    for (const mr of scheduleList) {
      const date = parseDate(mr.ScheduleDate)
      if (!byDate.has(date)) byDate.set(date, [])
      byDate.get(date)!.push(mr)
    }

    const weekDates = getWeekDatesJST()
    const allDates = [...new Set([...byDate.keys(), ...weekDates])].sort()

    for (const [date, schedules] of byDate) {
      for (const mr of schedules) {
        const girlId = mrIdToGirlId.get(String(mr.GirlId))
        if (!girlId) { result.schedules.skipped++; continue }
        try {
          const { error } = await supabase
            .from('schedules')
            .upsert({
              girl_id: girlId,
              date,
              area_id: null,
              brand_id: HITOMITSU_BRAND_ID,
              status: 'working',
              start_time: parseTime(mr.StartTime),
              end_time: parseTime(mr.EndTime),
              schedule_status: mr.ScheduleStatus,
              comment: mr.ScheduleText || null,
            }, { onConflict: 'girl_id,date,area_id' })
          if (error) throw error
          result.schedules.upserted++
        } catch { result.schedules.errors++ }
      }
    }

    // Remove orphaned schedules
    for (const date of allDates) {
      if (date < today) continue
      const syncedIds = new Set(
        (byDate.get(date) || []).map((mr) => mrIdToGirlId.get(String(mr.GirlId))).filter(Boolean) as string[]
      )
      const { data: existing } = await supabase
        .from('schedules')
        .select('id, girl_id')
        .eq('brand_id', HITOMITSU_BRAND_ID)
        .eq('date', date)
        .is('area_id', null)

      if (existing) {
        const toRemove = existing.filter((s) => !syncedIds.has(s.girl_id))
        if (toRemove.length > 0) {
          const { error } = await supabase.from('schedules').delete().in('id', toRemove.map((s) => s.id))
          if (!error) result.schedules.removed += toRemove.length
        }
      }
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('sync-now error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
