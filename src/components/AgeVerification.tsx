'use client'

import { useState, useEffect } from 'react'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export default function AgeVerification() {
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
      <div className="relative w-[90%] max-w-sm rounded-xl overflow-hidden shadow-2xl">
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
            年齢確認
          </p>
          <p className="text-xs mb-6" style={{ color: '#a09080' }}>
            当サイトは18歳未満の方の閲覧を禁止しております。<br />
            あなたは18歳以上ですか？
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
              18歳以上です ― ENTER
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
              18歳未満です ― EXIT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
