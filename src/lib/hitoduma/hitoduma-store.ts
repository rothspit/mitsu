import type { StoreKey } from './store-pages'

/**
 * Official URL segment → CRM `stores.code` (Hitoduma). No numeric IDs here.
 */
export const HITODUMA_PAGE_TO_STORE_CODE: Record<StoreKey, string> = {
  nishifuna: 'hitoduma_nishi',
  kasai: 'kasai',
  kinshicho: 'hmitsu_kinshicho',
  makuhari: 'hmitsu_makuhari',
  ichikawa: 'hmitsu_ichikawa',
}

/** Home / aggregate schedule: Nishifuna (hitoduma_nishi). */
export const HITODUMA_DEFAULT_STORE_CODE = 'hitoduma_nishi'
