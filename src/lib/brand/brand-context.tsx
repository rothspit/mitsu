'use client'

import { createContext, useContext, type ReactNode } from 'react'

// ============================================
// Brand 型定義
// ============================================

export type BrandSlug = 'idol-gakuen' | 'hitomitsu'
export type ThemeStyle = 'pop' | 'luxury'

export interface BrandThemeColors {
  primary: string
  'primary-light': string
  'primary-dark': string
  secondary: string
  'secondary-light': string
  'secondary-dark': string
  accent: string
  background: string
  surface: string
  text: string
  'text-muted': string
  'header-bg': string
  'header-text': string
  'footer-bg': string
  'footer-text': string
}

export interface BrandThemeBorderRadius {
  button: string
  card: string
  input: string
}

export interface BrandThemeFont {
  heading: string
  body: string
}

export interface BrandThemeConfig {
  colors: BrandThemeColors
  borderRadius: BrandThemeBorderRadius
  font: BrandThemeFont
  style: ThemeStyle
}

export interface Brand {
  id: string
  slug: BrandSlug
  name: string
  domain: string
  area?: string
  phone?: string
  line_url?: string
  site_title?: string
  site_tagline?: string
  description?: string
  theme_config: BrandThemeConfig
}

// ============================================
// Context
// ============================================

const BrandContext = createContext<Brand | null>(null)

export function BrandProvider({
  brand,
  children,
}: {
  brand: Brand
  children: ReactNode
}) {
  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand(): Brand {
  const brand = useContext(BrandContext)
  if (!brand) {
    throw new Error('useBrand() must be used within a <BrandProvider>')
  }
  return brand
}
