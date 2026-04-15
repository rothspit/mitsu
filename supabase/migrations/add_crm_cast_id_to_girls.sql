-- CRM連動用: CRMのキャストIDを保持し、一意制約で重複を防ぐ
-- - `crm_cast_id` は CRM /idol/casts の `cast_id` を想定
-- - 既存運用に影響を出しにくいよう NULL 許容で追加し、ユニーク制約は部分（NOT NULL）にする

ALTER TABLE girls
  ADD COLUMN IF NOT EXISTS crm_cast_id bigint;

COMMENT ON COLUMN girls.crm_cast_id IS 'CRM /idol/casts の cast_id（同一人物の正規キー）';

-- NULL を許容しつつ、値が入った行だけを UNIQUE にする（既存データへの影響を最小化）
CREATE UNIQUE INDEX IF NOT EXISTS girls_crm_cast_id_unique
  ON girls (crm_cast_id)
  WHERE crm_cast_id IS NOT NULL;

