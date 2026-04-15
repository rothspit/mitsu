import type { CastProfileQA, ExperienceStatus, PlayValue } from './types'
import { normalizeExperienceStatus, normalizePlayValue } from './normalize'

/** CRM の cast オブジェクトから拡張プロフを取り出す（キー名は運用で増やせる） */
export function extractCastProfileExtra(raw: Record<string, unknown>): {
  experienceStatus: ExperienceStatus | null
  playAvailability: Record<string, PlayValue>
  profileQa: Partial<CastProfileQA> | null
} {
  const nested = (raw.cast_profile ?? raw.castProfile) as Record<string, unknown> | undefined

  const exp =
    normalizeExperienceStatus(raw.experience_status) ??
    normalizeExperienceStatus(raw.experienceStatus) ??
    normalizeExperienceStatus(nested?.experience_status) ??
    normalizeExperienceStatus(nested?.experienceStatus)

  const playRaw =
    (raw.play_availability as Record<string, unknown> | undefined) ??
    (raw.playAvailability as Record<string, unknown> | undefined) ??
    (nested?.play_availability as Record<string, unknown> | undefined) ??
    (nested?.playAvailability as Record<string, unknown> | undefined)

  const playAvailability: Record<string, PlayValue> = {}
  if (playRaw && typeof playRaw === 'object') {
    for (const [k, v] of Object.entries(playRaw)) {
      const pv = normalizePlayValue(v)
      if (pv) playAvailability[k] = pv
    }
  }

  const qaRaw =
    (raw.cast_profile_qa as Record<string, unknown> | undefined) ??
    (raw.castProfileQa as Record<string, unknown> | undefined) ??
    (raw.profile_qa as Record<string, unknown> | undefined) ??
    (nested?.cast_profile_qa as Record<string, unknown> | undefined)

  let profileQa: Partial<CastProfileQA> | null = null
  if (qaRaw && typeof qaRaw === 'object') {
    profileQa = {
      hobby_skills: pickStr(qaRaw.hobby_skills ?? qaRaw.hobbySkills),
      favorite_type: pickStr(qaRaw.favorite_type ?? qaRaw.favoriteType),
      fetish_weakness: pickStr(qaRaw.fetish_weakness ?? qaRaw.fetishWeakness),
      favorite_options: pickStr(qaRaw.favorite_options ?? qaRaw.favoriteOptions),
      m_traits: normalizeTraits(qaRaw.m_traits ?? qaRaw.mTraits),
      s_traits: normalizeTraits(qaRaw.s_traits ?? qaRaw.sTraits),
      ng_basic_play: pickStr(qaRaw.ng_basic_play ?? qaRaw.ngBasicPlay),
      ng_options: pickStr(qaRaw.ng_options ?? qaRaw.ngOptions),
      message_to_customer: pickStr(qaRaw.message_to_customer ?? qaRaw.messageToCustomer),
    }
    const empty = Object.values(profileQa).every((v) => v === undefined || v === null || v === '')
    if (empty) profileQa = null
  }

  return { experienceStatus: exp, playAvailability, profileQa }
}

function pickStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s === '' ? undefined : s
}

function normalizeTraits(v: unknown): string | string[] | undefined {
  if (v === null || v === undefined) return undefined
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean)
  return pickStr(v)
}
