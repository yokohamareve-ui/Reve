-- =============================================
-- テーブル作成
-- =============================================

-- キャスト
create table casts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  main_image_url text,
  sub_image_urls text[] default '{}',
  message text,
  birthday text,
  blood_type text,
  hobby text,
  x_url text,
  instagram_url text,
  tiktok_url text,
  default_workdays int[] default '{}',
  default_work_start text,
  default_work_end text,
  is_public boolean default false,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 出勤スケジュール
create table schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  note text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- シフト×キャスト中間テーブル
create table schedule_casts (
  schedule_id uuid references schedules(id) on delete cascade,
  cast_id uuid references casts(id) on delete cascade,
  work_start text,
  work_end text,
  primary key (schedule_id, cast_id)
);

-- ニュース
create table news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text,
  thumbnail_url text,
  content text,
  published_at date,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ギャラリー
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  category text,
  is_public boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 店舗情報（常に1行）
create table shop (
  id int primary key default 1,
  shop_name text,
  business_hours text,
  closed_days text,
  address text,
  google_map_embed_url text,
  top_banner_url text,
  line_url text,
  form_url text,
  apply_type text default 'both',
  tiktok_url text,
  menu_image_url text,
  system_text text,
  access_text text,
  recruit_text text,
  gallery_category_order text,         -- ギャラリーカテゴリの表示順 (JSON配列文字列)
  updated_at timestamptz default now()
);

-- ユーザープロフィール（権限管理）
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'cast',
  cast_id uuid references casts(id),
  created_at timestamptz default now()
);

-- =============================================
-- マスターデータ
-- =============================================

-- 店舗情報の初期レコードは seed.sql で投入する
