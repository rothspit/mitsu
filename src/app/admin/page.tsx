import Link from 'next/link'

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-8">管理メニュー</h1>
        <div className="space-y-3">
          <Link
            href="/admin/schedule"
            className="block w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 hover:bg-slate-700 transition"
          >
            <div className="font-bold text-lg">スケジュール管理</div>
            <div className="text-sm text-slate-400 mt-1">出勤スケジュールの登録・編集</div>
          </Link>
          <Link
            href="/admin/email"
            className="block w-full bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 hover:bg-slate-700 transition"
          >
            <div className="font-bold text-lg">メール管理</div>
            <div className="text-sm text-slate-400 mt-1">メールの確認・管理</div>
          </Link>
        </div>
      </div>
    </main>
  )
}
