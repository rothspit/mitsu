/**
 * CRM /idol/casts のプロフィール画像だけを Supabase girls.images に保存する。
 * 突き合わせはキャスト表示名のみ（Heaven / MrVenrey ID は使わない）。
 *
 * Usage:
 *   npx tsx scripts/link-crm-images-to-girls.ts
 *     → CRM に名前が一致する全員を CRM 画像で上書き（既定）
 *   npx tsx scripts/link-crm-images-to-girls.ts --only-empty
 *     → getGirlImageUrl がまだ null の行だけ更新（CRM 未設定の穴埋め）
 *
 * 必要: .env.local に NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import {
  buildCrmCastMapByNormalizedName,
  normalizeCrmCastName,
} from '../src/lib/brand/crm-cast-images'
import { getGirlImageUrl } from '../src/lib/brand/image-utils'

config({ path: '.env.local' })

const CRM_CASTS_URL = 'https://crm.h-mitsu.com/api/idol/casts?store_id=1'
const HITOMITSU_BRAND_ID = 'a1876a1a-1b51-4970-b25e-893ce0910690'

async function main() {
  const onlyEmpty = process.argv.includes('--only-empty')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が .env.local に必要です。')
    process.exit(1)
  }

  const res = await fetch(CRM_CASTS_URL)
  if (!res.ok) {
    console.error('CRM casts 取得失敗:', res.status)
    process.exit(1)
  }
  const data = await res.json()
  const casts = data.casts || data.data || []
  const byName = buildCrmCastMapByNormalizedName(casts)

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data: girls, error } = await supabase
    .from('girls')
    .select('id, name, images')
    .eq('brand_id', HITOMITSU_BRAND_ID)

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  let updated = 0
  let skipped = 0
  let noCrm = 0

  for (const g of girls || []) {
    const key = typeof g.name === 'string' ? normalizeCrmCastName(g.name) : ''
    if (!key) {
      skipped++
      continue
    }
    const crm = byName.get(key)
    if (!crm) {
      noCrm++
      continue
    }

    const urlFromCrm = getGirlImageUrl(crm as Record<string, unknown>)
    if (!urlFromCrm) {
      skipped++
      continue
    }

    const existing = getGirlImageUrl(g as Record<string, unknown>)
    if (existing && onlyEmpty) {
      skipped++
      continue
    }

    const { error: uerr } = await supabase.from('girls').update({ images: [urlFromCrm] }).eq('id', g.id)
    if (uerr) {
      console.error(`更新失敗 ${g.name}:`, uerr.message)
      continue
    }
    updated++
    const label = onlyEmpty ? '' : '[CRM上書き] '
    console.log(`${label}${g.name} → OK`)
  }

  console.log('\n完了')
  console.log(`  更新: ${updated}`)
  console.log(`  スキップ（URL なし / only-empty）: ${skipped}`)
  console.log(`  CRM に名前一致なし: ${noCrm}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
