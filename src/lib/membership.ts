/**
 * 公式サイト → CRM 会員（あそび会員）導線。
 * API 用 NEXT_PUBLIC_CRM_API_URL とはホストが違うことがあるため、専用 URL を使う。
 */
export const DEFAULT_MEMBERSHIP_URL = 'https://crm.st-online.jp/membership'

export function membershipBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_MEMBERSHIP_URL || DEFAULT_MEMBERSHIP_URL).trim()
  return raw.replace(/\/$/, '') || DEFAULT_MEMBERSHIP_URL
}

export type MembershipLinkOptions = {
  /** 戻り先の店舗キー（nishifuna / kasai / kinshicho） */
  store?: string
  /** キャスト ID（将来のディープリンク用） */
  castId?: string | number
  /** ログイン後に開きたいパス（例: browse） */
  path?: 'home' | 'browse' | 'login'
}

export function membershipUrl(options: MembershipLinkOptions = {}): string {
  const path = options.path === 'browse' ? '/browse' : options.path === 'login' ? '/login' : ''
  const url = new URL(`${membershipBaseUrl()}${path}`)
  url.searchParams.set('from', 'official')
  if (options.store) url.searchParams.set('store', options.store)
  if (options.castId != null && String(options.castId).trim() !== '') {
    url.searchParams.set('cast_id', String(options.castId))
  }
  return url.toString()
}
