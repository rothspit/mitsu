/**
 * Maps CRM `stores.code` → numeric `store_id` for 人妻の蜜（Hitoduma）.
 * Only route handlers and server-only clients should import this.
 *
 * Keep in sync with CRM `stores` table. Wrong codes → wrong store data on the public site.
 */
export const HITODUMA_STORE_ID_BY_CODE: Record<string, number> = {
  /** scripts/sync-crm.ts: hitoduma_nishi */
  hitoduma_nishi: 1,
  /** scripts/sync-crm.ts: kasai */
  kasai: 3,
  /** Confirm in CRM; placeholder until `stores.code` is finalized */
  hmitsu_kinshicho: 4,
  hmitsu_makuhari: 5,
  hmitsu_ichikawa: 6,
}

export function resolveHitodumaStoreId(storeCode: string): number {
  const id = HITODUMA_STORE_ID_BY_CODE[storeCode]
  if (id == null) {
    throw new Error(`Unknown Hitoduma store code: ${storeCode}`)
  }
  return id
}
