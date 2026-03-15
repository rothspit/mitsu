'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getGirlImageUrl } from '@/lib/brand/image-utils'

// --- Types ---
interface Girl {
  id: string
  name: string
  images?: string[]
  is_active: boolean
  [key: string]: unknown
}

interface Area {
  id: string
  name: string
  slug?: string
  sort_order: number
}

interface ScheduleRow {
  id: string
  girl_id: string
  date: string
  start_time: string | null
  end_time: string | null
  status: 'working' | 'off' | 'unset'
  comment: string | null
  area_id: string | null
  brand_id: string
}

interface EditForm {
  status: 'working' | 'off' | 'unset'
  start_time: string
  end_time: string
  comment: string
  area_ids: Set<string>
}

// --- Helpers ---
function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// JST today string (safe on both server UTC and browser JST)
function toJSTDate(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)
}

// Local Date → YYYY-MM-DD (browser runs in JST)
function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayLabel(d: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[d.getDay()]
}

// 10:00〜翌06:00（30分刻み）
const TIME_OPTIONS: { value: string; label: string }[] = []
for (let i = 0; i <= 40; i++) {
  const totalMinutes = 10 * 60 + i * 30 // start from 10:00
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const prefix = totalMinutes >= 24 * 60 ? '翌' : ''
  TIME_OPTIONS.push({ value, label: `${prefix}${value}` })
}

function formatTimeDisplay(t: string | null | undefined): string {
  if (!t) return ''
  const hh = t.slice(0, 5)
  const h = parseInt(hh.slice(0, 2), 10)
  return h < 7 ? `翌${hh}` : hh
}

const BRAND_ID = 'hitomitsu'

