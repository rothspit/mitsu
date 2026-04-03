'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MAIN_AREAS = [
  { href: '/nishifuna', label: '西船橋' },
  { href: '/kasai', label: '葛西' },
  { href: '/kinshicho', label: '錦糸町' },
] as const

/**
 * メイン3エリアのみ（幕張・市川など出張ページは含めない）
 */
export default function StoreAreaNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#e7e5e4] bg-white px-2 py-2" aria-label="エリア別出勤情報">
      <div className="max-w-2xl mx-auto flex rounded-lg overflow-hidden border border-[#b8860b]/25 divide-x divide-[#b8860b]/15 shadow-sm">
        {MAIN_AREAS.map(({ href, label }) => {
          const isActive =
            pathname === href || pathname === `${href}/` || pathname?.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 text-center py-2.5 text-xs font-semibold tracking-wider transition-colors ${
                isActive
                  ? 'bg-[#b8860b] text-white'
                  : 'text-[#78716c] hover:bg-[#b8860b]/8 hover:text-[#1c1917]'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
