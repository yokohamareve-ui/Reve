-- =============================================
-- テストデータ投入SQL
-- =============================================
-- 実行前に既存テストデータを削除する場合は
-- tests/seed_clean.sql を先に実行してください

-- =============================================
-- キャスト
-- =============================================
insert into casts (id, name, slug, main_image_url, sub_image_urls, message, birthday, blood_type, hobby, x_url, instagram_url, tiktok_url, status, default_workdays, is_public, sort_order) values
  (
    '11111111-0000-0000-0000-000000000001',
    'さくら',
    'sakura',
    'https://api.dicebear.com/9.x/lorelei/png?seed=sakura',
    '{"https://api.dicebear.com/9.x/lorelei/png?seed=sakura2","https://api.dicebear.com/9.x/lorelei/png?seed=sakura3"}',
    'みなさんに会えるのを楽しみにしています！',
    '4月1日',
    'A',
    'カフェ巡り・読書',
    'https://x.com/test_sakura',
    'https://instagram.com/test_sakura',
    null,
    'active',
    '{1,3,5}',
    true,
    1
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'ひまり',
    'himari',
    'https://api.dicebear.com/9.x/lorelei/png?seed=himari',
    '{}',
    'いつも笑顔でお出迎えします♪',
    '7月7日',
    'O',
    'ゲーム・アニメ',
    null,
    'https://instagram.com/test_himari',
    'https://tiktok.com/@test_himari',
    'active',
    '{2,4,6}',
    true,
    2
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'れん',
    'ren',
    null,
    '{}',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'inactive',
    '{}',
    false,
    3
  );

-- =============================================
-- 出勤スケジュール
-- =============================================
insert into schedules (id, date, note, is_public) values
  ('22222222-0000-0000-0000-000000000001', current_date + 0, '本日のスケジュールです', true),
  ('22222222-0000-0000-0000-000000000002', current_date + 1, '明日のスケジュールです', true),
  ('22222222-0000-0000-0000-000000000003', current_date + 7, '来週のスケジュールです', true),
  ('22222222-0000-0000-0000-000000000004', current_date - 1, '昨日のスケジュール（非公開）', false);

-- =============================================
-- シフト×キャスト中間テーブル
-- =============================================
insert into schedule_casts (schedule_id, cast_id) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001');

-- =============================================
-- ニュース
-- =============================================
insert into news (id, title, slug, category, thumbnail_url, content, published_at, is_public) values
  (
    '33333333-0000-0000-0000-000000000001',
    'グランドオープンのお知らせ',
    'grand-open',
    'お知らせ',
    'https://api.dicebear.com/9.x/lorelei/png?seed=news1',
    '<p>いよいよグランドオープンです！皆様のご来店をお待ちしております。</p>',
    current_date - 30,
    true
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '新キャスト加入のご案内',
    'new-cast',
    'キャスト',
    'https://api.dicebear.com/9.x/lorelei/png?seed=news2',
    '<p>新しいキャストが加入しました！ぜひ会いに来てください。</p>',
    current_date - 7,
    true
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '下書きニュース（非公開）',
    'draft-news',
    'お知らせ',
    null,
    '<p>まだ公開していない下書きです。</p>',
    null,
    false
  );

-- =============================================
-- ギャラリー
-- =============================================
insert into gallery (id, image_url, caption, category, is_public, sort_order) values
  ('44444444-0000-0000-0000-000000000001', 'https://api.dicebear.com/9.x/lorelei/png?seed=gallery1', '店内の様子', '店内', true, 1),
  ('44444444-0000-0000-0000-000000000002', 'https://api.dicebear.com/9.x/lorelei/png?seed=gallery2', 'ドリンクメニュー', 'メニュー', true, 2),
  ('44444444-0000-0000-0000-000000000003', 'https://api.dicebear.com/9.x/lorelei/png?seed=gallery3', 'イベントの様子', 'イベント', true, 3),
  ('44444444-0000-0000-0000-000000000004', 'https://api.dicebear.com/9.x/lorelei/png?seed=gallery4', '非公開画像', '店内', false, 4);

-- =============================================
-- 店舗情報
-- =============================================
insert into shop (id, shop_name, business_hours, closed_days, address, google_map_embed_url, top_banner_url, menu_image_url, line_url, form_url, apply_type, system_text, access_text, recruit_text) values (
  1,
  'テストコンカフェ',
  '12:00〜22:00（最終入店 21:30）',
  '毎週火曜日',
  '東京都千代田区テスト1-2-3 テストビル3F',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.828030650526!2d139.7671248!3d35.6812362!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188bfbd89f700b%3A0x277c49ba34ed38!2z5p2x5Lqs6aeF!5e0!3m2!1sja!2sjp!4v1234567890',
  'https://api.dicebear.com/9.x/lorelei/png?seed=banner&size=1200',
  null,
  'https://line.me/test',
  'https://forms.example.com/test',
  'both',
  '<h2>システム説明</h2><p>当店のシステムについてご説明します。</p><ul><li>入店料：1,000円（90分制）</li><li>ドリンク：500円〜</li><li>延長：30分500円</li></ul>',
  '<h2>アクセス</h2><p>テスト駅から徒歩3分。テストビル3Fです。</p>',
  '<h2>採用情報</h2><p>一緒に働くキャストを募集中です！未経験者歓迎。</p>'
);
