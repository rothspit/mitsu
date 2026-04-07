import { getGirlImageUrl } from '@/lib/brand/image-utils'
import type { Girl } from '@/lib/brand/brand-queries'

/** CRM キャスト名の突合用（全角半角・空白） */
export function normalizeCrmCastName(name: string): string {
  return name.normalize('NFKC').replace(/\s+/g, ' ').trim()
}

/**
 * CRM /idol/casts の一覧から「表示名 → キャスト1件」のマップ。
 * 同名が複数ある場合は、画像 URL が取れる行を優先する。
 */
export function buildCrmCastMapByNormalizedName(
  casts: unknown[]
): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>()
  for (const c of casts) {
    if (!c || typeof c !== 'object') continue
    const rec = c as Record<string, unknown>
    const raw = typeof rec.name === 'string' ? rec.name : ''
    const key = normalizeCrmCastName(raw)
    if (!key) continue
    const prev = m.get(key)
    if (!prev) {
      m.set(key, rec)
      continue
    }
    const prevUrl = getGirlImageUrl(prev)
    const curUrl = getGirlImageUrl(rec)
    if (!prevUrl && curUrl) m.set(key, rec)
  }
  return m
}

/**
 * Supabase の girl に CRM 由来の画像が無い場合、表示名で CRM キャストを引いて補う。
 * Heaven / MrVenrey ID は使わない（CRM のプロフィール画像だけ）。
 */
export function resolveGirlImageUrlWithCrmFallback(
  girl: Girl | undefined | null,
  crmByName: Map<string, Record<string, unknown>> | null | undefined
): string | null {
  const direct = getGirlImageUrl(girl)
  if (direct) return direct
  const name = typeof girl?.name === 'string' ? normalizeCrmCastName(girl.name) : ''
  if (!name || !crmByName?.size) return null
  const crm = crmByName.get(name)
  return crm ? getGirlImageUrl(crm) : null
}
