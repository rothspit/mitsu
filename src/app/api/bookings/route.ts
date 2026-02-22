import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 予約作成リクエストの型
interface CreateBookingRequest {
  cast: {
    id: string
    name: string
  }
  course: {
    name: string
    time: string
    price: number
  }
  startTime: string
  phone: string
  usePoints: boolean
}

// POST: 新規予約作成
export async function POST(request: NextRequest) {
  try {
    const data: CreateBookingRequest = await request.json()

    // バリデーション
    if (!data.cast?.name || !data.startTime || !data.phone) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // コース時間を分に変換（例: "90分" -> 90）
    const courseMinutes = parseInt(data.course.time.replace(/[^0-9]/g, '')) || 60

    // Supabaseに予約を保存
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_name: data.cast.name,
        cast_id: data.cast.id,
        course_name: data.course.name,
        course_minutes: courseMinutes,
        course_price: data.course.price,
        requested_time: data.startTime,
        phone_number: data.phone,
        use_points: data.usePoints,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました' },
        { status: 500 }
      )
    }

    // Discord Webhook通知
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://idolgakuen.jp'

    // 料金計算
    const finalPrice = data.usePoints ? data.course.price - 2000 : data.course.price

    // Discord メッセージ構築
    const discordMessage = {
      content: '🚨 **新規予約リクエスト** 🚨',
      embeds: [
        {
          color: 0xff69b4,
          title: `予約ID: ${booking.id.slice(0, 8)}`,
          fields: [
            {
              name: '👸 指名キャスト',
              value: data.cast.name,
              inline: true,
            },
            {
              name: '⏱ コース',
              value: `${data.course.name}（${data.course.time}）`,
              inline: true,
            },
            {
              name: '🕐 希望時間',
              value: data.startTime,
              inline: true,
            },
            {
              name: '📞 電話番号',
              value: data.phone,
              inline: true,
            },
            {
              name: '💰 料金',
              value: `¥${finalPrice.toLocaleString()}${data.usePoints ? ' (2,000pt利用)' : ''}`,
              inline: true,
            },
          ],
          footer: {
            text: '⬇️ 管理画面で確認・操作してください',
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: '📋 管理画面を開く',
              url: `${baseUrl}/admin/bookings/${booking.id}`,
            },
          ],
        },
      ],
    }

    // Discord送信
    if (webhookUrl) {
      try {
        const discordResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordMessage),
        })
        if (!discordResponse.ok) {
          console.error('Discord webhook error:', await discordResponse.text())
        }
      } catch (e) {
        console.error('Discord send error:', e)
      }
    } else {
      console.log('=== Discord通知（Webhook未設定）===')
      console.log(JSON.stringify(discordMessage, null, 2))
    }

    return NextResponse.json({
      success: true,
      message: '予約リクエストを受け付けました',
      bookingId: booking.id,
    })

  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: '予約処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// GET: 予約一覧取得（管理用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error('GET bookings error:', error)
    return NextResponse.json(
      { error: '予約一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}
