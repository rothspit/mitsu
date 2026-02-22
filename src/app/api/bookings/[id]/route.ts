import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: 予約詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('GET booking error:', error)
    return NextResponse.json(
      { error: '予約の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH: 予約ステータス更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { status, proposal_data, notes } = body

    // 更新データ構築
    const updateData: Record<string, any> = {}

    if (status) {
      updateData.status = status
    }

    if (proposal_data) {
      updateData.proposal_data = {
        ...proposal_data,
        proposed_at: new Date().toISOString(),
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update booking error:', error)
      return NextResponse.json(
        { error: 'ステータス更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking,
    })

  } catch (error) {
    console.error('PATCH booking error:', error)
    return NextResponse.json(
      { error: '更新処理に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 予約削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: '削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('DELETE booking error:', error)
    return NextResponse.json(
      { error: '削除処理に失敗しました' },
      { status: 500 }
    )
  }
}
