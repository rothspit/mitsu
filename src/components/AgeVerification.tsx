'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const NISHIFUNA_EXTRA_LINKS = [
  {
    href: 'https://www.cityheaven.net/chiba/A1202/A120201/shop-list/biz6/',
    label: '\u30d8\u30d6\u30f3\u30cd\u30c3\u30c8\u7248\u306f\u3053\u3061\u3089',
  },
  {
    href: 'https://www.girlsheaven-job.net/chiba/ma-158/sa-306/',
    label: '女性求人（ヘブン版）はこちら',
  },
] as const

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export default function AgeVerification() {
  const pathname = usePathname()
  const showNishifunaLinks = pathname === '/nishifuna'
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (getCookie('age_verified') !== 'true') {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    setCookie('age_verified', 'true', 30)
    setFadeOut(true)
    setTimeout(() => setVisible(false), 400)
  }

  const handleReject = () => {
    window.location.href = 'about:blank'
  }

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-400 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/80" />

      {/* カード */}
      <div className="relative w-[90%] max-w-sm max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* ヘッダー */}
        <div
          className="px-6 pt-8 pb-4 text-center"
          style={{
            background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0a0a 50%, #1a0a0a 100%)',
            borderBottom: '1px solid #b8860b44',
          }}
        >
          <div
            className="text-2xl font-bold tracking-widest mb-1"
            style={{
              fontFamily: "'Noto Serif JP', serif",
              color: '#d4af37',
            }}
          >
            人妻の蜜
          </div>
          <div className="text-xs" style={{ color: '#b8860b' }}>
            HITOMITSU
          </div>
        </div>

        {/* 本文 */}
        <div
          className="px-6 py-6 text-center"
          style={{ background: 'linear-gradient(180deg, #1a0808 0%, #0d0505 100%)' }}
        >
          <p
            className="text-sm mb-1 font-medium"
            style={{ color: '#e8d5b7' }}
          >
            {'\u5e74\u9f62\u78ba\u8a8d'}
          </p>
          <p className="text-xs mb-6" style={{ color: '#a09080' }}>
            {'\u5f53\u30b5\u30a4\u30c8\u306f18\u6b73\u672a\u6e80\u306e\u65b9\u306e\u95b2\u89a7\u3092\u7981\u6b62\u3057\u3066\u304a\u308a\u307e\u3059\u3002'}
            <br />
            {'\u3042\u306a\u305f\u306f18\u6b73\u4ee5\u4e0a\u3067\u3059\u304b\uff1f'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAccept}
              className="w-full py-3 rounded-lg text-sm font-bold tracking-wider transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #b8860b, #d4af37, #b8860b)',
                color: '#1a0a0a',
                boxShadow: '0 2px 12px #d4af3744',
              }}
            >
              {'18\u6b73\u4ee5\u4e0a\u3067\u3059 \u2015 ENTER'}
            </button>
            <button
              onClick={handleReject}
              className="w-full py-3 rounded-lg text-sm transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
              style={{
                border: '1px solid #a0908066',
                color: '#a09080',
                background: 'transparent',
              }}
            >
              {'18\u6b73\u672a\u6e80\u3067\u3059 \u2015 EXIT'}
            </button>
          </div>

          {showNishifunaLinks && (
            <div
              className="mt-6 pt-5 text-left space-y-4"
              style={{ borderTop: '1px solid #b8860b33' }}
            >
              <p className="text-[10px] text-center tracking-wider" style={{ color: '#786860' }}>
                関連リンク
              </p>
              <ul className="space-y-2.5">
                {NISHIFUNA_EXTRA_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs block leading-snug underline-offset-2 hover:underline"
                      style={{ color: '#c9a962' }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="https://yoasobi-heaven.com/ja/chiba/shop-list/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs block leading-snug underline-offset-2 hover:underline space-y-1"
                    style={{ color: '#c9a962' }}
                  >
                    <span className="font-medium block" style={{ color: '#e8d5b7' }}>
                      JAPANESE ESCORT — Tourist Welcome!
                    </span>
                    <span className="block text-[11px]" style={{ color: '#a09080' }}>
                      Hotel Delivery · Escort Tokyo / Escort Chiba · Gaijin Friendly
                    </span>
                    <span className="block text-[11px]" style={{ color: '#a09080' }}>
                      Location: Nishi-Funabashi / Kinshicho / Kasai
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
