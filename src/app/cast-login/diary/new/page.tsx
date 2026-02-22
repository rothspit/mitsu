'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BRAND_SLUG = 'hitomitsu'
const BUCKET = 'mitsu-diary'

interface Girl {
  id: string
  name: string
}

export default function DiaryNewPage() {
  const [girls, setGirls] = useState<Girl[]>([])
  const [girlId, setGirlId] = useState('')
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [brandId, setBrandId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: brand } = await supabase
        .from('brands').select('id').eq('slug', BRAND_SLUG).single()
      if (brand) {
        setBrandId(brand.id)
        const { data } = await supabase
          .from('girls').select('id, name')
          .eq('brand_id', brand.id).eq('is_active', true)
          .order('created_at', { ascending: true })
        if (data) setGirls(data)
      }
    }
    init()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!girlId || !imageFile || !brandId) {
      setError('キャストと写真は必須です')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      // Upload image
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const path = `${brandId}/${girlId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, imageFile, { contentType: imageFile.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const imageUrl = urlData.publicUrl

      // Insert record
      const { error: insertError } = await supabase.from('photo_diaries').insert({
        girl_id: girlId,
        brand_id: brandId,
        image_url: imageUrl,
        comment: comment.trim() || null,
      })
      if (insertError) throw insertError

      setDone(true)
    } catch (err: any) {
      setError(err.message || '投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-2xl mb-4">投稿完了！</p>
        <p className="text-sm text-[#78716c] mb-8">写メ日記が公開されました</p>
        <button
          onClick={() => { setDone(false); setImageFile(null); setPreview(null); setComment(''); }}
          className="px-6 py-3 bg-[#b8860b] text-white text-sm rounded-lg"
        >
          もう1枚投稿する
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917]">
      <header className="bg-white border-b border-[#b8860b]/20 px-4 py-4">
        <h1 className="text-base font-medium tracking-wider text-center">写メ日記 投稿</h1>
      </header>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Cast select */}
        <div>
          <label className="text-xs text-[#78716c] block mb-1">キャスト</label>
          <select
            value={girlId}
            onChange={(e) => setGirlId(e.target.value)}
            className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white"
          >
            <option value="">選択してください</option>
            {girls.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Photo */}
        <div>
          <label className="text-xs text-[#78716c] block mb-1">写真</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full rounded-lg aspect-square object-cover" />
              <button
                onClick={() => { setImageFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-sm"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-square border-2 border-dashed border-[#d6d3d1] rounded-lg flex flex-col items-center justify-center text-[#a8a29e] hover:border-[#b8860b]/40 transition"
            >
              <span className="text-3xl mb-2">📷</span>
              <span className="text-xs">タップして写真を選択</span>
            </button>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs text-[#78716c] block mb-1">
            コメント <span className="text-[#a8a29e]">({comment.length}/500)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="今日のひとこと..."
            rows={4}
            className="w-full border border-[#d6d3d1] rounded-lg px-3 py-2.5 text-sm bg-white resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !girlId || !imageFile}
          className="w-full py-3.5 bg-[#b8860b] text-white font-medium rounded-lg text-sm disabled:opacity-50 transition"
        >
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </main>
  )
}
