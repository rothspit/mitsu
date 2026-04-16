export type StoreKey = 'nishifuna' | 'kasai' | 'kinshicho' | 'makuhari' | 'ichikawa'

/**
 * CRM の store_id マッピング。
 *
 * NOTE:
 * - いまは公式側で軽量に分岐できるように固定値で持つ
 * - 変更が入ったらここを更新（ページ側の修正は不要）
 */
export const STORE_ID_BY_KEY: Record<StoreKey, number> = {
  nishifuna: 1,
  kasai: 2,
  kinshicho: 3,
  makuhari: 4,
  ichikawa: 5,
} as const

