'use client'

import { useMemo, useState } from 'react'

type WizardStep = 0 | 1 | 2

type SubmitPayload = {
  signed_name: string
  document_type: string
  agreed_step_1: boolean
  agreed_step_2: boolean
  agreed_step_3: boolean
  signed_at: string
}

const DOCUMENT_TYPE = 'cast_entry_econtract'

const AGREEMENT_STEP_1_TEXT = `【Step 1】資格と基本ルール
- 私は18歳以上であり、本人確認のため正確な情報を提供します。
- サイトの利用および本契約に関して、法令違反に該当する行為（例：本番行為等）を行いません。
- 依頼・指示・運営ルールに従い、円滑な運営を妨げないように行動します。`

const AGREEMENT_STEP_2_TEXT = `【Step 2】トラブル防止と違約金
- 引き抜き・勧誘・横流し等の禁止（当社/運営への背信行為の禁止）
- 個人情報・連絡先・内部情報等の情報漏洩の禁止
- 重大な規約違反・背信行為・その他の不正行為が確認された場合、違約金および損害賠償の対象となることに同意します。
※違約金額・損害賠償の範囲は契約書記載のとおりです。`

const AGREEMENT_STEP_3_TEXT = `【Step 3】最終確認と電子署名
- ここまでの内容を最終的に確認したうえで、同意します。
- 戸籍上の本名（フルネーム）を署名として入力します。
- 本ボタンによる送信は、電子署名（同意の意思表示）として取り扱われます。`

const GUARANTEE_TEXT = `【保証規程】
当社は、キャストの業務遂行に関して、法令・契約・運営規約に基づき保証規程を定めています。

1) 遵守義務
  キャストは契約内容および保証規程を誠実に遵守するものとします。

2) 免責・適用範囲
  保証は契約および保証規程の定める範囲に限られ、対象外の場合があります。

3) 重大な違反時の取扱い
  重大な規約違反や背信行為が確認された場合、契約の解除や損害賠償の対象となることがあります。

4) 最終版の確認
  本文はUI上での要約表示です。正式な保証規程は契約書の定めを優先します。`

function StepBadge({ step, current }: { step: WizardStep; current: WizardStep }) {
  const isDone = step < current
  const isActive = step === current
  return (
    <div
      className={[
        'w-8 h-8 rounded-full flex items-center justify-center border text-[12px] font-bold',
        isActive ? 'bg-[#b8860b] text-white border-[#b8860b]' : '',
        isDone ? 'bg-green-500/10 text-green-700 border-green-500/30' : '',
        !isActive && !isDone ? 'bg-white text-[#78716c] border-[#e7e5e4]' : '',
      ].join(' ')}
    >
      {step + 1}
    </div>
  )
}

