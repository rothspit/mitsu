ALTER TABLE girls ADD COLUMN IF NOT EXISTS wait_status integer DEFAULT 0;
COMMENT ON COLUMN girls.wait_status IS '即姫ステータス: 0=未設定, 1=待機中, 2=接客中, 3=受付終了';

ALTER TABLE girls ADD COLUMN IF NOT EXISTS attend_end_time time;
COMMENT ON COLUMN girls.attend_end_time IS '接客終了予定時刻（即姫ステータス=接客中の場合）';
