'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type AreaTab = {
  href: '/nishifuna' | '/kasai' | '/kinshicho'
  label: string
}

const MAIN_AREAS: AreaTab[] = [
  { href: '/nishifuna', label: '西船橋' },
  { href: '/kasai', label: '葛西' },
  { href: '/kinshicho', label: '錦糸町' },
]

function SakuraPetalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16.9 3.7c-3.3 1.1-5.4 3.2-6.5 6.5-1.1 3.3-3.2 5.4-6.5 6.5 3.3 1.1 5.4 3.2 6.5 6.5 1.1-3.3 3.2-5.4 6.5-6.5 3.3-1.1 5.4-3.2 6.5-6.5-3.3-1.1-5.4-3.2-6.5-6.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 10.2c.4.8.8 1.5 1.4 2.1.6.6 1.3 1 2.1 1.4-.8.4-1.5.8-2.1 1.4-.6.6-1 1.3-1.4 2.1-.4-.8-.8-1.5-1.4-2.1-.6-.6-1.3-1-2.1-1.4.8-.4 1.5-.8 2.1-1.4.6-.6 1-1.3 1.4-2.1Z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  )
}

/**
 * メイン3エリアのみ（幕張・市川など出張ページは含めない）
 */
export default function StoreAreaNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#e7e5e4] bg-white px-2 py-2" aria-label="エリア別出勤情報">
      <div className="max-w-2xl mx-auto grid grid-cols-3 rounded-lg overflow-hidden border border-[#b8860b]/25 divide-x divide-[#b8860b]/15 shadow-sm">
        {MAIN_AREAS.map(({ href, label }) => {
          const isActive =
            pathname === href || pathname === `${href}/` || pathname?.startsWith(`${href}/`)
          const isKinshicho = href === '/kinshicho'

          return (
            <Link
              key={href}
              href={href}
              className={[
                'relative text-center py-3 text-xs font-semibold tracking-wider transition-colors',
                // keep 3 equal panels; only minimal emphasis for active
                isKinshicho
                  ? 'bg-gradient-to-br from-[#fbf7ee] via-[#f2e6cc] to-[#fffaf2] text-[#b8860b] hover:brightness-[0.99]'
                  : 'bg-white text-[#78716c] hover:bg-[#b8860b]/8 hover:text-[#1c1917]',
                isActive && isKinshicho ? 'ring-1 ring-inset ring-[#b8860b]/25' : '',
                isActive && !isKinshicho ? 'text-[#b8860b]' : '',
              ].join(' ')}
            >
              <span className="flex items-center justify-center gap-1.5 leading-none">
                {isKinshicho ? (
                  <SakuraPetalIcon className="h-3.5 w-3.5 text-[#b8860b]" />
                ) : null}
                <span
                  className={isKinshicho ? 'text-[13px] font-semibold tracking-[0.22em]' : undefined}
                  style={
                    isKinshicho
                      ? { fontFamily: "var(--font-noto-sans), 'Noto Sans JP', sans-serif" }
                      : undefined
                  }
                >
                  {label}
                </span>
              </span>

              {isActive && !isKinshicho ? (
                <span
                  className="pointer-events-none absolute inset-x-3 bottom-1 h-[2px] rounded-full bg-[#b8860b]/55"
                  aria-hidden
                />
              ) : null}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
