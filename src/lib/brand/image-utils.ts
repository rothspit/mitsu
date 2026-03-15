// MrVenrey Azure Blob URL から GUID を抽出してプロキシURL に変換
// 元URL例: https://mrvenreyweb.blob.core.windows.net/te14/image/girls/{GUID}/600_800.jpg
// プロキシURL: /api/mrvenrey-image?id={GUID}

const GIRL_GUID_RE = /\/girls\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i

export function toProxyImageUrl(blobUrl: string): string | null {
  return blobUrl
}

const CRM_STORAGE_BASE = 'https://crm.h-mitsu.com/storage/';

function formatImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Ex: '/storage/images/1.jpg' -> 'https://crm.h-mitsu.com/storage/images/1.jpg'
  // Ex: 'images/1.jpg' -> 'https://crm.h-mitsu.com/storage/images/1.jpg'
  const cleanUrl = url.replace(/^\/?storage\/?/, '');
  return `${CRM_STORAGE_BASE}${cleanUrl.replace(/^\/+/, '')}`;
}

// Girl オブジェクトから画像URL を取得
export function getGirlImageUrl(girl: any): string | null {
  let url = girl?.profile_image;
  if (!url && girl?.cast_images && Array.isArray(girl.cast_images) && girl.cast_images.length > 0) {
    const firstImg = girl.cast_images[0];
    url = typeof firstImg === 'string' ? firstImg : firstImg.image_path || firstImg.url;
  }
  url = url || girl?.idol_image_path || girl?.image || girl?.thumbnail;
  if (!url && girl?.images && Array.isArray(girl.images) && girl.images.length > 0) {
     url = girl.images[0];
  }
  url = url || girl?.image1_url;
  
  if (url && typeof url === 'string' && url.includes('placehold.co')) {
    return null; // Ignore external dummy service to prevent Next.js UI Preload warnings
  }
  return formatImageUrl(url);
}

// Girl オブジェクトから全画像URL を取得
export function getGirlImageUrls(girl: any): string[] {
  let rawImages: any[] = [];
  if (girl?.gallery_images) {
    try {
      rawImages = typeof girl.gallery_images === 'string' ? JSON.parse(girl.gallery_images) : girl.gallery_images;
    } catch (e) {
    }
  } else if (girl?.cast_images && Array.isArray(girl.cast_images) && girl.cast_images.length > 0) {
    // If it's an array of objects from the CRM API
    rawImages = girl.cast_images.map((img: any) => img.image_path || img);
  } else if (girl?.images) {
    rawImages = girl.images;
  } else {
    // Fallback to single profile image so slider isn't empty
    const singleImageUrl = getGirlImageUrl(girl);
    if (singleImageUrl) {
      return [singleImageUrl];
    }
  }

  let safeImages = Array.isArray(rawImages) ? rawImages : [];
  safeImages = safeImages.map(formatImageUrl).filter((url) => url && typeof url === 'string' && !url.includes('placehold.co'));
  return safeImages as string[];
}
