import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { simpleParser } from 'mailparser'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STORAGE_BUCKET = 'mitsu-diary'

export async function POST(request: Request) {
  console.log("📨 Webhook [h-mitsu]: 起動")

  try {
    const bodyText = await request.text()
    let body
    try {
      body = JSON.parse(bodyText)
    } catch (e) {
      return NextResponse.json({ status: 'Not JSON' })
    }

    // SNS SubscriptionConfirmation
    if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
      console.log("🤝 [h-mitsu] AWS承認リクエストを許可します")
      await fetch(body.SubscribeURL)
      return NextResponse.json({ success: true })
    }

    // Notification
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message)
      const messageId = message.mail.messageId
      console.log(`📦 [h-mitsu] S3からメールを取得します。ID: ${messageId}`)

      // 1. S3から生データを取得
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME_MITSU || process.env.S3_BUCKET_NAME,
        Key: messageId,
      })
      const s3Response = await s3.send(getCommand)
      const rawBody = await s3Response.Body?.transformToByteArray()

      if (!rawBody) {
        console.error("❌ [h-mitsu] S3からメールの中身が取れませんでした")
        return NextResponse.json({ error: 'S3 Empty' })
      }

      // 2. 解析
      const parsed = await simpleParser(Buffer.from(rawBody))

      const subject = parsed.subject || '無題'
      const text = parsed.text || ''

      // 3. 画像と動画を分別
      const attachments = parsed.attachments || []
      const imageFiles = attachments.filter(a => a.contentType.startsWith('image/'))
      const videoFiles = attachments.filter(a => a.contentType.startsWith('video/'))

      console.log(`📝 [h-mitsu] 解析完了: 件名「${subject}」 / 画像${imageFiles.length}枚 / 動画${videoFiles.length}本`)

      // 宛先(TO)から girl_id を抽出: g{girl_id}@post.h-mitsu.com
      const recipients: string[] = message.mail.destination || []
      const toAddress = recipients.find((addr: string) => addr.endsWith('@post.h-mitsu.com')) || ''
      const girlIdMatch = toAddress.match(/^g(.+)@post\.h-mitsu\.com$/)

      if (!girlIdMatch) {
        console.log(`⚠️ [h-mitsu] 宛先からgirl_idを抽出できません: ${recipients.join(', ')}`)
        return NextResponse.json({ success: true, message: 'No matching recipient' })
      }

      const girlId = girlIdMatch[1]
      console.log(`👤 [h-mitsu] girl_id: ${girlId} (宛先: ${toAddress})`)

      const { data: girl } = await supabase
        .from('girls')
        .select('id, brand_id')
        .eq('id', girlId)
        .eq('brand_id', 'a1876a1a-1b51-4970-b25e-893ce0910690')
        .single()

      if (!girl) {
        console.log(`⚠️ [h-mitsu] girl_id=${girlId} が見つかりません`)
        return NextResponse.json({ success: true, message: 'Girl not found' })
      }

      // 4. ファイルアップロード
      const uploadFiles = async (files: typeof attachments) => {
        const urls: string[] = []
        for (const file of files) {
          const fileName = `${girl.id}/${Date.now()}-${file.filename || 'file'}`

          const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file.content, { contentType: file.contentType })

          if (!error) {
            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
            urls.push(data.publicUrl)
          } else {
            console.error("❌ [h-mitsu] アップロード失敗:", error)
          }
        }
        return urls
      }

      // サムネイル生成（画像のみ）
      const generateThumbnails = async (files: typeof attachments) => {
        const thumbUrls: string[] = []
        for (const file of files) {
          try {
            const thumbBuffer = await sharp(file.content)
              .resize(600, 800, { fit: 'cover' })
              .jpeg({ quality: 85 })
              .toBuffer()

            const thumbName = `${girl.id}/${Date.now()}-thumb-${file.filename || 'file'}.jpg`
            const { error } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(thumbName, thumbBuffer, { contentType: 'image/jpeg' })

            if (!error) {
              const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(thumbName)
              thumbUrls.push(data.publicUrl)
            } else {
              console.error("❌ [h-mitsu] サムネイルアップロード失敗:", error)
            }
          } catch (e) {
            console.error("❌ [h-mitsu] サムネイル生成失敗:", e)
          }
        }
        return thumbUrls
      }

      const imageUrls = await uploadFiles(imageFiles)
      const thumbUrls = await generateThumbnails(imageFiles)
      const videoUrls = await uploadFiles(videoFiles)

      // 5. データベースに保存
      const { error: insertError } = await supabase
        .from('diaries')
        .insert({
          girl_id: girl.id,
          brand_id: 'a1876a1a-1b51-4970-b25e-893ce0910690',
          title: subject,
          content: text,
          image_url: imageUrls[0] || null,
          thumbnail_url: thumbUrls[0] || null,
          videos: videoUrls.join(','),
          published_at: new Date().toISOString(),
          is_published: true,
        })

      if (insertError) {
        console.error("❌ [h-mitsu] DB保存エラー:", insertError)
      } else {
        console.log("✅ [h-mitsu] 日記の投稿に成功しました！")
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("❌ [h-mitsu] 全体エラー:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
