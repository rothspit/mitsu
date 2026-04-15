/**
 * CRM (/idol/casts) → Supabase(girls) 同期スクリプト
 *
 * - CRM の cast_id を girls.crm_cast_id に格納し、UNIQUE で重複増殖を防ぐ
 * - 同期は upsert 固定（onConflict: 'crm_cast_id'）
 *
 * Usage:
 *   npx tsx scripts/sync-crm-casts.ts
 *
 * Env:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Note:
 *   girls テーブルに `crm_cast_id` 追加 migration を先に適用してください。
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const CRM_CASTS_URL = 'https://crm.h-mitsu.com/api/idol/casts?store_id=1'

const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません')
    process.exit(1)
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
}

function normalizeStatus(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

function toIsoOrNull(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const ms = Date.parse(raw)
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

async function main() {
  console.log('========== CRM (/idol/casts) → Supabase(girls) 同期 ==========')

  const supabase = getSupabase()

  console.log(`CRM: ${CRM_CASTS_URL}`)
  const res = await fetch(CRM_CASTS_URL, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CRM fetch failed (${res.status}): ${text}`)
  }
  const json = await res.json()
  const casts: any[] = json.casts || json.data || []
  console.log(`CRM: ${casts.length} 件取得`)

  // CRM 側の揺れ検知: cast_id の重複を warn（上位N件）
  {
    const MAX_LOG = 20
    const counts = new Map<number, { count: number; sampleName: string | null }>()
    for (const c of casts) {
      const n = c?.cast_id != null ? Number(c.cast_id) : NaN
      if (!Number.isFinite(n) || n <= 0) continue
      const prev = counts.get(n)
      const name = typeof c?.name === 'string' && c.name.trim() ? c.name.trim() : null
      if (!prev) {
        counts.set(n, { count: 1, sampleName: name })
      } else {
        prev.count++
        if (!prev.sampleName && name) prev.sampleName = name
      }
    }
    const dupes = Array.from(counts.entries())
      .filter(([, v]) => v.count > 1)
      .sort((a, b) => b[1].count - a[1].count)

    if (dupes.length > 0) {
      console.warn(`[sync-crm-casts] CRM duplicate cast_id groups: ${dupes.length}`)
      dupes.slice(0, MAX_LOG).forEach(([id, v]) => {
        console.warn(`  - cast_id=${id} x${v.count}${v.sampleName ? ` (${v.sampleName})` : ''}`)
      })
      if (dupes.length > MAX_LOG) {
        console.warn(`  ... and ${dupes.length - MAX_LOG} more`)
      }
    }
    console.log(`[sync-crm-casts] CRM cast_id unique: ${counts.size}`)
  }

  const records = casts
    .map((c) => {
      const crmCastId = c?.cast_id != null ? Number(c.cast_id) : null
      if (!crmCastId || !Number.isFinite(crmCastId)) return null

      const status = normalizeStatus(c.status)
      const isActive = status !== '退店'

      // girls 側の主キー(id uuid)は既存運用があるため触らず、crm_cast_id を正規キーにする
      // name は CRM を優先（ただし空なら入れない）
      return {
        brand_id: HITOMITSU_BRAND_ID,
        crm_cast_id: crmCastId,
        name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : undefined,
        age: typeof c.age === 'number' ? c.age : c.age != null ? Number(c.age) : undefined,
        status: status || null,
        is_active: isActive,
        // migration: supabase/migrations/add_updated_at_to_girls.sql
        // CRMに updated_at 相当があれば優先し、無ければ now()
        updated_at: toIsoOrNull(c.updated_at) ?? toIsoOrNull(c.updatedAt) ?? new Date().toISOString(),
      }
    })
    .filter(Boolean) as Record<string, unknown>[]

  console.log(`Supabase upsert 対象: ${records.length} 件 (crm_cast_id 有効分)`)
  if (records.length === 0) return

  console.log(`[sync-crm-casts] normalized unique (crm_cast_id): ${new Set(records.map((r: any) => Number(r.crm_cast_id))).size}`)

  const { error } = await supabase.from('girls').upsert(records, { onConflict: 'crm_cast_id' })
  if (error) throw error

  console.log('✅ upsert 完了')
}

main().catch((e) => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})

