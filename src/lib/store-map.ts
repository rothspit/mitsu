export type StoreKey = 'nishifuna' | 'kasai' | 'kinshicho' | 'makuhari' | 'ichikawa'

/**
 * CRM store_id mapping for official site routes.
 *
 * Wrong IDs pull another store's casts from `/api/idol/casts` and `/api/idol/schedules`
 * (this is not fixed by "redeploy" alone — the query parameter must match CRM).
 *
 * Confirmed from repo + CRM API samples:
 * - `scripts/sync-crm.ts`: Mitsu Nishifuna = 1, Mitsu Kasai = 3
 * - CRM `store_id=2` matches Idol Funabashi roster (e.g. schedules include cast_id 1445)
 * - CRM `store_id=3` matches Mitsu Kasai-area schedules (e.g. 夕妃, 香也, …)
 *
 * Kinshicho / Makuhari / Ichikawa: verify against CRM store master if rosters look off.
 */
export const STORE_ID_BY_KEY: Record<StoreKey, number> = {
  nishifuna: 1,
  kasai: 3,
  kinshicho: 4,
  makuhari: 5,
  ichikawa: 6,
} as const
