// MrVenrey Azure Blob URL から GUID を抽出してプロキシURL に変換
// 元URL例: https://mrvenreyweb.blob.core.windows.net/te14/image/girls/{GUID}/600_800.jpg
// プロキシURL: /api/mrvenrey-image?id={GUID}

const GIRL_GUID_RE = /\/girls\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i

export function toProxyImageUrl(blobUrl: string): string | null {
  return blobUrl
}

const CRM_STORAGE_BASE = 'https://crm.h-mitsu.com/storage/';

/** Web 表示では Venrey Blob 等を使わない（画像は CRM に統一） */
export function isVenreyImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const u = url.toLowerCase()
  return u.includes('mrvenreyweb.blob') || u.includes('mrvenrey/girl-image')
}

function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Ex: '/storage/images/1.jpg' -> 'https://crm.h-mitsu.com/storage/images/1.jpg'
  // Ex: 'images/1.jpg' -> 'https://crm.h-mitsu.com/storage/images/1.jpg'
  const cleanUrl = url.replace(/^\/?storage\/?/, '');
  return `${CRM_STORAGE_BASE}${cleanUrl.replace(/^\/+/, '')}`;
}

function firstNonVenreyFromStrings(urls: (string | null | undefined)[]): string | null {
  for (const raw of urls) {
    if (!raw || typeof raw !== 'string') continue
    if (raw.includes('placehold.co')) continue
    const formatted = formatImageUrl(raw)
    if (!formatted) continue
    if (isVenreyImageUrl(formatted)) continue
    return formatted
  }
  return null
}

// Girl オブジェクトから画像URL を取得（Venrey Blob は使わず、CRM ストレージ等のみ）
export function getGirlImageUrl(girl: any): string | null {
  if (!girl) return null

  const fromCastImages =
    girl.cast_images && Array.isArray(girl.cast_images) && girl.cast_images.length > 0
      ? girl.cast_images.map((img: any) => (typeof img === 'string' ? img : img?.image_path || img?.url))
      : []

  const fromImagesArray =
    girl.images && Array.isArray(girl.images) ? girl.images.filter((x: unknown) => typeof x === 'string') : []

  const candidates: (string | null | undefined)[] = [
    girl.profile_image,
    ...fromCastImages,
    girl.idol_image_path,
    girl.image,
    girl.thumbnail,
    ...fromImagesArray,
    girl.image1_url,
  ]

  return firstNonVenreyFromStrings(candidates)
}

// Girl オブジェクトから全画像URL を取得
export function getGirlImageUrls(girl: any): string[] {
  let rawImages: string[] = [];
  
  if (girl?.gallery_images) {
    try {
      const parsed = typeof girl.gallery_images === 'string' ? JSON.parse(girl.gallery_images) : girl.gallery_images;
      if (Array.isArray(parsed)) rawImages.push(...parsed);
    } catch (e) {}
  }

  if (girl?.cast_images && Array.isArray(girl.cast_images)) {
    const castImgs = girl.cast_images.map((img: any) => typeof img === 'string' ? img : img.image_path || img.url);
    rawImages.push(...castImgs);
  }

  if (girl?.images && Array.isArray(girl.images)) {
    rawImages.push(...girl.images);
  }

  // Fallback to single profile image so slider isn't empty
  if (rawImages.length === 0) {
    const singleImageUrl = getGirlImageUrl(girl);
    if (singleImageUrl) {
      rawImages.push(singleImageUrl);
    }
  }

  let safeImages = rawImages
    .map((url) => (typeof url === 'string' ? url : null))
    .filter(Boolean)
    .map((url) => formatImageUrl(url))
    .filter(
      (url): url is string =>
        !!url && typeof url === 'string' && !url.includes('placehold.co') && !isVenreyImageUrl(url)
    )

  return Array.from(new Set(safeImages)) as string[]
}
