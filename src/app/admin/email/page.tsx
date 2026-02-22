'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getGirlImageUrl } from '@/lib/brand/image-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BRAND_SLUG = 'hitomitsu'
const DOMAIN = 'post.h-mitsu.com'

interface Girl {
  id: string
  name: string
  images?: string[]
  post_email: string | null
  is_active: boolean
}

export default function MitsuEmailPage() {
  const [girls, setGirls] = useState<Girl[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: brand } = await supabase
        .from('brands').select('id').eq('slug', BRAND_SLUG).single()
      if (brand) setBrandId(brand.id)
    }
    init()
  }, [])

  const fetchGirls = useCallback(async () => {
    if (!brandId) return
    const { data } = await supabase
      .from('girls')
      .select('id, name, images, post_email, is_active')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (data) setGirls(data as Girl[])
  }, [brandId])

  useEffect(() => { fetchGirls() }, [fetchGirls])

  const issueEmail = async (girl: Girl) => {
    if (!confirm(`「${girl.name}」に post.h-mitsu.com のアドレスを発行しますか？`)) return
    const newEmail = `g${girl.id}@${DOMAIN}`
    await supabase.from('girls').update({ post_email: newEmail }).eq('id', girl.id)
    alert(`発行完了！\n${newEmail}`)
    fetchGirls()
  }

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    alert('コピーしました！')
  }

  const filteredGirls = girls.filter((g) => !search || g.name.includes(search))
  const issuedCount = girls.filter((g) => g.post_email?.endsWith(`@${DOMAIN}`)).length

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/schedule" className="text-slate-400 hover:text-white text-sm">
              &larr; スケジュール
            </Link>
            <h1 className="font-bold text-lg">人妻の蜜 メアド発行</h1>
          </div>
          <span className="text-xs text-slate-400">{issuedCount}/{girls.length}人 発行済</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-4 text-sm">
          <p className="font-bold mb-1">写メ日記 メール投稿アドレス</p>
          <p className="text-slate-300 text-xs">
            「アドレス発行」を押すと <code className="bg-slate-800 px-1 rounded">g(ID)@{DOMAIN}</code> が生成されます。
            ヘブンネットの写メ日記投稿先に登録してください。
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="キャスト名で検索..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-4 placeholder:text-slate-500"
        />

        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-400">
                <th className="p-3">キャスト</th>
                <th className="p-3">投稿アドレス</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredGirls.map((girl) => {
                const imageUrl = getGirlImageUrl(girl)
                const hasEmail = !!girl.post_email
                return (
                  <tr key={girl.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                          {imageUrl ? (
                            <img src={imageUrl} alt={girl.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">?</div>
                          )}
                        </div>
                        <span className="font-bold truncate">{girl.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {hasEmail ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-green-900/40 text-green-400 px-2 py-0.5 rounded text-xs font-mono truncate max-w-[220px]" title={girl.post_email!}>
                            {girl.post_email}
                          </span>
                          <button
                            onClick={() => copyEmail(girl.post_email!)}
                            className="text-[10px] bg-slate-600 px-2 py-0.5 rounded hover:bg-slate-500"
                          >
                            コピー
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">(未発行)</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => issueEmail(girl)}
                        className="text-xs bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-blue-500 transition"
                      >
                        {hasEmail ? '再発行' : 'アドレス発行'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredGirls.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-500">
                    キャストが見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
