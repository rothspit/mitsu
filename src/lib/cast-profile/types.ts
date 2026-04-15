/**
 * キャストプロフ拡張（CRM の idol/casts 等から任意で付与されるフィールド）
 */

/** プレイ可否（4段階・項目により「相手次第」なしのものあり） */
export type PlayValue = 'ok' | 'negotiable' | 'depends' | 'ng'

/** 経験ステータス（いずれか1つを想定） */
export type ExperienceStatus =
  | 'complete_beginner'
  | 'industry_beginner'
  | 'limited_experience'

export interface PlayItemDef {
  id: string
  label: string
  /** false の項目は 可 / 相談 / 不可 のみ（相手次第なし） */
  allowsDepends: boolean
}

export interface PlayCategoryDef {
  id: string
  title: string
  items: PlayItemDef[]
}

/** 媒体向け Q&A（テキスト・配列は CRM 側の保存形式に合わせて string | string[] を許容） */
export interface CastProfileQA {
  hobby_skills?: string
  favorite_type?: string
  fetish_weakness?: string
  favorite_options?: string
  m_traits?: string | string[]
  s_traits?: string | string[]
  ng_basic_play?: string
  ng_options?: string
  message_to_customer?: string
}

export const EXPERIENCE_STATUS_LABELS: Record<ExperienceStatus, string> = {
  complete_beginner: '完全未経験',
  industry_beginner: '業界未経験',
  limited_experience: '経験浅め',
}
