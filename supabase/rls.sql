-- =============================================
-- Row Level Security（RLS）設定
-- schema.sql 実行後に実行すること
-- =============================================

-- RLS を有効化
alter table casts enable row level security;
alter table schedules enable row level security;
alter table schedule_casts enable row level security;
alter table news enable row level security;
alter table gallery enable row level security;
alter table shop enable row level security;
alter table profiles enable row level security;

-- =============================================
-- 公開サイト向け（未認証ユーザー）
-- =============================================

create policy "public can read public casts"
  on casts for select using (is_public = true);

create policy "public can read public schedules"
  on schedules for select using (is_public = true);

create policy "public can read schedule_casts"
  on schedule_casts for select using (true);

create policy "public can read public news"
  on news for select using (is_public = true);

create policy "public can read public gallery"
  on gallery for select using (is_public = true);

create policy "public can read shop"
  on shop for select using (true);

-- =============================================
-- 管理画面向け（認証済みユーザー）
-- =============================================

-- 認証済みユーザーは全コンテンツを読める
create policy "authenticated can read all casts"
  on casts for select to authenticated using (true);

create policy "authenticated can read all schedules"
  on schedules for select to authenticated using (true);

create policy "authenticated can read all schedule_casts"
  on schedule_casts for select to authenticated using (true);

create policy "authenticated can read all news"
  on news for select to authenticated using (true);

create policy "authenticated can read all gallery"
  on gallery for select to authenticated using (true);

create policy "authenticated can read profiles"
  on profiles for select to authenticated using (true);

-- =============================================
-- オーナー権限
-- =============================================

create policy "owner can do everything on casts"
  on casts for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can do everything on schedules"
  on schedules for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can do everything on schedule_casts"
  on schedule_casts for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can do everything on news"
  on news for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can do everything on gallery"
  on gallery for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can do everything on shop"
  on shop for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can manage profiles"
  on profiles for insert to authenticated
  with check ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can update profiles"
  on profiles for update to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

create policy "owner can delete profiles"
  on profiles for delete to authenticated
  using ((select role from profiles where id = auth.uid()) = 'owner');

-- =============================================
-- スタッフ権限（キャスト個人以外のコンテンツを操作可能）
-- =============================================

create policy "staff can do everything on casts"
  on casts for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'staff');

create policy "staff can do everything on schedules"
  on schedules for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'staff');

create policy "staff can do everything on schedule_casts"
  on schedule_casts for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'staff');

create policy "staff can do everything on news"
  on news for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'staff');

create policy "staff can do everything on gallery"
  on gallery for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'staff');

create policy "staff can do everything on shop"
  on shop for all to authenticated
  using ((select role from profiles where id = auth.uid()) = 'staff');

-- =============================================
-- キャスト権限
-- =============================================

-- キャストは自分のプロフィールのみ更新できる
create policy "cast can update own cast"
  on casts for update to authenticated
  using (id = (select cast_id from profiles where id = auth.uid()));

-- キャストは自分が含まれるシフトのみ更新できる
create policy "cast can update own schedule"
  on schedules for update to authenticated
  using (
    id in (
      select schedule_id from schedule_casts
      where cast_id = (select cast_id from profiles where id = auth.uid())
    )
  );

-- =============================================
-- Storage ポリシー（gallery-images バケット）
-- =============================================

create policy "public can read gallery images"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

create policy "authenticated can upload gallery images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery-images');

create policy "authenticated can update gallery images"
  on storage.objects for update to authenticated
  using (bucket_id = 'gallery-images');

create policy "authenticated can delete gallery images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery-images');
