import { experienceStatusLabel } from '@/lib/cast-profile/normalize'
import type { ExperienceStatus } from '@/lib/cast-profile/types'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export function CastExperienceBadge({ status }: { status: ExperienceStatus }) {
  const label = experienceStatusLabel(status)
  if (!label) return null
  return (
    <div className="bg-[#fafaf9] rounded-lg p-4 border border-[#f5f5f4] shadow-sm">
      <p className="text-[10px] text-[#a8a29e] mb-1 tracking-wider">経験</p>
      <p className="font-medium text-[#1c1917] text-sm tracking-wide" style={{ fontFamily: serif }}>
        {label}
      </p>
    </div>
  )
}
