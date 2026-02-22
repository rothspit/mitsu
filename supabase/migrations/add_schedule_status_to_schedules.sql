ALTER TABLE schedules ADD COLUMN IF NOT EXISTS schedule_status int DEFAULT 0;
COMMENT ON COLUMN schedules.schedule_status IS '0=予約受付中, 1=出勤確定 (MrVenrey ScheduleStatus)';
