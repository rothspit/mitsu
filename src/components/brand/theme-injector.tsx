'use client'

import { useEffect } from 'react'
import { useBrand, type BrandThemeColors } from '@/lib/brand/brand-context'

const COLOR_KEYS: (keyof BrandThemeColors)[] = [
  'primary',
  'primary-light',
  'primary-dark',
  'secondary',
  'secondary-light',
  'secondary-dark',
  'accent',
  'background',
  'surface',
  'text',
  'text-muted',
  'header-bg',
  'header-text',
  'footer-bg',
  'footer-text',
]

export function ThemeInjector() {
  const brand = useBrand()

  useEffect(() => {
    const root = document.documentElement
    const { colors, borderRadius, font, style } = brand.theme_config

    // CSS カスタムプロパティ: カラー
    for (const key of COLOR_KEYS) {
      root.style.setProperty(`--color-${key}`, colors[key])
    }

    // CSS カスタムプロパティ: ボーダーラディウス
    root.style.setProperty('--radius-button', borderRadius.button)
    root.style.setProperty('--radius-card', borderRadius.card)
    root.style.setProperty('--radius-input', borderRadius.input)

    // CSS カスタムプロパティ: フォント
    root.style.setProperty('--font-heading', font.heading)
    root.style.setProperty('--font-body', font.body)

    // data 属性
    root.setAttribute('data-theme', style)
    root.setAttribute('data-brand', brand.slug)
  }, [brand])

  return null
}
