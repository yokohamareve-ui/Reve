-- =============================================
-- staff ロール追加用マイグレーション
-- 既存の Supabase プロジェクトに対して実行する
-- =============================================

-- staff 向け RLS ポリシー追加

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
