import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get('store_id') || '1'
  const date = searchParams.get('date')

  const url = new URL('https://crm.h-mitsu.com/api/idol/schedules')
  url.searchParams.set('store_id', storeId)
  if (date) url.searchParams.set('date', date)

  const res = await fetch(url.toString(), {
    // Keep it cached briefly; schedule is time-sensitive but changes frequently.
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

  // Return raw JSON from CRM
  return new NextResponse(text, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30, stale-while-revalidate=60',
    },
  })
}

