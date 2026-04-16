import { NextRequest, NextResponse } from 'next/server'

// 予約データの型
interface ReservationData {
  // 必須（CRM仕様）
  store_id: number
  date: string // YYYY-MM-DD
  // Optional; empty string is treated as ASAP on CRM.
  in_time?: string
  place_type: 'home' | 'hotel' | 'meetup'
  nomination_type: 'free' | 'photo' | 'main' | 'shimei' | 'honshimei'
  course_minutes: number
  customer_phone: string

  // 任意
  place_detail?: string | null
  course_name?: string | null
  course_price?: number | null
  customer_name?: string | null
  options?: Array<{ name: string; price: number }> | null
  transport_fee?: number | null
  payment_method?: string | null
  total_price?: number | null
  cast_id?: number | string | null
  cast_name?: string | null
  notes?: string | null
  source_url?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const data: ReservationData = await request.json()

    // バリデーション
    if (
      !data.store_id ||
      !data.date ||
      !data.place_type ||
      !data.nomination_type ||
      !data.course_minutes ||
      !data.customer_phone
    ) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // 電話番号の簡易バリデーション（数字とハイフンのみ）
    const phoneRegex = /^[\d\-]{10,14}$/
    if (!phoneRegex.test(String(data.customer_phone).replace(/\s/g, ''))) {
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
      store_id: Number(data.store_id),
      date: String(data.date),
      in_time: String(data.in_time ?? ''),
      place_type: data.place_type,
      place_detail: data.place_detail ?? null,
      nomination_type: data.nomination_type,
      course_minutes: Number(data.course_minutes),
      course_name: data.course_name ?? null,
      course_price: data.course_price ?? null,
      customer_phone: String(data.customer_phone),
      customer_name: data.customer_name ?? null,
      options: data.options ?? null,
      transport_fee: data.transport_fee ?? null,
      payment_method: data.payment_method ?? null,
      total_price: data.total_price ?? null,
      cast_id: data.cast_id ?? null,
      cast_name: data.cast_name ?? null,
      notes: data.notes ?? null,
      source_url: data.source_url ?? null,
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