export default function MitsuSchedulePage() {
  const [girls, setGirls] = useState<Girl[]>([])
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [editingCell, setEditingCell] = useState<{ girlId: string; date: string } | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    status: 'unset',
    start_time: '10:00',
    end_time: '03:00',
    comment: '',
    area_ids: new Set(),
  })
  const [saving, setSaving] = useState(false)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showWorkingOnly, setShowWorkingOnly] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkDate, setBulkDate] = useState(toJSTDate)
  const [bulkStartTime, setBulkStartTime] = useState('10:00')
  const [bulkEndTime, setBulkEndTime] = useState('03:00')
  const [bulkAreaIds, setBulkAreaIds] = useState<Set<string>>(new Set())
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  // Resolve brand UUID from slug
  useEffect(() => {
    const resolve = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id')
        .eq('slug', BRAND_ID)
        .single()
      if (data) setBrandId(data.id)
    }
    resolve()
  }, [])

  // Week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = toJSTDate()

  // Fetch girls
  useEffect(() => {
    if (!brandId) return
    const fetch = async () => {
      const { data } = await supabase
        .from('girls')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (data) setGirls(data)
    }
    fetch()
  }, [brandId])

  // Fetch areas
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('areas')
        .select('id, name, slug, sort_order')
        .in('slug', ['nishifunabashi', 'kasai', 'kinshicho'])
        .order('sort_order', { ascending: true })
      if (data) setAreas(data)
    }
    fetch()
  }, [])

  // Fetch schedules for the week
  const fetchSchedules = useCallback(async () => {
    if (!brandId) return
    const startStr = formatDate(weekStart)
    const endStr = formatDate(addDays(weekStart, 6))
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('brand_id', brandId)
      .gte('date', startStr)
      .lte('date', endStr)
    if (data) setSchedules(data)
  }, [brandId, weekStart])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // Navigation
  const goToday = () => setWeekStart(getMonday(new Date()))
  const goPrev = () => setWeekStart(addDays(weekStart, -7))
  const goNext = () => setWeekStart(addDays(weekStart, 7))

  // Get all schedule rows for a specific girl+date
  const getSchedules = (girlId: string, date: string): ScheduleRow[] => {
    return schedules.filter((s) => s.girl_id === girlId && s.date === date)
  }

  // Open cell editor
  const openEditor = (girlId: string, date: string) => {
    const existing = getSchedules(girlId, date)
    const first = existing[0]
    setEditForm({
      status: (first?.status as EditForm['status']) || 'unset',
      start_time: first?.start_time?.slice(0, 5) || '10:00',
      end_time: first?.end_time?.slice(0, 5) || '03:00',
      comment: first?.comment || '',
      area_ids: new Set(existing.map((s) => s.area_id).filter(Boolean) as string[]),
    })
    setEditingCell({ girlId, date })
  }

  // Save
  const handleSave = async () => {
    if (!editingCell || !brandId) return
    setSaving(true)
    try {
      const existing = getSchedules(editingCell.girlId, editingCell.date)

      if (editForm.status === 'working' && editForm.area_ids.size > 0) {
        // Upsert rows for each selected area
        const payloads = Array.from(editForm.area_ids).map((areaId) => ({
          girl_id: editingCell.girlId,
          date: editingCell.date,
          brand_id: brandId,
          status: editForm.status,
          start_time: editForm.start_time,
          end_time: editForm.end_time,
          comment: editForm.comment || null,
          area_id: areaId,
        }))
        await supabase.from('schedules').upsert(payloads, { onConflict: 'girl_id,date,area_id' })
        // Delete rows for deselected areas
        const toDelete = existing.filter((s) => s.area_id && !editForm.area_ids.has(s.area_id))
        if (toDelete.length > 0) {
          await supabase.from('schedules').delete().in('id', toDelete.map((s) => s.id))
        }
      } else {
        // Off / unset / working with no area: replace all with one row
        if (existing.length > 0) {
          await supabase.from('schedules').delete().in('id', existing.map((s) => s.id))
        }
        if (editForm.status !== 'unset') {
          await supabase.from('schedules').insert({
            girl_id: editingCell.girlId,
            date: editingCell.date,
            brand_id: brandId,
            status: editForm.status,
            start_time: editForm.status === 'working' ? editForm.start_time : null,
            end_time: editForm.status === 'working' ? editForm.end_time : null,
            comment: editForm.comment || null,
            area_id: null,
          })
        }
      }

      await fetchSchedules()
      setEditingCell(null)
    } finally {
      setSaving(false)
    }
  }

  // Delete (reset to no record)
  const handleDelete = async () => {
    if (!editingCell) return
    const existing = getSchedules(editingCell.girlId, editingCell.date)
    if (existing.length > 0) {
      await supabase.from('schedules').delete().in('id', existing.map((s) => s.id))
      await fetchSchedules()
    }
    setEditingCell(null)
  }

  // Bulk register
  const handleBulkSave = async () => {
    if (!brandId || bulkSelected.size === 0 || bulkAreaIds.size === 0) return
    setBulkSaving(true)
    try {
      const payloads = Array.from(bulkSelected).flatMap((girlId) =>
        Array.from(bulkAreaIds).map((areaId) => ({
          girl_id: girlId,
          date: bulkDate,
          brand_id: brandId,
          status: 'working' as const,
          start_time: bulkStartTime,
          end_time: bulkEndTime,
          area_id: areaId,
          comment: null,
        }))
      )
      await supabase.from('schedules').upsert(payloads, { onConflict: 'girl_id,date,area_id' })
      await fetchSchedules()
      setShowBulk(false)
      setBulkSelected(new Set())
    } finally {
      setBulkSaving(false)
    }
  }

  const toggleBulkGirl = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkFilteredGirls = girls.filter((g) =>
    !bulkSearch || g.name.includes(bulkSearch)
  )

  // Area name lookup
  const areaName = (areaId: string | null): string | null => {
    if (!areaId) return null
    return areas.find((a) => a.id === areaId)?.name || null
  }

  // Filter girls
  const girlIdsWithWorking = new Set(
    schedules.filter((s) => s.status === 'working').map((s) => s.girl_id)
  )
  const filteredGirls = girls.filter((g) => {
    if (searchQuery && !g.name.includes(searchQuery)) return false
    if (showWorkingOnly && !girlIdsWithWorking.has(g.id)) return false
    return true
  })

  // Week label
  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}〜${addDays(weekStart, 6).getMonth() + 1}/${addDays(weekStart, 6).getDate()}`

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-white text-sm">
              &larr; /admin
            </Link>
            <h1 className="font-bold text-lg">
              <span className="hidden sm:inline">人妻の蜜 </span>スケジュール管理
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkDate(toJSTDate()); setBulkAreaIds(new Set()); setBulkSelected(new Set()); setBulkSearch(''); setShowBulk(true) }}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded font-bold"
            >
              一括登録
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded font-bold"
            >
              今日
            </button>
            <button
              onClick={goPrev}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded"
            >
              &lt;
            </button>
            <span className="text-sm font-bold min-w-[120px] text-center">{weekLabel}</span>
            <button
              onClick={goNext}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded"
            >
              &gt;
            </button>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-1 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="キャスト名で検索..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-48 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
        />
        <button
          onClick={() => setShowWorkingOnly(!showWorkingOnly)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            showWorkingOnly
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          出勤ありのみ
        </button>
        <span className="text-xs text-slate-500 ml-auto">
          {filteredGirls.length}/{girls.length}人表示
        </span>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-2 py-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-slate-800 w-[120px] min-w-[120px] p-2 text-left text-xs text-slate-400 border-b border-slate-700">
                  キャスト
                </th>
                {weekDates.map((d) => {
                  const dateStr = formatDate(d)
                  const isToday = dateStr === today
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  const workingCount = new Set(schedules.filter((s) => s.date === dateStr && s.status === 'working').map((s) => s.girl_id)).size
                  return (
                    <th
                      key={dateStr}
                      className={`min-w-[90px] p-2 text-center text-xs border-b border-slate-700 ${
                        isToday ? 'bg-slate-700/50' : 'bg-slate-800'
                      } ${isWeekend ? 'text-red-400' : 'text-slate-400'}`}
                    >
                      <div className={`font-bold ${isToday ? 'text-yellow-400' : ''}`}>
                        {dayLabel(d)} {d.getMonth() + 1}/{d.getDate()}
                      </div>
                      {workingCount > 0 && (
                        <div className="text-[10px] text-green-400 mt-0.5">{workingCount}人</div>
                      )}
                      {isToday && <div className="text-[9px] text-yellow-400 mt-0.5">TODAY</div>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filteredGirls.map((girl) => {
                const imageUrl = getGirlImageUrl(girl)
                return (
                  <tr key={girl.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="sticky left-0 z-10 bg-slate-900 p-2 w-[120px] min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                          {imageUrl ? (
                            <img src={imageUrl} alt={girl.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">?</div>
                          )}
                        </div>
                        <span className="text-xs font-bold truncate">{girl.name}</span>
                      </div>
                    </td>
                    {weekDates.map((d) => {
                      const dateStr = formatDate(d)
                      const isToday = dateStr === today
                      const scheds = getSchedules(girl.id, dateStr)
                      const workingScheds = scheds.filter((s) => s.status === 'working')
                      const hasOff = scheds.some((s) => s.status === 'off')

                      let cellBg = ''
                      let content = <span className="text-slate-600">—</span>
                      if (workingScheds.length > 0) {
                        cellBg = 'bg-green-900/30'
                        const first = workingScheds[0]
                        content = (
                          <div className="text-[11px]">
                            <div className="text-green-400 font-bold">
                              {formatTimeDisplay(first.start_time)}-{formatTimeDisplay(first.end_time)}
                            </div>
                            <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
                              {workingScheds.map((s) => {
                                const area = areaName(s.area_id)
                                return area ? (
                                  <span key={s.id} className="inline-block px-1.5 py-0.5 bg-blue-900/40 text-blue-300 text-[9px] rounded">
                                    {area}
                                  </span>
                                ) : null
                              })}
                            </div>
                            {first.comment && (
                              <div className="text-slate-400 text-[9px] mt-0.5 truncate max-w-[80px]">
                                {first.comment}
                              </div>
                            )}
                          </div>
                        )
                      } else if (hasOff) {
                        cellBg = 'bg-red-900/20'
                        content = <span className="text-red-400 text-xs font-bold">休</span>
                      }

                      return (
                        <td
                          key={dateStr}
                          onClick={() => openEditor(girl.id, dateStr)}
                          className={`p-1.5 text-center cursor-pointer transition-colors hover:bg-slate-700/50 border-x border-slate-800/50 ${cellBg} ${
                            isToday ? 'bg-slate-700/30' : ''
                          }`}
                        >
                          {content}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {filteredGirls.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-500">
                    キャストが見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCell(null) }}
        >
          <div className="bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Modal header */}
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">
                  {girls.find((g) => g.id === editingCell.girlId)?.name || '—'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{editingCell.date}</p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status buttons */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                  ステータス
                </label>
                <div className="flex gap-2">
                  {([
                    { value: 'working', label: '出勤', color: 'bg-green-600 hover:bg-green-500' },
                    { value: 'off', label: '休み', color: 'bg-red-600 hover:bg-red-500' },
                    { value: 'unset', label: '未設定', color: 'bg-slate-600 hover:bg-slate-500' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEditForm({ ...editForm, status: opt.value })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                        editForm.status === opt.value
                          ? opt.color + ' text-white ring-2 ring-white/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & area (only when working) */}
              {editForm.status === 'working' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                        開始時間
                      </label>
                      <select
                        value={editForm.start_time}
                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                        終了時間
                      </label>
                      <select
                        value={editForm.end_time}
                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                      エリア
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {areas.map((a) => {
                        const checked = editForm.area_ids.has(a.id)
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              const next = new Set(editForm.area_ids)
                              if (checked) next.delete(a.id)
                              else next.add(a.id)
                              setEditForm({ ...editForm, area_ids: next })
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              checked
                                ? 'bg-blue-600 text-white ring-1 ring-blue-400/50'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            {a.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Comment */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  コメント
                </label>
                <input
                  type="text"
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  placeholder="備考を入力..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 text-xs text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg hover:bg-red-900/40 transition"
                >
                  削除
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setEditingCell(null)}
                  className="px-4 py-2.5 text-xs text-slate-400 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Register Modal */}
      {showBulk && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBulk(false) }}
        >
          <div className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <p className="font-bold text-sm">一括登録</p>
              <button
                onClick={() => setShowBulk(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Date */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">日付</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">開始時間</label>
                  <select
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">終了時間</label>
                  <select
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">エリア</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {areas.map((a) => {
                    const checked = bulkAreaIds.has(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setBulkAreaIds((prev) => {
                            const next = new Set(prev)
                            if (checked) next.delete(a.id)
                            else next.add(a.id)
                            return next
                          })
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                          checked
                            ? 'bg-blue-600 text-white ring-1 ring-blue-400/50'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {a.name}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ids = areas.filter((a) => a.slug === 'nishifunabashi' || a.slug === 'kasai').map((a) => a.id)
                      setBulkAreaIds(new Set(ids))
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300"
                  >
                    西船橋+葛西
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAreaIds(new Set(areas.map((a) => a.id)))}
                    className="text-[10px] text-blue-400 hover:text-blue-300"
                  >
                    全エリア
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAreaIds(new Set())}
                    className="text-[10px] text-slate-400 hover:text-slate-300"
                  >
                    クリア
                  </button>
                </div>
              </div>

              {/* Cast selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">
                    キャスト選択（{bulkSelected.size}人）
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkSelected(new Set(bulkFilteredGirls.map((g) => g.id)))}
                      className="text-[10px] text-blue-400 hover:text-blue-300"
                    >
                      全選択
                    </button>
                    <button
                      onClick={() => setBulkSelected(new Set())}
                      className="text-[10px] text-slate-400 hover:text-slate-300"
                    >
                      全解除
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  placeholder="名前で絞り込み..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm mb-2 placeholder:text-slate-500"
                />
                <div className="max-h-52 overflow-y-auto space-y-0.5 bg-slate-900 rounded-lg border border-slate-700 p-1">
                  {bulkFilteredGirls.map((g) => (
                    <label
                      key={g.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition text-sm ${
                        bulkSelected.has(g.id) ? 'bg-green-900/30' : 'hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(g.id)}
                        onChange={() => toggleBulkGirl(g.id)}
                        className="accent-green-500"
                      />
                      <span className="truncate">{g.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-700 flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowBulk(false)}
                className="px-4 py-2.5 text-xs text-slate-400 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                キャンセル
              </button>
              <div className="flex-1" />
              <button
                onClick={handleBulkSave}
                disabled={bulkSaving || bulkSelected.size === 0 || bulkAreaIds.size === 0}
                className="px-6 py-2.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
              >
                {bulkSaving ? '登録中...' : `${bulkSelected.size}人 × ${bulkAreaIds.size}エリア 一括登録`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
