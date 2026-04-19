import type { StoreKey } from './store-pages'

/**
 * Official URL segment → CRM `stores.code` (Hitoduma). No numeric IDs here.
 */
export const HITODUMA_PAGE_TO_STORE_CODE: Record<StoreKey, string> = {
  nishifuna: 'hitoduma_nishi',
  /** 公開サイトの出勤・在籍一覧は西船橋店と同一データ（CRM 上は kasai 行も別途あり） */
  kasai: 'hitoduma_nishi',
  kinshicho: 'hmitsu_kinshicho',
  /**
   * CRM に人妻ブランドの幕張・市川行が無い間は、公開ページは西船橋ハブの `code` に寄せる。
   * 店舗行と `stores.code` が確定したらここを差し替え、リゾルバに同じ code を追加する。
   */
  makuhari: 'hitoduma_nishi',
  ichikawa: 'hitoduma_nishi',
}

/** Home / aggregate schedule: Nishifuna (hitoduma_nishi). */
export const HITODUMA_DEFAULT_STORE_CODE = 'hitoduma_nishi'
