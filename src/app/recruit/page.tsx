import Link from 'next/link'

const serif = "var(--font-noto-serif), 'Noto Serif JP', serif"
const RECRUIT_PHONE = '050-1746-1888'

export const metadata = {
  title: '求人情報 | 人妻の蜜',
  description: '人妻の蜜のキャスト求人ページ。未経験歓迎・自由シフト・高収入。',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-8">
      <p className="text-[10px] tracking-[0.5em] uppercase text-amber-500/80 mb-3">Recruit</p>
      <h2 className="text-lg tracking-[0.25em] text-amber-400" style={{ fontFamily: serif }}>
        {children}
      </h2>
      <div className="w-10 h-px bg-amber-500/60 mx-auto mt-4" />
    </div>
  )
}

function GoldCard({
  title,
  desc,
  icon,
}: {
  title: string
  desc: string
  icon: string
}) {
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-white/[0.03] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/[0.10] border border-amber-500/20 flex items-center justify-center text-amber-400">
          <span className="text-lg leading-none" aria-hidden>
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-amber-300 font-semibold tracking-wide">{title}</p>
          <p className="text-sm text-neutral-300/90 leading-relaxed mt-1">{desc}</p>
        </div>
      </div>
    </div>
  )
}

export default function RecruitPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_20%,rgba(245,158,11,0.18),transparent_60%),radial-gradient(900px_circle_at_20%_80%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="relative max-w-2xl mx-auto px-4 pt-16 pb-10">
          <p className="text-[10px] tracking-[0.55em] uppercase text-amber-500/80 text-center">
            Cast Recruiting
          </p>
          <h1
            className="mt-5 text-center text-2xl md:text-3xl tracking-[0.35em] text-amber-400"
            style={{ fontFamily: serif }}
          >
            求人情報
          </h1>
          <div className="w-12 h-px bg-amber-500/70 mx-auto mt-6" />
          <p className="mt-6 text-center text-sm text-neutral-300 leading-relaxed">
            未経験の方も歓迎。安全第一で、無理なく続けられる環境を整えています。
          </p>

          <div className="mt-5 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-amber-400/70 via-amber-500/40 to-amber-700/60 blur-[2px]" />
              <div className="relative inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-black/35 px-4 py-2">
                <span
                  className="inline-flex h-6 items-center rounded-full bg-amber-500/[0.12] border border-amber-500/20 px-2 text-[10px] font-bold tracking-[0.18em] text-amber-300"
                  style={{ fontFamily: serif }}
                >
                  NEW
                </span>
                <p className="text-[13px] font-semibold tracking-wider text-amber-200">
                  オンライン面談実施中！
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <a
              href={`tel:${RECRUIT_PHONE}`}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-700 text-neutral-950 font-bold tracking-wider py-3 text-center hover:opacity-90 transition-opacity"
            >
              ☎ お電話で応募
            </a>
            <Link
              href="/"
              className="rounded-xl border border-amber-500/25 bg-white/[0.03] text-amber-200 font-semibold tracking-wider py-3 text-center hover:bg-white/[0.06] transition-colors"
            >
              トップへ戻る
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <span className="text-amber-500/80" aria-hidden>
              ✦
            </span>
            <span>受付: 10:00 - 翌4:00</span>
            <span className="text-amber-500/80" aria-hidden>
              ✦
            </span>
            <span>秘密厳守</span>
          </div>
        </div>
      </header>

      {/* Points */}
      <section className="py-14">
        <div className="max-w-2xl mx-auto px-4">
          <SectionTitle>選ばれる理由</SectionTitle>
          <div className="grid gap-3">
            <GoldCard
              icon="💎"
              title="高収入・高バック"
              desc="頑張りがそのまま収入に。目標に合わせて働き方を調整できます。"
            />
            <GoldCard
              icon="🕊"
              title="自由シフト"
              desc="短時間・週1〜など相談OK。プライベート優先で無理なく続けられます。"
            />
            <GoldCard
              icon="🛡"
              title="安心のサポート"
              desc="身バレ対策・安全面の配慮・初めての方のフォロー体制を整えています。"
            />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-14 border-t border-amber-500/10 bg-neutral-950">
        <div className="max-w-2xl mx-auto px-4">
          <SectionTitle>募集要項</SectionTitle>

          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-white/[0.03] px-4 py-2 text-amber-200">
              <span className="text-[12px]" aria-hidden>
                ✦
              </span>
              <span className="text-[12px] font-semibold tracking-wider">オンライン面談実施中！</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/15 bg-white/[0.03] overflow-hidden">
            <dl className="divide-y divide-amber-500/10">
              <div className="grid grid-cols-3 gap-3 p-5">
                <dt className="text-[12px] text-amber-300 tracking-wider">職種</dt>
                <dd className="col-span-2 text-sm text-neutral-200">キャスト</dd>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                <dt className="text-[12px] text-amber-300 tracking-wider">応募資格</dt>
                <dd className="col-span-2 text-sm text-neutral-200">
                  18歳以上（高校生不可）/ 未経験歓迎
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                <dt className="text-[12px] text-amber-300 tracking-wider">勤務時間</dt>
                <dd className="col-span-2 text-sm text-neutral-200">10:00 - 翌4:00（応相談）</dd>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                <dt className="text-[12px] text-amber-300 tracking-wider">勤務地</dt>
                <dd className="col-span-2 text-sm text-neutral-200">西船橋 / 葛西 / 錦糸町 ほか</dd>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                <dt className="text-[12px] text-amber-300 tracking-wider">面接</dt>
                <dd className="col-span-2 text-sm text-neutral-200">
                  私服OK / 即日体験相談OK / 秘密厳守
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-5 text-[11px] text-neutral-500 leading-relaxed">
            ※詳細条件はご希望や経験によりご案内します。無理な引き止めや強要はありません。
          </p>
        </div>
      </section>

      {/* Flow */}
      <section className="py-14 border-t border-amber-500/10">
        <div className="max-w-2xl mx-auto px-4">
          <SectionTitle>応募の流れ</SectionTitle>
          <ol className="space-y-3">
            {[
              { t: 'お問い合わせ', d: 'お電話でご連絡ください。質問だけでもOKです。' },
              { t: '面接・ご説明', d: '条件や不安点を丁寧に確認します。' },
              { t: '体験（希望者）', d: '無理のない範囲で、まずは短時間から。' },
              { t: 'お仕事スタート', d: 'シフトや働き方はいつでも相談できます。' },
            ].map((s, i) => (
              <li
                key={s.t}
                className="rounded-2xl border border-amber-500/15 bg-white/[0.03] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/[0.12] border border-amber-500/20 flex items-center justify-center text-amber-300 font-bold">
                    {i + 1}
                  </div>
                  <p className="text-amber-200 font-semibold tracking-wide">{s.t}</p>
                </div>
                <p className="mt-2 text-sm text-neutral-300 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-amber-500/10 bg-gradient-to-b from-neutral-950 to-black">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-amber-300 tracking-[0.25em]" style={{ fontFamily: serif }}>
            まずは気軽にご相談ください
          </p>
          <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
            「短時間だけ」「未経験で不安」など、何でもOKです。
          </p>
          <a
            href={`tel:${RECRUIT_PHONE}`}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-amber-700 text-neutral-950 font-extrabold tracking-wider px-10 py-4 hover:opacity-90 transition-opacity"
          >
            ☎ {RECRUIT_PHONE}
          </a>
        </div>
      </section>
    </main>
  )
}

