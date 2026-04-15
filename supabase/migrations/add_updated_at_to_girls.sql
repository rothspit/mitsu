-- girls に updated_at を追加（監査・同期の優先順位判定用）
-- 既存行も含めて常に値が入るように default now() + backfill を行う

ALTER TABLE public.girls
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- 既存行の backfill（NULL のみ）
UPDATE public.girls
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

-- NOT NULL + default
ALTER TABLE public.girls
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.girls
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN public.girls.updated_at IS '最終更新日時（同期・管理用）';