export default function ContractWizard() {
  const [step, setStep] = useState<WizardStep>(0)
  const [agreed1, setAgreed1] = useState(false)
  const [agreed2, setAgreed2] = useState(false)
  const [agreed3, setAgreed3] = useState(false)
  const [signedName, setSignedName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  const trimmedSignedName = useMemo(() => signedName.trim(), [signedName])

  const canNext = useMemo(() => {
    if (step === 0) return agreed1
    if (step === 1) return agreed2
    return agreed3 && trimmedSignedName.length > 0
  }, [agreed1, agreed2, agreed3, step, trimmedSignedName])

  const submitPayload: SubmitPayload = useMemo(
    () => ({
      signed_name: trimmedSignedName,
      document_type: DOCUMENT_TYPE,
      agreed_step_1: agreed1,
      agreed_step_2: agreed2,
      agreed_step_3: agreed3,
      signed_at: new Date().toISOString(),
    }),
    [agreed1, agreed2, agreed3, trimmedSignedName],
  )

  const goNext = () => {
    setSubmitError(null)
    if (!canNext) return
    setStep((s) => (s < 2 ? ((s + 1) as WizardStep) : s))
  }

  const goBack = () => {
    setSubmitError(null)
    setStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s))
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!canNext || trimmedSignedName.length === 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Request failed (${res.status})`)
      }

      setCompleted(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '送信に失敗しました。再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  if (completed) {
    return (
      <main className="min-h-screen bg-[#fafaf9] text-[#1c1917]">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 text-green-700 border border-green-500/30 mb-4">
              ✓
            </div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              契約が完了しました
            </h1>
            <p className="text-sm text-[#78716c] mt-2">
              入店手続き（電子契約）の送信が完了しました。
            </p>
          </div>

          <section className="rounded-xl border border-[#e7e5e4] bg-white p-4 mb-6">
            <h2 className="font-bold mb-3 text-[#1c1917]">同意内容</h2>
            <div className="text-sm text-[#44403c] leading-relaxed space-y-3">
              <div>・Step 1：{agreed1 ? '同意済み' : '未同意'}</div>
              <div>・Step 2：{agreed2 ? '同意済み' : '未同意'}</div>
              <div>・Step 3：{agreed3 ? '同意済み' : '未同意'}</div>
              <div>・署名（戸籍上の本名）：{trimmedSignedName}</div>
            </div>

            <div className="mt-4 rounded-lg border border-[#e7e5e4] bg-[#fafaf9] p-3 max-h-72 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
                {AGREEMENT_STEP_1_TEXT}
              </pre>
              <div className="h-px bg-[#e7e5e4] my-3" />
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
                {AGREEMENT_STEP_2_TEXT}
              </pre>
              <div className="h-px bg-[#e7e5e4] my-3" />
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
                {AGREEMENT_STEP_3_TEXT}
              </pre>
            </div>
          </section>

          <section className="rounded-xl border border-[#e7e5e4] bg-white p-4 mb-6">
            <h2 className="font-bold mb-3 text-[#1c1917]">保証規程</h2>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
              {GUARANTEE_TEXT}
            </pre>
          </section>

          <section className="rounded-xl border border-[#b8860b]/40 bg-[#fffaf0] p-4 text-center mb-10">
            <div className="text-[#b8860b] text-xs tracking-[0.2em] mb-2">IMPORTANT</div>
            <p className="text-2xl font-extrabold text-[#1c1917]" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              この画面をスクリーンショットで保存してください
            </p>
            <p className="text-sm text-[#78716c] mt-3">
              保存が必要な場合があります。後から確認できるようにお願いします。
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fafaf9] text-[#1c1917]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            入店手続き（電子契約）ウィザード
          </h1>
          <p className="text-sm text-[#78716c] mt-2">
            ステップに従って同意し、最後に電子署名を行ってください。
          </p>
        </div>

        <div className="flex items-center justify-between mb-8 gap-3">
          <StepBadge step={0} current={step} />
          <div className="flex-1 h-px bg-[#e7e5e4]" />
          <StepBadge step={1} current={step} />
          <div className="flex-1 h-px bg-[#e7e5e4]" />
          <StepBadge step={2} current={step} />
        </div>

        <section className="rounded-xl border border-[#e7e5e4] bg-white p-5">
          {step === 0 && (
            <>
              <h2 className="font-bold mb-3" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                Step 1：資格と基本ルール
              </h2>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c] mb-4">
                {AGREEMENT_STEP_1_TEXT}
              </pre>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed1}
                  onChange={(e) => setAgreed1(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-[#44403c] leading-relaxed">
                  上記内容を理解し、同意します
                </span>
              </label>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-bold mb-3" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                Step 2：トラブル防止と違約金
              </h2>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c] mb-4">
                {AGREEMENT_STEP_2_TEXT}
              </pre>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed2}
                  onChange={(e) => setAgreed2(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-[#44403c] leading-relaxed">
                  上記内容を理解し、同意します
                </span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-bold mb-3" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                Step 3：最終確認と電子署名
              </h2>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#44403c] mb-4">
                {AGREEMENT_STEP_3_TEXT}
              </pre>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#44403c] mb-2">
                  戸籍上の本名（フルネーム）
                </label>
                <input
                  value={signedName}
                  onChange={(e) => setSignedName(e.target.value)}
                  className="w-full rounded-lg border border-[#e7e5e4] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                  placeholder="例：山田 花子"
                />
                <p className="text-[11px] text-[#a8a29e] mt-2">
                  入力されたお名前は電子署名として扱われます。
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed3}
                  onChange={(e) => setAgreed3(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-[#44403c] leading-relaxed">
                  上記内容を理解し、同意します
                </span>
              </label>
            </>
          )}

          {submitError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg text-sm border border-[#e7e5e4] text-[#78716c] disabled:opacity-50"
            >
              戻る
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="ml-auto px-5 py-2 rounded-lg text-sm font-bold bg-[#b8860b] text-white disabled:opacity-50"
              >
                次へ
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canNext || submitting}
                className="ml-auto px-5 py-2 rounded-lg text-sm font-bold bg-[#1c1917] text-white disabled:opacity-50"
              >
                {submitting ? '送信中...' : '契約を締結する'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

