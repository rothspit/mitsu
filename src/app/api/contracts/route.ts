import { NextRequest, NextResponse } from 'next/server'

type ContractSubmitBody = {
  signed_name: string
  document_type: string
  agreed_step_1?: boolean
  agreed_step_2?: boolean
  agreed_step_3?: boolean
  signed_at?: string
}

function getLaravelBaseUrl(): string | null {
  const base =
    process.env.LARAVEL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_LARAVEL_API_BASE_URL ||
    null
  if (!base) return null
  return base.replace(/\/+$/, '')
}

export async function POST(request: NextRequest) {
  try {
    const body: ContractSubmitBody = await request.json()

    const signedName = typeof body.signed_name === 'string' ? body.signed_name.trim() : ''
    const documentType = typeof body.document_type === 'string' ? body.document_type.trim() : ''

    if (!signedName) {
      return NextResponse.json({ error: 'signed_name は必須です' }, { status: 400 })
    }
    if (!documentType) {
      return NextResponse.json({ error: 'document_type は必須です' }, { status: 400 })
    }

    const laravelBase = getLaravelBaseUrl()
    if (!laravelBase) {
      return NextResponse.json(
        { error: 'Laravel API base URL が未設定です（LARAVEL_API_BASE_URL / NEXT_PUBLIC_LARAVEL_API_BASE_URL）' },
        { status: 500 },
      )
    }

    const url = `${laravelBase}/api/contracts`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 任意: Laravel 側が API キーを要求する場合に備えてヘッダを付ける
    const token = process.env.CONTRACT_API_TOKEN || process.env.CONTRACT_API_KEY
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...body,
        signed_name: signedName,
        document_type: documentType,
      }),
    })

    const text = await res.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }

    if (!res.ok) {
      return NextResponse.json(data ?? { error: 'Contract API failed' }, { status: res.status })
    }

    return NextResponse.json(data ?? { success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '送信に失敗しました' },
      { status: 500 },
    )
  }
}

