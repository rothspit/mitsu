import { NextResponse } from 'next/server'
import { resolveHitodumaStoreId } from '@/lib/crm/resolve-hitoduma-store'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const store = searchParams.get('store')

  if (!store?.trim()) {
    return NextResponse.json({ error: 'Missing required query: store (CRM stores.code)' }, { status: 400 })
  }

  let storeId: number
  try {
    storeId = resolveHitodumaStoreId(store.trim())
  } catch {
    return NextResponse.json({ error: `Unknown Hitoduma store code: ${store}` }, { status: 400 })
  }

  const url = new URL('https://crm.h-mitsu.com/api/idol/casts')
  url.searchParams.set('store_id', String(storeId))

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  })

  const text = await res.text()
  if (!res.ok) {
    return NextResponse.json(
      { error: 'CRM fetch failed', status: res.status, body: text.slice(0, 500) },
      { status: 502 }
    )
  }

  return new NextResponse(text, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, stale-while-revalidate=120',
    },
  })
}
