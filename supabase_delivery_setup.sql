-- ══════════════════════════════════════════
-- applicants_delivery テーブル作成
-- Supabase Dashboard > SQL Editor で実行
-- ══════════════════════════════════════════

create table public.applicants_delivery (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamp with time zone default now(),
  name             text,                          -- 名前・ニックネーム
  age              integer,                       -- 年齢
  gender           text,                          -- 性別
  has_license      text,                          -- 免許の有無
  area             text,                          -- 希望エリア
  move_in_timing   text,                          -- 入居希望時期
  contact          text not null                  -- 連絡先（必須）
);

-- Row Level Security
alter table public.applicants_delivery enable row level security;

-- Anonキーからの INSERT のみ許可（SELECT はNG）
create policy "Allow insert for anon"
  on public.applicants_delivery
  for insert
  to anon
  with check (true);

-- ※管理画面から閲覧する場合は Supabase Dashboard の Table Editor を使用
