'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';

export default function NewNewsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: '',
    published_at: '',
    is_public: false,
    thumbnail_url: '',
    content: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('news').insert([
        {
          title: form.title,
          slug: crypto.randomUUID(),
          category: form.category || null,
          published_at: form.published_at || null,
          is_public: form.is_public,
          thumbnail_url: form.thumbnail_url || null,
          content: form.content || null,
        },
      ]);
      if (error) throw error;
      router.push('/admin/news');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-[#6a5518] hover:bg-[#1a1a1a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#d4af37]">新規ニュース作成</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#d4af37]">基本情報</h2>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-1">タイトル *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">カテゴリ</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              >
                <option value="">未選択</option>
                <option value="お知らせ">お知らせ</option>
                <option value="イベント">イベント</option>
                <option value="キャンペーン">キャンペーン</option>
                <option value="新人情報">新人情報</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">公開日</label>
              <input
                type="date"
                value={form.published_at}
                onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))}
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">公開状態</label>
              <select
                value={form.is_public ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              >
                <option value="false">非公開</option>
                <option value="true">公開</option>
              </select>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-3">
          <h2 className="text-sm font-semibold text-[#d4af37]">サムネイル画像</h2>
          <ImageUpload
            bucket="news-images"
            currentUrl={form.thumbnail_url || null}
            onUpload={(url) => setForm((p) => ({ ...p, thumbnail_url: url }))}
            label="サムネイル画像をアップロード"
          />
        </div>

        {/* Content */}
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-3">
          <h2 className="text-sm font-semibold text-[#d4af37]">本文</h2>
          <RichTextEditor
            content={form.content}
            onChange={(html) => setForm((p) => ({ ...p, content: html }))}
            bucket="news-images"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-black disabled:opacity-70"
            style={{ backgroundColor: '#d4af37' }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/news')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222]"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
