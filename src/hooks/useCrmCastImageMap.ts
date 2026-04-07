'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Girl } from '@/lib/brand/brand-queries'
import {
  buildCrmCastMapByNormalizedName,
  resolveGirlImageUrlWithCrmFallback,
} from '@/lib/brand/crm-cast-images'

const CRM_CASTS_URL = 'https://crm.h-mitsu.com/api/idol/casts?store_id=1'

/**
 * 店舗スケジュール（Supabase）の girl に足りない画像を、CRM キャスト一覧で補うためのマップ。
 * 表示名（正規化）で CRM と突き合わせる。
 */
export function useCrmCastImageMap(): Map<string, Record<string, unknown>> | null {
  const [map, setMap] = useState<Map<string, Record<string, unknown>> | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(CRM_CASTS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        const casts = data.casts || data.data || []
        setMap(buildCrmCastMapByNormalizedName(casts))
      })
      .catch(() => {
        if (!cancelled) setMap(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return map
}

/** カード用: Supabase の girl から表示用画像 URL だけ解決（CRM フォールバック込み） */
export function useGirlImageResolver(): (girl: Girl | undefined | null) => string | null {
  const crmMap = useCrmCastImageMap()
  return useCallback(
    (girl) => resolveGirlImageUrlWithCrmFallback(girl, crmMap),
    [crmMap]
  )
}
