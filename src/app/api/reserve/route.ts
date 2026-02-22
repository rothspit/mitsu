import { NextRequest, NextResponse } from 'next/server'

// 予約データの型
interface ReservationData {
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
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const data: ReservationData = await request.json()

    // バリデーション
    if (!data.cast?.name || !data.course?.name || !data.startTime || !data.phone) {
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

    // Discord Webhook URL
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    // 料金計算
    const finalPrice = data.usePoints ? data.course.price - 2000 : data.course.price

    // Discordメッセージを構築
    const discordMessage = {
      content: '🚨 **新規予約リクエスト** 🚨',
      embeds: [
        {
          color: 0xff69b4, // ピンク色
          fields: [
            {
              name: '👸 指名',
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
            text: '※至急折り返し連絡をお願いします',
          },
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ],
    }

    // Discord Webhookが設定されている場合は送信
    if (webhookUrl) {
      const discordResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      })

      if (!discordResponse.ok) {
        console.error('Discord webhook error:', await discordResponse.text())
        // Discordエラーでも予約自体は成功扱いにする（ログは残す）
      }
    } else {
      // Webhook URLが未設定の場合はコンソールに出力（開発用）
      console.log('=== 予約リクエスト受信（Discord未設定）===')
      console.log(JSON.stringify(data, null, 2))
      console.log('Discord Message:', JSON.stringify(discordMessage, null, 2))
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
