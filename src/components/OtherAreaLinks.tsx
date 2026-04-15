import Link from 'next/link'

/**
 * メインタブから外した出張エリア（SEO用テキストリンク）
 */
export default function OtherAreaLinks() {
  return (
    <div className="text-center pt-2">
      <p className="text-[10px] text-[#a8a29e] tracking-wider mb-2">リンク</p>
      <p className="text-[11px] text-[#78716c]">
        <Link href="/recruit" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
          求人情報
        </Link>
        <span className="mx-2 text-[#d6d3d1]" aria-hidden>
          ·
        </span>
        <Link href="/makuhari" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
          幕張
        </Link>
        <span className="mx-2 text-[#d6d3d1]" aria-hidden>
          ·
        </span>
        <Link href="/ichikawa" className="hover:text-[#b8860b] underline-offset-2 hover:underline">
          市川
        </Link>
      </p>
    </div>
  )
}
