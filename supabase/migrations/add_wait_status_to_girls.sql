ALTER TABLE girls ADD COLUMN IF NOT EXISTS wait_status integer DEFAULT 0;
COMMENT ON COLUMN girls.wait_status IS '即姫ステータス: 0=未設定, 1=待機中, 2=接客中, 3=受付終了';
