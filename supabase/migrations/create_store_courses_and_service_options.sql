-- store_courses: コース定義（人妻の蜜）
CREATE TABLE IF NOT EXISTS store_courses (
  id            bigint PRIMARY KEY,
  brand_id      uuid NOT NULL REFERENCES brands(id),
  store_code    text NOT NULL,
  name          text NOT NULL,
  duration_minutes integer NOT NULL,
  price         integer NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- service_options: オプション（人妻の蜜）
CREATE TABLE IF NOT EXISTS service_options (
  id            bigint PRIMARY KEY,
  brand_id      uuid NOT NULL REFERENCES brands(id),
  store_code    text,
  name          text NOT NULL,
  category      text,
  price         integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE store_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_courses_read" ON store_courses FOR SELECT USING (true);
CREATE POLICY "service_options_read" ON service_options FOR SELECT USING (true);
