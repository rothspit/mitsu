import type { ExperienceStatus, PlayValue } from './types'
import { EXPERIENCE_STATUS_LABELS } from './types'

const PLAY_VALUE_BY_TOKEN: Record<string, PlayValue> = {
  ok: 'ok',
  available: 'ok',
  可: 'ok',
  negotiable: 'negotiable',
  相談: 'negotiable',
  depends: 'depends',
  相手次第: 'depends',
  ng: 'ng',
  unavailable: 'ng',
  不可: 'ng',
}

export function normalizePlayValue(raw: unknown): PlayValue | null {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  return PLAY_VALUE_BY_TOKEN[s] ?? PLAY_VALUE_BY_TOKEN[s.toLowerCase()] ?? null
}

const EXPERIENCE_BY_TOKEN: Record<string, ExperienceStatus> = {
  complete_beginner: 'complete_beginner',
  industry_beginner: 'industry_beginner',
  limited_experience: 'limited_experience',
  完全未経験: 'complete_beginner',
  業界未経験: 'industry_beginner',
  経験浅め: 'limited_experience',
}

export function normalizeExperienceStatus(raw: unknown): ExperienceStatus | null {
  if (raw === null || raw === undefined || raw === '') return null
  const s = String(raw).trim()
  return EXPERIENCE_BY_TOKEN[s] ?? EXPERIENCE_BY_TOKEN[s.toLowerCase()] ?? null
}

export function experienceStatusLabel(status: ExperienceStatus | null): string | null {
  if (!status) return null
  return EXPERIENCE_STATUS_LABELS[status] ?? null
}

const PLAY_LABELS: Record<PlayValue, string> = {
  ok: '可',
  negotiable: '相談',
  depends: '相手次第',
  ng: '不可',
}

export function playValueLabel(v: PlayValue, allowsDepends: boolean): string {
  if (!allowsDepends && v === 'depends') return '—'
  return PLAY_LABELS[v]
}
