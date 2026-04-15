import type { PlayCategoryDef, PlayItemDef } from './types'

/**
 * 店舗様ヒアリングのカテゴリ・項目定義（表示用。値は play_availability のキーと対応）
 *
 * NOTE:
 * - いまは西船橋（store_id=1）前提で固定カタログ
 * - 将来 店舗別 master API ができたら置き換え予定
 */
export function getCastPlayCatalog(_storeId?: string | number): PlayCategoryDef[] {
  return [
  {
    id: 'misc',
    title: 'その他',
    items: [
      { id: 'squirt', label: '潮吹き', allowsDepends: true },
      { id: 'paipan', label: 'パイパン', allowsDepends: true },
      { id: 'home_visit', label: '自宅出張', allowsDepends: false },
      { id: 'meetup', label: '待ち合わせ', allowsDepends: false },
      { id: 'train_taxi', label: '電車・タクシー移動', allowsDepends: false },
    ],
  },
  {
    id: 'paid_options',
    title: 'オプションプレイ（有料）',
    items: [
      { id: 'opt_pantyhose_1500', label: 'パンスト（1500）', allowsDepends: true },
      { id: 'opt_denma_1500', label: '電マ（1500）', allowsDepends: true },
      { id: 'opt_remote_rotor_1500', label: '遠隔ローター（1500）', allowsDepends: true },
      { id: 'opt_panty_1500', label: 'パンティ（1500）', allowsDepends: true },
      { id: 'opt_gokkun_2000', label: 'ごっくん（2000）', allowsDepends: true },
      { id: 'opt_cos_500', label: 'コスプレ（500）', allowsDepends: true },
      { id: 'opt_af_5000', label: 'AF（5000）', allowsDepends: true },
      { id: 'opt_3p_m2', label: '3P（男2）', allowsDepends: true },
      { id: 'opt_3p_f2', label: '3P（女2）', allowsDepends: true },
      { id: 'opt_washed_play_2000', label: 'お客様が洗った状態での即プレイ（2000）', allowsDepends: true },
      { id: 'opt_video_face', label: '動画（顔出し）', allowsDepends: true },
      { id: 'opt_video_noface', label: '動画（顔なし）', allowsDepends: true },
    ],
  },
  {
    id: 'free_options',
    title: 'オプションプレイ（無料）',
    items: [
      { id: 'free_vibe', label: 'バイブ', allowsDepends: true },
      { id: 'free_rotor', label: 'ローター', allowsDepends: true },
      { id: 'free_onakan', label: 'オナ鑑(自・相)', allowsDepends: true },
      { id: 'free_prostate', label: '前立腺マッサージ', allowsDepends: true },
      { id: 'free_nopan_nobra', label: 'ノーパン、ノーブラ', allowsDepends: true },
      { id: 'free_face_finish', label: '顔面発射', allowsDepends: true },
      { id: 'free_washed_shaku', label: 'お客様が洗った状態での即尺', allowsDepends: true },
      { id: 'free_holy_water', label: '聖水', allowsDepends: true },
      { id: 'free_irrumatio', label: 'イラマチオ', allowsDepends: true },
    ],
  },
  {
    id: 'basic_play',
    title: '基本プレイ',
    items: [
      { id: 'basic_dkiss', label: 'Dキス', allowsDepends: true },
      { id: 'basic_full_lip', label: '全身リップ', allowsDepends: true },
      { id: 'basic_sumata', label: '素股', allowsDepends: true },
      { id: 'basic_back_sumata', label: 'バック素股', allowsDepends: true },
      { id: 'basic_finger', label: '指入れ', allowsDepends: true },
      { id: 'basic_paizuri', label: 'パイずり', allowsDepends: true },
      { id: 'basic_anal_lick', label: 'アナル舐め', allowsDepends: true },
      { id: 'basic_tama_lick', label: 'タマ舐め', allowsDepends: true },
      { id: 'basic_lotion', label: 'ローションプレイ', allowsDepends: true },
      { id: 'basic_mouth_finish', label: '口内発射', allowsDepends: true },
      { id: 'basic_69', label: '69', allowsDepends: true },
      { id: 'basic_verbal', label: '言葉責め', allowsDepends: true },
      { id: 'basic_cunnilingus', label: 'クンニ', allowsDepends: true },
      { id: 'basic_seme', label: '責め派', allowsDepends: true },
      { id: 'basic_ukemi', label: '受け身派', allowsDepends: true },
    ],
  },
  ]
}

/** 既存利用のための互換エクスポート（store_id=1 相当） */
export const CAST_PLAY_CATALOG: PlayCategoryDef[] = getCastPlayCatalog(1)

const ITEM_BY_ID = new Map<string, { def: PlayItemDef; category: PlayCategoryDef }>()
for (const cat of CAST_PLAY_CATALOG) {
  for (const item of cat.items) {
    ITEM_BY_ID.set(item.id, { def: item, category: cat })
  }
}

export function getPlayItemMeta(itemId: string) {
  return ITEM_BY_ID.get(itemId)
}
