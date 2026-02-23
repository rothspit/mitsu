/**
 * MrVenrey → Supabase 同期スクリプト
 *
 * Usage:
 *   npx tsx scripts/sync-mrvenrey.ts            # キャスト情報を同期
 *   npx tsx scripts/sync-mrvenrey.ts --schedule  # 出勤情報を同期（週間）
 *
 * JWT 取得の優先順位:
 *   1. .env.local の MRVENREY_JWT
 *   2. MRVENREY_ID + MRVENREY_PASS で /token エンドポイントから自動取得
 *
 * Supabase は SUPABASE_SERVICE_ROLE_KEY で RLS バイパス。
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

// ============================================
// Constants
// ============================================

const MRVENREY_API = 'https://webapi2.mrvenrey.jp'
const MRVENREY_BLOB = 'https://mrvenreyweb.blob.core.windows.net'
const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

const NISHIFUNABASHI_AREA_ID = 'ae839c4d-e3df-4cc0-9eb6-d3d2a161d1b9'

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const IMAGE_KEYS = [
  'Image1', 'Image2', 'Image3', 'Image4', 'Image5',
  'Image6', 'Image7', 'Image8', 'Image9', 'Image10',
  'Image11', 'Image12', 'Image13', 'Image14', 'Image15',
] as const

// ============================================
// MrVenrey types
// ============================================

interface MrVenreyGirl {
  GirlId: number
  Name: string
  Age: number | null
  Tall: number | null
  Bust: number | null
  Cup: string | null
  West: number | null
  Hip: number | null
  IsNewface: boolean
  IsDisp: boolean
  Image1?: string | null
  Image2?: string | null
  Image3?: string | null
  Image4?: string | null
  Image5?: string | null
  Image6?: string | null
  Image7?: string | null
  Image8?: string | null
  Image9?: string | null
  Image10?: string | null
  Image11?: string | null
  Image12?: string | null
  Image13?: string | null
  Image14?: string | null
  Image15?: string | null
  [key: string]: unknown
}

// ============================================
// Helpers
// ============================================

async function getMrVenreyToken(): Promise<string> {
  const id = process.env.MRVENREY_ID
  const pass = process.env.MRVENREY_PASS
  if (!id || !pass) {
    throw new Error('MRVENREY_ID と MRVENREY_PASS が .env.local に必要です。')
  }
  console.log('MrVenrey /token でログイン中...')
  const res = await fetch(`${MRVENREY_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(id)}&password=${encodeURIComponent(pass)}`,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MrVenrey login failed (${res.status}): ${text}`)
  }
  const data = await res.json()
  return data.access_token
}

function toImageUrl(value: string): string {
  if (GUID_RE.test(value)) {
    // route.ts と同じ形式: /{MRVENREY_ID}/image/girls/{GUID}/600_800.jpg
    return `${MRVENREY_BLOB}/${process.env.MRVENREY_ID}/image/girls/${value}/600_800.jpg`
  }
  // フルURLの場合 → SAS除去
  return value.split('?')[0]
}

function collectImageUrls(mr: MrVenreyGirl): string[] {
  return IMAGE_KEYS
    .map((k) => mr[k] as string | null | undefined)
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map(toImageUrl)
}

// ============================================
// Shared init
// ============================================

async function getJwt(): Promise<string> {
  const jwt = process.env.MRVENREY_JWT
  if (jwt) return jwt
  return getMrVenreyToken()
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が .env.local に必要です。')
    process.exit(1)
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

function parseDate(scheduleDate: string): string {
  return scheduleDate.slice(0, 10)
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

// ============================================
// Helpers: catch copy
// ============================================

async function fetchCatchCopy(jwt: string, girlId: number): Promise<string | null> {
  try {
    const res = await fetch(`${MRVENREY_API}/api/girls/memos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ GirlId: girlId }),
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text || text.trim().length === 0) return null
    const detail = JSON.parse(text)
    // CatchCopy20 が詳細版、CatchCopy10 が短縮版
    return detail.CatchCopy20 || detail.CatchCopy10 || null
  } catch {
    return null
  }
}

// ============================================
// Main: girls sync
// ============================================

async function syncGirls() {
  const jwt = await getJwt()
  const supabase = getSupabase()

  // 3. MrVenrey API 呼び出し
  console.log('MrVenrey API からキャスト一覧を取得中...')
  const res = await fetch(`${MRVENREY_API}/api/girls/list`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`MrVenrey API エラー (${res.status}): ${text}`)
    process.exit(1)
  }
  const data = await res.json()
  const mrGirls: MrVenreyGirl[] = data.GirlsList || []
  console.log(`MrVenrey: ${mrGirls.length} 件取得`)

  // 4. Supabase から hitomitsu brand の全 girls 取得
  const { data: existingGirls, error: fetchErr } = await supabase
    .from('girls')
    .select('id, name, mrvenrey_id')
    .eq('brand_id', HITOMITSU_BRAND_ID)

  if (fetchErr) {
    console.error('Supabase girls 取得エラー:', fetchErr.message)
    process.exit(1)
  }
  console.log(`Supabase: 既存 ${existingGirls.length} 件`)

  // 5-6. マッチング & upsert
  let matched = 0
  let unmatched = 0
  let catchCopyUpdated = 0
  let errors = 0
  const errorDetails: string[] = []
  const unmatchedNames: string[] = []

  for (const mr of mrGirls) {
    try {
      // 優先1: mrvenrey_id が一致（bigint は string で返るので == で比較）
      let existing = existingGirls.find((g) => g.mrvenrey_id == mr.GirlId)

      // 優先2: name が完全一致（同一 brand_id 内）
      if (!existing) {
        existing = existingGirls.find((g) => g.name === mr.Name)
      }

      if (!existing) {
        unmatched++
        unmatchedNames.push(`${mr.Name} (GirlId: ${mr.GirlId})`)
        continue
      }

      const imageUrls = collectImageUrls(mr)

      // キャッチコピーを POST /api/girls/memos から取得
      const catchCopy = await fetchCatchCopy(jwt, mr.GirlId)

      const updateData: Record<string, unknown> = {
        age: mr.Age ?? null,
        height: mr.Tall ?? null,
        bust: mr.Bust ?? null,
        cup: mr.Cup ?? null,
        waist: mr.West ?? null,
        hip: mr.Hip ?? null,
        images: imageUrls.length > 0 ? imageUrls : null,
        mrvenrey_id: mr.GirlId,
        is_new: mr.IsNewface ?? false,
        is_active: mr.IsDisp ?? false,
      }

      if (catchCopy) {
        updateData.catch_copy = catchCopy
        catchCopyUpdated++
      }

      const { error: updateErr } = await supabase
        .from('girls')
        .update(updateData)
        .eq('id', existing.id)

      if (updateErr) throw updateErr

      matched++
    } catch (err: any) {
      errors++
      errorDetails.push(`${mr.Name || mr.GirlId}: ${err.message}`)
    }
  }

  // 7. MrVenrey にいない Supabase キャストを is_active: false に
  const matchedIds = new Set(
    mrGirls
      .map((mr) => {
        const byId = existingGirls.find((g) => g.mrvenrey_id == mr.GirlId)
        if (byId) return byId.id
        const byName = existingGirls.find((g) => g.name === mr.Name)
        return byName?.id
      })
      .filter(Boolean),
  )

  const missingGirls = existingGirls.filter((g) => !matchedIds.has(g.id))
  let deactivated = 0

  if (missingGirls.length > 0) {
    const missingIds = missingGirls.map((g) => g.id)
    const { error: deactErr } = await supabase
      .from('girls')
      .update({ is_active: false })
      .in('id', missingIds)

    if (deactErr) {
      errorDetails.push(`is_active 一括更新エラー: ${deactErr.message}`)
    } else {
      deactivated = missingGirls.length
    }
  }

  // 9. 結果レポート
  console.log('\n========== 同期結果 ==========')
  console.log(`  MrVenrey 総数:  ${mrGirls.length}`)
  console.log(`  マッチ (更新):  ${matched}`)
  console.log(`  キャッチコピー: ${catchCopyUpdated}`)
  console.log(`  アンマッチ:     ${unmatched}`)
  console.log(`  非アクティブ化: ${deactivated}`)
  console.log(`  エラー:         ${errors}`)

  if (missingGirls.length > 0) {
    console.log(`\n--- MrVenrey に存在しない → is_active: false (${missingGirls.length}件) ---`)
    missingGirls.forEach((g) => console.log(`  - ${g.name} (id: ${g.id})`))
  }

  if (unmatchedNames.length > 0) {
    console.log('\n--- アンマッチ一覧 (新規作成されません) ---')
    unmatchedNames.forEach((n) => console.log(`  - ${n}`))
  }

  if (errorDetails.length > 0) {
    console.log('\n--- エラー詳細 ---')
    errorDetails.forEach((e) => console.log(`  - ${e}`))
  }

  console.log('\n完了。')
}

// ============================================
// Schedule sync (via /api/schedules/week)
// ============================================

interface MrVenreySchedule {
  GirlId: number
  StartTime: string | null   // "2026-02-22T12:00:00"
  EndTime: string | null     // "2026-02-23T06:00:00"
  ScheduleStatus: number     // 0=予約受付中, 1=出勤確定
  ScheduleText: string       // "即出勤可" など
  ScheduleDate: string
}

function parseTime(isoTime: string | null): string | null {
  if (!isoTime) return null
  const match = isoTime.match(/T(\d{2}:\d{2}:\d{2})/)
  return match ? match[1] : null
}

async function syncSchedule() {
  const jwt = await getJwt()
  const supabase = getSupabase()
  const today = getTodayJST()
  const weekDates = getWeekDatesJST()

  // 1. MrVenrey 週間スケジュールを取得
  console.log('MrVenrey /api/schedules/week から出勤情報を取得中...')
  const res = await fetch(`${MRVENREY_API}/api/schedules/week`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`MrVenrey API エラー (${res.status}): ${text}`)
    process.exit(1)
  }
  const data = await res.json()
  const scheduleList: MrVenreySchedule[] = data.ScheduleList || []
  console.log(`MrVenrey: ${scheduleList.length} 件取得 (週間)`)

  // 2. Supabase の girls から mrvenrey_id → girl_id マップ作成
  const { data: girls, error: girlsErr } = await supabase
    .from('girls')
    .select('id, name, mrvenrey_id')
    .eq('brand_id', HITOMITSU_BRAND_ID)
    .not('mrvenrey_id', 'is', null)

  if (girlsErr) {
    console.error('Supabase girls 取得エラー:', girlsErr.message)
    process.exit(1)
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
  console.log(`対象日: ${allDates[0]} 〜 ${allDates[allDates.length - 1]}`)

  // 4. 全スケジュールを日付ごとに upsert
  let upserted = 0
  let skipped = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const [date, schedules] of byDate) {
    console.log(`\n--- ${date} (${schedules.length}件) ---`)
    for (const mr of schedules) {
      const girl = mrIdToGirl.get(String(mr.GirlId))
      if (!girl) {
        skipped++
        continue
      }

      try {
        const startTime = parseTime(mr.StartTime)
        const endTime = parseTime(mr.EndTime)
        const statusLabel = mr.ScheduleStatus === 1 ? '確定' : '受付中'

        const { error: upsertErr } = await supabase
          .from('schedules')
          .upsert(
            {
              girl_id: girl.id,
              date,
              area_id: NISHIFUNABASHI_AREA_ID,
              brand_id: HITOMITSU_BRAND_ID,
              status: 'working',
              start_time: startTime,
              end_time: endTime,
              schedule_status: mr.ScheduleStatus,
              comment: mr.ScheduleText || null,
            },
            { onConflict: 'girl_id,date,area_id' },
          )

        if (upsertErr) throw upsertErr
        upserted++
        console.log(`  + ${girl.name} ${startTime || '未定'}〜${endTime || '未定'} [${statusLabel}]${mr.ScheduleText ? ' ' + mr.ScheduleText : ''}`)
      } catch (err: any) {
        errors++
        errorDetails.push(`GirlId ${mr.GirlId} (${date}): ${err.message}`)
      }
    }
  }

  // 5. 今日以降の日付で MrVenrey にないスケジュール（area_id=null）を削除
  //    過去日のスケジュールは削除しない
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
      .eq('area_id', NISHIFUNABASHI_AREA_ID)

    if (!fetchSchErr && existingSchedules) {
      const toRemove = existingSchedules.filter((s) => !syncedGirlIdsForDate.has(s.girl_id))
      if (toRemove.length > 0) {
        const { error: delErr } = await supabase
          .from('schedules')
          .delete()
          .in('id', toRemove.map((s) => s.id))

        if (delErr) {
          errorDetails.push(`スケジュール削除エラー (${date}): ${delErr.message}`)
        } else {
          removed += toRemove.length
        }
      }
    }
  }

  // 6. レポート
  console.log(`\n========== 出勤同期結果 (${allDates[0]} 〜 ${allDates[allDates.length - 1]}) ==========`)
  console.log(`  スケジュール総数: ${scheduleList.length} (${byDate.size}日分)`)
  console.log(`  upsert:           ${upserted}`)
  console.log(`  スキップ:         ${skipped} (mrvenrey_id 不一致)`)
  console.log(`  非出勤削除:       ${removed}`)
  console.log(`  エラー:           ${errors}`)

  if (errorDetails.length > 0) {
    console.log('\n--- エラー詳細 ---')
    errorDetails.forEach((e) => console.log(`  - ${e}`))
  }

  console.log('\n完了。')
}

// ============================================
// Entry point
// ============================================

const isSchedule = process.argv.includes('--schedule')

;(isSchedule ? syncSchedule() : syncGirls()).catch((err) => {
  console.error('致命的エラー:', err)
  process.exit(1)
})
