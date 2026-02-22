import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

// ============================================
// Constants
// ============================================

const MRVENREY_API = 'https://webapi2.mrvenrey.jp'
const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

// ============================================
// Types
// ============================================

interface MrVenreySchedule {
  GirlId: number
  StartTime: string | null
  EndTime: string | null
  ScheduleStatus: number
  ScheduleText: string
  ScheduleDate: string
}

// ============================================
// Helpers
// ============================================

async function getMrVenreyToken(): Promise<string> {
  const id = process.env.MRVENREY_ID
  const pass = process.env.MRVENREY_PASS
  if (!id || !pass) {
    throw new Error('MRVENREY_ID と MRVENREY_PASS が必要です。')
  }
  const res = await fetch(`${MRVENREY_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(id)}&password=${encodeURIComponent(pass)}`,
  })
  if (!res.ok) {
    throw new Error(`MrVenrey login failed (${res.status})`)
  }
  const data = await res.json()
  return data.access_token
}

function getJwt(): Promise<string> {
  const jwt = process.env.MRVENREY_JWT
  if (jwt) return Promise.resolve(jwt)
  return getMrVenreyToken()
}

function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

function getWeekDatesJST(): string[] {
  const dates: string[] = []
  const nowMs = Date.now() + 9 * 60 * 60 * 1000
  for (let i = 0; i < 7; i++) {
    const d = new Date(nowMs + i * 24 * 60 * 60 * 1000)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function parseDate(scheduleDate: string): string {
  return scheduleDate.slice(0, 10)
}

function parseTime(isoTime: string | null): string | null {
  if (!isoTime) return null
  const match = isoTime.match(/T(\d{2}:\d{2}:\d{2})/)
  return match ? match[1] : null
}

// ============================================
// GET /api/cron/sync-mrvenrey
// ============================================

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  try {
    const jwt = await getJwt()
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const today = getTodayJST()
    const weekDates = getWeekDatesJST()

    // 1. MrVenrey 週間スケジュールを取得
    const res = await fetch(`${MRVENREY_API}/api/schedules/week`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `MrVenrey API error (${res.status})`, detail: text }, { status: 502 })
    }
    const data = await res.json()
    const scheduleList: MrVenreySchedule[] = data.ScheduleList || []

    // 2. girls マップ作成
    const { data: girls, error: girlsErr } = await supabase
      .from('girls')
      .select('id, name, mrvenrey_id')
      .eq('brand_id', HITOMITSU_BRAND_ID)
      .not('mrvenrey_id', 'is', null)

    if (girlsErr) {
      return NextResponse.json({ error: 'Supabase girls fetch failed', detail: girlsErr.message }, { status: 500 })
    }

    const mrIdToGirl = new Map<string, { id: string; name: string }>()
    for (const g of girls) {
      if (g.mrvenrey_id != null) mrIdToGirl.set(String(g.mrvenrey_id), { id: g.id, name: g.name })
    }

    // 3. 日付ごとにグループ化
    const byDate = new Map<string, MrVenreySchedule[]>()
    for (const mr of scheduleList) {
      const date = parseDate(mr.ScheduleDate)
      if (!byDate.has(date)) byDate.set(date, [])
      byDate.get(date)!.push(mr)
    }

    const allDates = [...new Set([...byDate.keys(), ...weekDates])].sort()

    // 4. upsert
    let upserted = 0
    let skipped = 0
    let errors = 0

    for (const [date, schedules] of byDate) {
      for (const mr of schedules) {
        const girl = mrIdToGirl.get(String(mr.GirlId))
        if (!girl) {
          skipped++
          continue
        }

        try {
          const { error: upsertErr } = await supabase
            .from('schedules')
            .upsert(
              {
                girl_id: girl.id,
                date,
                area_id: null,
                brand_id: HITOMITSU_BRAND_ID,
                status: 'working',
                start_time: parseTime(mr.StartTime),
                end_time: parseTime(mr.EndTime),
                schedule_status: mr.ScheduleStatus,
                comment: mr.ScheduleText || null,
              },
              { onConflict: 'girl_id,date,area_id' },
            )

          if (upsertErr) throw upsertErr
          upserted++
        } catch {
          errors++
        }
      }
    }

    // 5. 今日以降で MrVenrey にないスケジュール（area_id=null）を削除
    let removed = 0
    for (const date of allDates) {
      if (date < today) continue

      const syncedGirlIdsForDate = new Set(
        (byDate.get(date) || [])
          .map((mr) => mrIdToGirl.get(String(mr.GirlId))?.id)
          .filter(Boolean) as string[],
      )

      const { data: existingSchedules, error: fetchSchErr } = await supabase
        .from('schedules')
        .select('id, girl_id')
        .eq('brand_id', HITOMITSU_BRAND_ID)
        .eq('date', date)
        .is('area_id', null)

      if (!fetchSchErr && existingSchedules) {
        const toRemove = existingSchedules.filter((s) => !syncedGirlIdsForDate.has(s.girl_id))
        if (toRemove.length > 0) {
          const { error: delErr } = await supabase
            .from('schedules')
            .delete()
            .in('id', toRemove.map((s) => s.id))

          if (!delErr) removed += toRemove.length
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total: scheduleList.length,
      days: byDate.size,
      upserted,
      skipped,
      removed,
      errors,
    })
  } catch (err: any) {
    console.error('Cron sync-mrvenrey error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
