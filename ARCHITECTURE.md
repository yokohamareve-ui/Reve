# アーキテクチャ概要

## システム全体図

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (CDN + Edge)                   │
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────────┐   │
│  │    公開サイト          │   │       管理画面            │   │
│  │  (Static / ISR)      │   │  (CSR / Server Actions)  │   │
│  │  /(public)/**        │   │  /admin/**               │   │
│  └──────────┬───────────┘   └──────────┬───────────────┘   │
│             │                           │                   │
│             └──────────┬────────────────┘                   │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Supabase             │
            │  ┌──────────────────┐  │
            │  │   PostgreSQL DB  │  │
            │  │   + RLS          │  │
            │  └──────────────────┘  │
            │  ┌──────────────────┐  │
            │  │   Auth           │  │
            │  │ (Email/Password) │  │
            │  └──────────────────┘  │
            │  ┌──────────────────┐  │
            │  │   Storage        │  │
            │  │ (Public Buckets) │  │
            │  └──────────────────┘  │
            └────────────────────────┘
```

## ディレクトリ構成

```
/
├── app/
│   ├── layout.tsx                  # ルートレイアウト（フォント設定）
│   ├── globals.css                 # グローバルスタイル
│   ├── (public)/                   # 公開サイト（ルートグループ）
│   │   ├── page.tsx                # トップページ
│   │   ├── cast/
│   │   │   ├── page.tsx            # キャスト一覧
│   │   │   └── [slug]/page.tsx     # キャスト詳細
│   │   ├── schedule/page.tsx       # 出勤スケジュール
│   │   ├── news/
│   │   │   ├── page.tsx            # ニュース一覧
│   │   │   └── [slug]/page.tsx     # ニュース詳細
│   │   ├── gallery/page.tsx        # ギャラリー
│   │   ├── system/page.tsx         # 料金・メニュー
│   │   ├── access/page.tsx         # アクセス
│   │   └── recruit/page.tsx        # 採用情報
│   ├── admin/                      # 管理画面
│   │   ├── layout.tsx              # 管理画面レイアウト（サイドバー）
│   │   ├── login/page.tsx          # ログイン
│   │   ├── page.tsx                # ダッシュボード
│   │   ├── cast/
│   │   │   ├── page.tsx            # キャスト一覧
│   │   │   ├── new/page.tsx        # キャスト新規作成
│   │   │   └── [id]/page.tsx       # キャスト編集
│   │   ├── schedule/
│   │   │   ├── page.tsx            # シフト管理（月次カレンダー）
│   │   │   └── [id]/page.tsx       # シフト詳細編集
│   │   ├── news/
│   │   │   ├── page.tsx            # ニュース一覧
│   │   │   ├── new/page.tsx        # ニュース新規作成
│   │   │   └── [id]/page.tsx       # ニュース編集
│   │   ├── gallery/page.tsx        # ギャラリー管理
│   │   └── shop/page.tsx           # 店舗情報管理
│   └── api/
│       ├── revalidate/route.ts     # ISR 再生成エンドポイント
│       └── preview/route.ts        # プレビュー
├── components/
│   ├── Header.tsx                  # 公開サイト共通ヘッダー
│   ├── Footer.tsx                  # 公開サイト共通フッター
│   ├── CastCard.tsx                # キャストカードコンポーネント
│   ├── NewsCard.tsx                # ニュースカードコンポーネント
│   ├── GalleryItem.tsx             # ギャラリー画像コンポーネント
│   └── admin/
│       ├── AdminSidebar.tsx        # 管理画面サイドバー
│       ├── ImageUpload.tsx         # 画像アップロードコンポーネント
│       ├── RichTextEditor.tsx      # Tiptap リッチテキストエディタ
│       └── ScheduleCalendar.tsx    # シフトカレンダーコンポーネント
├── lib/
│   ├── supabase.ts                 # Supabase ブラウザクライアント
│   ├── supabase-server.ts          # Supabase サーバークライアント
│   └── data.ts                     # データ取得関数（公開サイト用）
├── types/
│   └── index.ts                    # 型定義（Cast, Schedule, News 等）
├── supabase/
│   ├── schema.sql                  # テーブル定義
│   └── rls.sql                     # Row Level Security ポリシー
└── middleware.ts                   # 認証ミドルウェア（/admin 保護）
```

## データモデル

```
profiles ──────────────── auth.users (Supabase 管理)
  id (FK → auth.users)    id
  role: 'owner' | 'cast'
  cast_id (FK → casts)
       │
       ▼
     casts ─────────────────── schedule_casts ──── schedules
       id (PK)                   schedule_id (FK)    id (PK)
       name                      cast_id (FK)        date (unique)
       slug (unique)                                 note
       main_image_url                                is_public
       sub_image_urls[]
       default_workdays[]   news        gallery       shop
       is_public              id          id           id (常に 1)
       sort_order             title       image_url    shop_name
       ...                    slug        caption      business_hours
                              content     category     ...
                              is_public   is_public
```

## 認証・認可フロー

```
ブラウザ                    middleware.ts              Supabase Auth
   │                             │                         │
   ├─── GET /admin/cast ────────►│                         │
   │                             ├─── getUser() ──────────►│
   │                             │◄── user / null ─────────┤
   │                             │                         │
   │    [未認証]                  │                         │
   │◄── redirect /admin/login ───┤                         │
   │                             │                         │
   │    [認証済み]                 │                         │
   │◄── 通過（ページ表示） ──────────┤                         │
```

## 権限モデル（RLS）

| 操作 | 未認証 | cast ロール | staff ロール | owner ロール |
|------|--------|------------|-------------|-------------|
| 公開コンテンツ閲覧 | ✅ | ✅ | ✅ | ✅ |
| 非公開コンテンツ閲覧 | ❌ | ✅ | ✅ | ✅ |
| 自分のキャスト情報更新 | ❌ | ✅ | ❌ | ✅ |
| 自分のシフト更新 | ❌ | ✅ | ❌ | ✅ |
| 全キャスト作成・編集 | ❌ | ❌ | ✅ | ✅ |
| キャスト削除 | ❌ | ❌ | ❌ | ✅ |
| シフト管理（全員分） | ❌ | ❌ | ✅ | ✅ |
| ニュース管理 | ❌ | ❌ | ✅ | ✅ |
| ギャラリー管理 | ❌ | ❌ | ✅ | ✅ |
| 店舗情報管理 | ❌ | ❌ | ✅ | ✅ |
| ユーザー管理 | ❌ | ❌ | ❌ | ✅ |

## データフロー

### 公開サイト（ISR）

```
ビルド時 / 再生成時
Next.js ──► supabase-server.ts ──► Supabase DB（is_public=true のみ）
        ◄── 静的HTML生成 ──────────
                │
                ▼
        CDN キャッシュ配信

POST /api/revalidate?secret=xxx で任意タイミングに再生成可能
```

### 管理画面（CSR）

```
ブラウザ ──► supabase.ts（ブラウザクライアント）──► Supabase DB
         ◄── RLS で権限フィルタリング ─────────────
```

## 画像ストレージ

| バケット名 | 用途 | 使用箇所 |
|-----------|------|---------|
| `cast-images` | キャスト画像 | casts.main_image_url, sub_image_urls |
| `news-images` | ニュース画像 | news.thumbnail_url, リッチテキスト内 |
| `gallery-images` | ギャラリー画像 | gallery.image_url |
| `shop-images` | 店舗バナー | shop.top_banner_url |

全バケットは Public bucket（認証不要で画像URL直接アクセス可）。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Email/Password) |
| ストレージ | Supabase Storage |
| リッチテキスト | Tiptap |
| ホスティング | Vercel |

## 環境変数

| 変数名 | 用途 | 使用場所 |
|--------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | クライアント・サーバー両方 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名アクセスキー（RLS で制御） | クライアント・サーバー両方 |
| `SUPABASE_SERVICE_ROLE_KEY` | 管理者キー（RLS バイパス） | サーバーサイドのみ |
| `REVALIDATE_SECRET` | ISR 再生成用シークレット | `/api/revalidate` エンドポイント |
