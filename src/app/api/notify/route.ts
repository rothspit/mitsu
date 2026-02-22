import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { message, sessionId } = await request.json()

    // 1. 送信設定（ここはこのまま）
    // ※先ほどのパスワードは infoアカウントで発行されたものなので、
    // 送信元(user)を変えるとエラーになってしまうため、ここは info のままにします。
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'order.mitsu@gmail.com',
        pass: 'xdbc qfzw bfmx qrpf',
      },
    })

    // 2. メールの内容（宛先を変更！）
    const mailOptions = {
      from: 'アイドル学園Web通知 <order.mitsu@gmail.com>',

      // ここをご希望のアドレスに変更しました！
      // お客様からのチャットは、このメールアドレスに届きます。
      to: 'order.mitsu@gmail.com',

      subject: '【チャット着信】お客様からメッセージが届きました',
      text: `
ウェブサイトから新しいチャットメッセージが届きました。

--------------------------------------------------
【メッセージ内容】
${message}
--------------------------------------------------

管理画面から返信してください：
https://idolgakuen.jp/admin

(※このメールは送信専用です)
      `,
    }

    // 3. 送信実行
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('メール送信エラー:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
