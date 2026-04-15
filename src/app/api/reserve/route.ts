import { NextRequest, NextResponse } from 'next/server'

// 予約データの型
interface ReservationData {
  cast: {
    id: string
    name: string
  }
  startTime: string
  phone: string
  message?: string
  sourceUrl?: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const data: ReservationData = await request.json()

    // バリデーション
    if (!data.cast?.name || !data.startTime || !data.phone) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // 電話番号の簡易バリデーション（数字とハイフンのみ）
    const phoneRegex = /^[\d\-]{10,14}$/
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: '電話番号の形式が正しくありません' },
        { status: 400 }
      )
    }

    // CRMへ転送（公式はCRMメイン運用）
    const crmUrl = process.env.CRM_RESERVE_URL
    if (!crmUrl) {
      console.warn('[reserve] CRM_RESERVE_URL is not set. Request accepted but not forwarded.')
      return NextResponse.json({
        success: true,
        message: '予約リクエストを受け付けました（転送先未設定）',
        reservationId: `RES-${Date.now()}`,
      })
    }

    const secret = process.env.CRM_RESERVE_SECRET
    const forwarded = {
      store_id: 1,
      cast_id: data.cast.id,
      cast_name: data.cast.name,
      start_time: data.startTime,
      phone: data.phone,
      message: data.message || null,
      source_url: data.sourceUrl || null,
      requested_at: data.timestamp || new Date().toISOString(),
    }

    const res = await fetch(crmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-sync-secret': secret } : {}),
      },
      body: JSON.stringify(forwarded),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[reserve] CRM forward failed:', res.status, text)
      return NextResponse.json({ error: 'CRM転送に失敗しました' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: '予約リクエストを受け付けました',
      reservationId: `RES-${Date.now()}`,
    })

  } catch (error) {
    console.error('Reservation API error:', error)
    return NextResponse.json(
      { error: '予約処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
