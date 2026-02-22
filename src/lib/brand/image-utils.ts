// MrVenrey Azure Blob URL から GUID を抽出してプロキシURL に変換
// 元URL例: https://mrvenreyweb.blob.core.windows.net/te14/image/girls/{GUID}/600_800.jpg
// プロキシURL: /api/mrvenrey-image?id={GUID}

const GIRL_GUID_RE = /\/girls\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i

export function toProxyImageUrl(blobUrl: string): string | null {
  const match = blobUrl.match(GIRL_GUID_RE)
  if (!match) return null
  return `/api/mrvenrey-image?id=${match[1]}`
}

// Girl オブジェクトから画像URL を取得（プロキシ経由）
export function getGirlImageUrl(girl: any): string | null {
  const images = girl?.images as string[] | undefined
  if (images && images.length > 0) {
    return toProxyImageUrl(images[0]) ?? images[0]
  }
  return null
}

// Girl オブジェクトから全画像URL を取得（プロキシ経由）
export function getGirlImageUrls(girl: any): string[] {
  const images = girl?.images as string[] | undefined
  if (!images || images.length === 0) return []
  return images
    .map((url) => toProxyImageUrl(url) ?? url)
    .filter(Boolean)
}
