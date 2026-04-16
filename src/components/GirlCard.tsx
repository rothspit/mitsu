import Link from 'next/link'
import { getGirlImageUrl } from '@/lib/brand/image-utils'
import type { Girl } from '@/lib/brand/brand-queries'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"

export default function GirlCard({ girl, href }: { girl: Girl; href?: string }) {
  const imageUrl = getGirlImageUrl(girl)

  return (
    <Link
      href={href ?? `/girls/${girl.id}`}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group"
    >
      <div className="aspect-[3/4] bg-[#f5f5f4] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={girl.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-5xl opacity-10">👤</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-[#1c1917]" style={{ fontFamily: serif }}>
          {girl.name}
        </p>
        {girl.age && <p className="text-[10px] text-[#78716c] mt-0.5">{girl.age}歳</p>}
        {girl.catch_copy && <p className="text-[10px] text-[#78716c] mt-1 truncate">{girl.catch_copy}</p>}
      </div>
    </Link>
  )
}

