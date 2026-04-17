/**
 * Maps CRM `stores.code` → numeric `store_id` for アイドル学園（Idol）.
 * Only route handlers and server-only clients should import this.
 *
 * Keep in sync with CRM `stores`（SQLite）.
 */
export const IDOL_STORE_ID_BY_CODE: Record<string, number> = {
  idol_funabashi: 2,
  idol_makuhari: 4,
  idol_akiba: 5,
}

export function resolveIdolStoreId(storeCode: string): number {
  const id = IDOL_STORE_ID_BY_CODE[storeCode]
  if (id == null) {
    throw new Error(`Unknown Idol store code: ${storeCode}`)
  }
  return id
}
