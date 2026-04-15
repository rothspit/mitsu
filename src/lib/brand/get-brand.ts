import { headers } from 'next/headers'
import type { Brand, BrandSlug, BrandThemeConfig } from './brand-context'
import { HITOMITSU_PHONE } from './hitomitsu-phone'

// ============================================
// フォールバック定義
// ============================================

const FALLBACK_BRANDS: Record<BrandSlug, Brand> = {
  'idol-gakuen': {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'idol-gakuen',
    name: 'アイドル学園',
    domain: 'idol-gakuen.com',
    area: '船橋',
    site_title: 'アイドル学園｜船橋',
    site_tagline: '究極の「かわいい」をお届け',
    description: '船橋エリアNo.1のアイドル学園です。',
    theme_config: {
      colors: {
        primary: '#ec4899',
        'primary-light': '#f472b6',
        'primary-dark': '#db2777',
        secondary: '#8b5cf6',
        'secondary-light': '#a78bfa',
        'secondary-dark': '#7c3aed',
        accent: '#f59e0b',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#ffffff',
        'text-muted': '#94a3b8',
        'header-bg': '#1e293b',
        'header-text': '#ffffff',
        'footer-bg': '#0f172a',
        'footer-text': '#94a3b8',
      },
      borderRadius: { button: '9999px', card: '1rem', input: '0.75rem' },
      font: { heading: "'Noto Sans JP', sans-serif", body: "'Noto Sans JP', sans-serif" },
      style: 'pop',
    },
  },
  hitomitsu: {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'hitomitsu',
    name: '人妻の蜜',
    domain: 'h-mitsu.com',
    area: '西船橋・葛西・錦糸町',
    site_title: '人妻の蜜｜西船橋・葛西・錦糸町',
    site_tagline: '大人の極上癒やし',
    phone: HITOMITSU_PHONE,
    description: '人妻の蜜 - 大人の極上癒やし空間。',
    theme_config: {
      colors: {
        primary: '#7c3aed',
        'primary-light': '#a78bfa',
        'primary-dark': '#6d28d9',
        secondary: '#ec4899',
        'secondary-light': '#f472b6',
        'secondary-dark': '#db2777',
        accent: '#d4af37',
        background: '#1a0a2e',
        surface: '#2d1b4e',
        text: '#ffffff',
        'text-muted': '#a78bfa',
        'header-bg': '#2d1b4e',
        'header-text': '#ffffff',
        'footer-bg': '#1a0a2e',
        'footer-text': '#a78bfa',
      },
      borderRadius: { button: '0.5rem', card: '1rem', input: '0.5rem' },
      font: { heading: "'Noto Serif JP', serif", body: "'Noto Sans JP', sans-serif" },
      style: 'luxury',
    },
  },
}

const DEFAULT_SLUG: BrandSlug = 'idol-gakuen'

// ============================================
// getBrandSlug — ヘッダーからスラッグを取得（軽量版）
// ============================================

export async function getBrandSlug(forceSlug?: string): Promise<BrandSlug> {
  if (forceSlug === 'idol-gakuen' || forceSlug === 'hitomitsu') {
    return forceSlug
  }
  const h = await headers()
  const slug = h.get('x-brand-slug')
  if (slug === 'idol-gakuen' || slug === 'hitomitsu') {
    return slug
  }
  return DEFAULT_SLUG
}

// ============================================
// getBrand — Supabase から Brand を取得
// ============================================

export async function getBrand(forceSlug?: string): Promise<Brand> {
  const slug = await getBrandSlug(forceSlug)

  // CRMメイン運用: 公式側は Supabase を参照しない（brandはフォールバック定義で完結）
  // 将来 brand マスタも CRM から取る場合はここを差し替える
  const b = FALLBACK_BRANDS[slug] ?? FALLBACK_BRANDS[DEFAULT_SLUG]
  return {
    ...b,
    phone: slug === 'hitomitsu' ? HITOMITSU_PHONE : b.phone,
    theme_config: b.theme_config as BrandThemeConfig,
  } satisfies Brand
}
