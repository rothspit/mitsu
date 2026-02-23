/**
 * CRM (SQLite) → Supabase 同期スクリプト
 *
 * CRMサーバーの SQLite から store_courses / service_options を取得し、
 * Supabase の同名テーブルに upsert する。
 *
 * Usage:
 *   npx tsx scripts/sync-crm.ts
 *
 * 前提:
 *   - SSH鍵 ~/WIFEHP.pem でCRMサーバーにアクセス可能
 *   - .env.local に SUPABASE_SERVICE_ROLE_KEY が設定済み
 *   - Supabase に store_courses / service_options テーブルが作成済み
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { homedir } from 'os'
import path from 'path'

config({ path: '.env.local' })

// ============================================
// Constants
// ============================================

const CRM_HOST = '162.43.91.102'
const SSH_KEY = path.join(homedir(), 'WIFEHP.pem')
const SQLITE_DB = '/var/www/hitoduma-crm/database/database.sqlite'

const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

// 人妻の蜜の store_id: 1=西船橋, 3=葛西
const MITSU_STORE_IDS = [1, 3]

// store_id → store_code マッピング
const STORE_CODE_MAP: Record<number, string> = {
  1: 'hitoduma_nishi',
  3: 'kasai',
}

// ============================================
// Supabase client
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// SSH + SQLite helper
// ============================================

function querySqlite(sql: string): any[] {
  const escaped = sql.replace(/"/g, '\\"')
  const cmd = `ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no root@${CRM_HOST} "sqlite3 -json '${SQLITE_DB}' \\"${escaped}\\""`
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', timeout: 15000 })
    const trimmed = stdout.trim()
    if (!trimmed || trimmed === '[]') return []
    return JSON.parse(trimmed)
  } catch (e: any) {
    console.error('❌ SQLite query failed:', e.message)
    return []
  }
}

// ============================================
// sync store_courses
// ============================================

async function syncCourses() {
  console.log('\n📦 store_courses を同期中...')

  const storeIdList = MITSU_STORE_IDS.join(',')
  const rows = querySqlite(
    `SELECT id, store_id, name, duration_minutes, price, display_order, is_active FROM store_courses WHERE store_id IN (${storeIdList}) AND deleted_at IS NULL`
  )

  console.log(`  CRM: ${rows.length} 件取得`)
  if (rows.length === 0) return

  const records = rows.map((r: any) => ({
    id: r.id,
    brand_id: HITOMITSU_BRAND_ID,
    store_code: STORE_CODE_MAP[r.store_id] || `store_${r.store_id}`,
    name: r.name,
    duration_minutes: r.duration_minutes,
    price: r.price,
    display_order: r.display_order,
    is_active: r.is_active === 1,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('store_courses')
    .upsert(records, { onConflict: 'id' })

  if (error) {
    console.error('  ❌ upsert error:', error.message)
  } else {
    console.log(`  ✅ ${records.length} 件 upsert 完了`)
  }
}

// ============================================
// sync service_options
// ============================================

async function syncOptions() {
  console.log('\n📦 service_options を同期中...')

  const storeIdList = MITSU_STORE_IDS.join(',')
  // store_id が NULL（全店共通）または人妻の蜜の店舗のもの
  const rows = querySqlite(
    `SELECT id, store_id, name, category, price, duration_minutes, display_order, is_active FROM service_options WHERE (store_id IS NULL OR store_id IN (${storeIdList})) AND deleted_at IS NULL`
  )

  console.log(`  CRM: ${rows.length} 件取得`)
  if (rows.length === 0) return

  const records = rows.map((r: any) => ({
    id: r.id,
    brand_id: HITOMITSU_BRAND_ID,
    store_code: r.store_id ? (STORE_CODE_MAP[r.store_id] || `store_${r.store_id}`) : null,
    name: r.name,
    category: r.category || null,
    price: typeof r.price === 'number' ? r.price : parseInt(r.price) || 0,
    duration_minutes: r.duration_minutes || 0,
    display_order: r.display_order || 0,
    is_active: r.is_active === 1,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('service_options')
    .upsert(records, { onConflict: 'id' })

  if (error) {
    console.error('  ❌ upsert error:', error.message)
  } else {
    console.log(`  ✅ ${records.length} 件 upsert 完了`)
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('========== CRM → Supabase 同期 ==========')
  console.log(`CRM: ${CRM_HOST}`)
  console.log(`対象: 人妻の蜜 (store_id: ${MITSU_STORE_IDS.join(', ')})`)

  await syncCourses()
  await syncOptions()

  console.log('\n========== 完了 ==========')
}

main().catch((e) => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})
