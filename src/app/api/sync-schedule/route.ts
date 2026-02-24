import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'
const SYNC_SECRET = 'mitsu-sync-2026'

export async function POST(req: NextRequest) {
  // 1. 認証
  const secret = req.headers.get('x-sync-secret')
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const body = await req.json()
    const { cast_name, schedule_date, start_time, end_time, status, action, area_id } = body

    if (!cast_name || !schedule_date || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: cast_name, schedule_date, action' },
        { status: 400 }
      )
    }

    // 2. cast_name で girls テーブルから girl_id を検索
    const { data: girl, error: girlError } = await supabase
      .from('girls')
      .select('id, name')
      .eq('brand_id', HITOMITSU_BRAND_ID)
      .eq('name', cast_name)
      .single()

    if (girlError || !girl) {
      return NextResponse.json(
        { error: `Girl not found: ${cast_name}` },
        { status: 404 }
      )
    }

    // 3. action に応じて処理
    if (action === 'delete') {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('girl_id', girl.id)
        .eq('date', schedule_date)
        .is('area_id', area_id || null)

      if (deleteError) {
        console.error('sync-schedule delete error:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, girl_id: girl.id, action: 'delete' })
    }

    // action === 'upsert' (default)
    const scheduleData: Record<string, unknown> = {
      girl_id: girl.id,
      date: schedule_date,
      area_id: area_id || null,
      brand_id: HITOMITSU_BRAND_ID,
      status: status || 'working',
      start_time: start_time || null,
      end_time: end_time || null,
    }

    const { error: upsertError } = await supabase
      .from('schedules')
      .upsert(scheduleData, { onConflict: 'girl_id,date,area_id' })

    if (upsertError) {
      console.error('sync-schedule upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, girl_id: girl.id, action: 'upsert' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('sync-schedule error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
