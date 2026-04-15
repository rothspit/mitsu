import { getCastPlayCatalog } from '@/lib/cast-profile/catalog'
import { playValueLabel } from '@/lib/cast-profile/normalize'
import type { PlayValue } from '@/lib/cast-profile/types'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

function valueToneClass(v: PlayValue, allowsDepends: boolean): string {
  if (!allowsDepends && v === 'depends') {
    return 'text-[#d6d3d1] font-medium'
  }
  switch (v) {
    case 'ok':
      return 'text-[#b8860b] font-semibold'
    case 'negotiable':
      return 'text-[#57534e] font-medium'
    case 'depends':
      return 'text-[#44403c] font-medium'
    case 'ng':
      return 'text-[#a8a29e] font-medium'
    default:
      return 'text-[#78716c] font-medium'
  }
}

export function CastPlayMatrix({ availability }: { availability: Record<string, PlayValue> }) {
  const keys = new Set(Object.keys(availability))
  if (keys.size === 0) return null
  const catalog = getCastPlayCatalog(1)

  return (
    <div className="space-y-7">
      {catalog.map((cat) => {
        const rows = cat.items.filter((it) => keys.has(it.id))
        if (rows.length === 0) return null
        return (
          <div key={cat.id}>
            <h4
              className="text-xs tracking-[0.2em] text-[#78716c] mb-3 font-medium"
              style={{ fontFamily: serif }}
            >
              {cat.title}
            </h4>
            <div className="rounded-lg border border-[#e7e5e4] bg-[#fafaf9]/80 overflow-hidden">
              {rows.map((it) => {
                const v = availability[it.id]
                if (!v) return null
                const label = playValueLabel(v, it.allowsDepends)
                return (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-3 px-1 py-3 border-b border-[#e7e5e4] last:border-b-0"
                  >
                    <span className="text-sm text-[#44403c] leading-snug flex-1 min-w-0 pr-2">{it.label}</span>
                    <span
                      className={`shrink-0 text-sm tabular-nums min-w-[3.5rem] text-right ${valueToneClass(v, it.allowsDepends)}`}
                      style={{ fontFamily: serif }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
