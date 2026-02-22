// Brand context & hooks (client)
export {
  BrandProvider,
  useBrand,
  type Brand,
  type BrandSlug,
  type BrandThemeConfig,
  type BrandThemeColors,
  type BrandThemeBorderRadius,
  type BrandThemeFont,
  type ThemeStyle,
} from './brand-context'

// Server-side brand resolution
export { getBrand, getBrandSlug } from './get-brand'

// Brand-scoped data queries (server)
export {
  getGirlsByBrand,
  getGirlById,
  getTodaySchedule,
  getDiariesByBrand,
  getDiaryBySlug,
  type Girl,
  type Schedule,
  type Diary,
} from './brand-queries'
