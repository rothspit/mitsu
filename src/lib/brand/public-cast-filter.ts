import { getGirlImageUrl } from '@/lib/brand/image-utils'

/** CRM が公開APIに載せてしまう仮名・未設定名 */
const UNPUBLISHED_CAST_NAME_RE =
  /未設定|新規キャスト|お任せ|テスト|ダミー|dummy|キャンセル/i

export function castDisplayNameLooksIncomplete(name: unknown): boolean {
  const raw = String(name ?? '').trim()
  if (!raw) return true
  return UNPUBLISHED_CAST_NAME_RE.test(raw.replace(/\s+/g, ''))
}

export function castHasPublicPhoto(girl: unknown): boolean {
  return Boolean(getGirlImageUrl(girl))
}
