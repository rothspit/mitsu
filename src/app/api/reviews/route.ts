import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const girlId = request.nextUrl.searchParams.get('girl_id')
  if (!girlId) {
    return NextResponse.json({ error: 'girl_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id, nickname, rating, title, content, created_at')
    .eq('girl_id', girlId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ reviews: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { girl_id, nickname, rating, title, content } = body

  if (!girl_id || !nickname || !rating || !content) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: '評価は1〜5で指定してください' }, { status: 400 })
  }
  if (nickname.length > 50) {
    return NextResponse.json({ error: 'ニックネームは50文字以内で入力してください' }, { status: 400 })
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: '口コミは2000文字以内で入力してください' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      girl_id,
      nickname,
      rating,
      title: title || null,
      content,
      is_approved: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, message: '口コミを投稿しました。承認後に表示されます。' })
}
