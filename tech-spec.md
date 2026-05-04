# ガールズバー公式ウェブサイト 技術仕様書

## 1. 技術スタック

| 役割 | 採用技術 |
|------|---------|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS |
| データベース | Supabase（PostgreSQL） |
| 画像ストレージ | Supabase Storage |
| 認証 | Supabase Auth |
| リッチテキスト | Tiptap |
| ホスティング | Vercel |

---

## 2. ディレクトリ構成

```
/app
  /(public)          # 公開サイト
    /
    /cast
    /cast/[slug]
    /schedule
    /system
    /news
    /news/[slug]
    /gallery
    /access
    /recruit

  /admin             # 管理画面（要認証）
    /login
    /
    /cast
    /cast/new
    /cast/[id]
    /schedule
    /schedule/new
    /schedule/[id]
    /news
    /news/new
    /news/[id]
    /gallery
    /shop

  /api
    /revalidate

/lib
  supabase.ts        # Supabaseクライアント
  supabase-server.ts # サーバーサイド用クライアント

/types
  index.ts

/components
  /(public)          # 公開サイト用コンポーネント
  /admin             # 管理画面用コンポーネント
```

---

## 3. データベーススキーマ

### users（Supabase Auth 拡張）
Supabase Auth の `auth.users` を使用。追加情報は以下のテーブルで管理。

### profiles
```sql
create table profiles (
  id uuid references auth.users(id) primary key,
  role text not null default 'cast',  -- 'owner' | 'cast'
  cast_id uuid references casts(id),  -- キャストロールの場合のみ
  created_at timestamptz default now()
);
```

### casts
```sql
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
  status text,
  default_workdays int[] default '{}',  -- 0=日〜6=土
  is_public boolean default false,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### schedules
```sql
create table schedules (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  note text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### schedule_casts（中間テーブル）
```sql
create table schedule_casts (
  schedule_id uuid references schedules(id) on delete cascade,
  cast_id uuid references casts(id) on delete cascade,
  primary key (schedule_id, cast_id)
);
```

### news
```sql
create table news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text,
  thumbnail_url text,
  content text,  -- HTML（Tiptap出力）
  published_at date,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### gallery
```sql
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  category text,
  is_public boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

### shop
```sql
create table shop (
  id int primary key default 1,  -- 常に1行のみ
  shop_name text,
  business_hours text,
  closed_days text,
  address text,
  google_map_embed_url text,
  top_banner_url text,
  line_url text,
  form_url text,
  apply_type text default 'both',  -- 'line' | 'form' | 'both'
  system_text text,
  access_text text,
  recruit_text text,
  updated_at timestamptz default now()
);
```

---

## 4. 認証・権限

### Supabase Auth
- メールアドレス＋パスワードでログイン
- アカウント作成はオーナーが管理画面から行う（招待メール方式）

### 権限制御

| 権限 | 操作可能範囲 |
|------|------------|
| owner | 全テーブルの読み書き |
| cast | 自分の cast レコードのみ更新、自分が含まれる schedule のみ更新 |

### Row Level Security（RLS）

```sql
-- casts: キャストは自分のレコードのみ更新可
create policy "cast can update own profile"
  on casts for update
  using (
    id = (select cast_id from profiles where id = auth.uid())
  );

-- schedules: キャストは自分が含まれるシフトのみ更新可
create policy "cast can update own schedule"
  on schedules for update
  using (
    id in (
      select schedule_id from schedule_casts
      where cast_id = (select cast_id from profiles where id = auth.uid())
    )
  );
```

---

## 5. シフト管理仕様

### デフォルト出勤曜日
- キャストの `default_workdays` に曜日番号（0=日〜6=土）を配列で保存
- 例：月・水・金 → `[1, 3, 5]`

### 月次シフト自動生成
- オーナーが対象月を選択して「シフト生成」を実行
- 各キャストの `default_workdays` をもとに、その月の該当日付のシフトレコードを自動作成
- 生成後、オーナー・キャストが個別に修正可能
- `is_public = false` の状態で生成し、確認後に一括公開

### シフトUIフロー
1. 月を選択 → 「シフト生成」ボタン
2. カレンダー形式で表示（週単位）
3. 各日付をクリック → 出勤キャストを追加・削除
4. 確認後「一括公開」

---

## 6. リッチテキストエディタ

- **Tiptap** を採用
- 対応機能：見出し・太字・斜体・リスト・リンク・画像挿入・テーブル・YouTube埋め込み
- 出力形式：HTML（DBに保存、公開サイトで `dangerouslySetInnerHTML` で表示）

---

## 7. 画像アップロード

- Supabase Storage のバケット構成：
  - `cast-images` - キャスト画像
  - `news-images` - ニュースサムネイル・本文画像
  - `gallery-images` - ギャラリー画像
  - `shop-images` - 店舗バナー
- アップロード後の公開 URL を DB に保存
- Next.js Image コンポーネントで表示するため `next.config.mjs` に Supabase Storage ドメインを追加

---

## 8. Supabaseクライアント

```ts
// lib/supabase.ts（クライアントサイド）
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

```ts
// lib/supabase-server.ts（サーバーサイド）
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerSupabaseClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookies().getAll() } }
  );
```

---

## 9. レンダリング

- 公開サイト：ISR（revalidate 設定）
- 管理画面：動的レンダリング（キャッシュなし）

---

## 10. Revalidation

コンテンツ更新時に該当ページを再生成する。

```ts
// 管理画面の保存処理後に呼び出す
await fetch('/api/revalidate', {
  method: 'POST',
  body: JSON.stringify({ type: 'cast' }),
});
```

---

## 11. 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REVALIDATE_SECRET=
```

---

## 12. セキュリティ

- 管理画面は Supabase Auth で保護
- RLS で DB レベルの権限制御
- Storage のバケットは認証済みユーザーのみアップロード可
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドのみ使用

---

## 13. SEO

- title / description のみ対応
- OGP は固定画像または DB 画像

---

## 14. エラー処理

- データ未取得時は空表示
- 致命的エラーは fallback 表示

---

## 15. デプロイ

- Vercel
- `main` ブランチを本番
