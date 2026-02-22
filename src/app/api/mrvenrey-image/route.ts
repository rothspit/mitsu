import { NextRequest, NextResponse } from 'next/server'

const MRVENREY_API = 'https://webapi2.mrvenrey.jp'
const MRVENREY_BLOB = 'https://mrvenreyweb.blob.core.windows.net'

// SAS トークンをキャッシュ（有効期限内は再利用）
let cachedSAS: { token: string; expiresAt: number } | null = null

async function getMrVenreyToken(): Promise<string> {
  const res = await fetch(`${MRVENREY_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(process.env.MRVENREY_ID!)}&password=${encodeURIComponent(process.env.MRVENREY_PASS!)}`,
  })
  if (!res.ok) throw new Error(`MrVenrey login failed (${res.status})`)
  const data = await res.json()
  return data.access_token
}

async function getGirlSAS(): Promise<string> {
  // キャッシュが有効なら再利用（50分間）
  if (cachedSAS && Date.now() < cachedSAS.expiresAt) {
    return cachedSAS.token
  }

  const token = await getMrVenreyToken()
  const res = await fetch(`${MRVENREY_API}/api/blobsasses`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`blobsasses failed (${res.status})`)
  const data = await res.json()
  const sas = data.GirlSAS || data.girlSAS || data.girlsas || ''

  // 50分キャッシュ
  cachedSAS = { token: sas, expiresAt: Date.now() + 50 * 60 * 1000 }
  return sas
}

// GET /api/mrvenrey-image?id={GUID}
export async function GET(req: NextRequest) {
  const guid = req.nextUrl.searchParams.get('id')
  if (!guid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guid)) {
    return NextResponse.json({ error: 'Invalid or missing id parameter' }, { status: 400 })
  }

  try {
    const sas = await getGirlSAS()
    const blobUrl = `${MRVENREY_BLOB}/${process.env.MRVENREY_ID}/image/girls/${guid}/600_800.jpg`
    const separator = sas.startsWith('?') ? '' : '?'
    const fetchUrl = `${blobUrl}${separator}${sas}`

    const res = await fetch(fetchUrl)
    if (!res.ok) {
      return NextResponse.json({ error: `Image fetch failed (${res.status})` }, { status: 502 })
    }

    const imageBuffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err: any) {
    console.error('[mrvenrey-image]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
