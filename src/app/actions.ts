'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function updateDiary(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  // データベースを更新
  const { error } = await supabase
    .from('diaries')
    .update({
      title,
      content,
    })
    .eq('id', id)

  if (error) {
    console.error('更新エラー:', error)
    return
  }

  // 管理画面の一覧データを最新にする（タイトル変更などが反映されるように）
  revalidatePath('/admin')

  // 「一覧画面」に戻す（これで次の編集にすぐ行けます！）
  redirect('/admin')
}

export async function postReview(formData: FormData) {
  const girl_id = formData.get('girl_id') as string
  const nickname = formData.get('nickname') as string || '名無し様'
  const title = formData.get('title') as string || '無題'
  const rating = parseInt(formData.get('rating') as string)
  const content = formData.get('content') as string

  if (!content) return { error: '本文を入力してください' }

  // データベースに保存
  const { error } = await supabase.from('reviews').insert({
    girl_id: parseInt(girl_id),
    nickname,
    title,
    rating,
    content,
    is_approved: true // 自動で承認済みにする（これがないと表示されないかも）
  })

  if (error) {
    console.error(error)
    return { error: '投稿に失敗しました' }
  }

  revalidatePath(`/girls/${girl_id}`)
  return { success: true }
}
