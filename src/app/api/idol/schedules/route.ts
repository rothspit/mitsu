import { NextResponse } from 'next/server'
import { resolveIdolStoreId } from '@/lib/crm/resolve-idol-store'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const store = searchParams.get('store')
  const date = searchParams.get('date')

  if (!store?.trim()) {
    return NextResponse.json({ error: 'Missing required query: store (CRM stores.code)' }, { status: 400 })
  }

  let storeId: number
  try {
    storeId = resolveIdolStoreId(store.trim())
  } catch {
    return NextResponse.json({ error: `Unknown Idol store code: ${store}` }, { status: 400 })
  }

  const url = new URL('https://crm.h-mitsu.com/api/idol/schedules')
  url.searchParams.set('store_id', String(storeId))
  if (date) url.searchParams.set('date', date)

  const res = await fetch(url.toString(), {
    next: { revalidate: 30 },
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
      'cache-control': 'public, max-age=30, stale-while-revalidate=60',
    },
  })
}
