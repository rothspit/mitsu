import type { CastProfileQA } from '@/lib/cast-profile/types'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

function formatTraits(v: string | string[] | undefined): string | null {
  if (v === undefined || v === null) return null
  if (Array.isArray(v)) return v.filter(Boolean).join('、')
  const s = String(v).trim()
  return s === '' ? null : s
}

const FIELDS: { key: keyof CastProfileQA; title: string }[] = [
  { key: 'hobby_skills', title: '趣味・特技' },
  { key: 'favorite_type', title: '好きなタイプ' },
  { key: 'fetish_weakness', title: 'フェチ・弱点' },
  { key: 'favorite_options', title: '好きなオプション' },
  { key: 'm_traits', title: 'M度' },
  { key: 's_traits', title: 'S度' },
  { key: 'ng_basic_play', title: 'できない基本プレイ' },
  { key: 'ng_options', title: 'できないオプション' },
  { key: 'message_to_customer', title: 'お客様に一言' },
]

export function CastProfileQA({ qa }: { qa: Partial<CastProfileQA> }) {
  const blocks: { title: string; body: string }[] = []
  for (const { key, title } of FIELDS) {
    const raw = qa[key]
    if (raw === undefined || raw === null) continue
    const body = key === 'm_traits' || key === 's_traits' ? formatTraits(raw as string | string[]) : String(raw).trim()
    if (!body) continue
    blocks.push({ title, body })
  }
  if (blocks.length === 0) return null

  return (
    <div className="bg-[#fafaf9] rounded-lg border border-[#f5f5f4] p-5 shadow-sm">
      {blocks.map((b, i) => (
        <div key={b.title} className={i > 0 ? 'mt-6 pt-6 border-t border-[#e7e5e4]/70' : ''}>
          <p className="text-[10px] text-[#a8a29e] tracking-wider mb-2" style={{ fontFamily: serif }}>
            {b.title}
          </p>
          <p className="text-sm text-[#44403c] leading-loose whitespace-pre-line" style={{ fontFamily: serif }}>
            {b.body}
          </p>
        </div>
      ))}
    </div>
  )
}
