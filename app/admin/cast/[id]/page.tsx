'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import ImageUpload from '@/components/admin/ImageUpload';
import type { Cast } from '@/types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function EditCastPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    message: '',
    birthday: '',
    blood_type: '',
    hobby: '',
    x_url: '',
    instagram_url: '',
    tiktok_url: '',
    default_workdays: [] as number[],
    default_work_start: '',
    default_work_end: '',
    sort_order: 0,
    is_public: false,
    main_image_url: '',
    sub_image_urls: [] as string[],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('casts').select('*').eq('id', id).single();
        if (error) throw error;
        const cast = data as Cast;
        setForm({
          name: cast.name ?? '',
          slug: cast.slug ?? '',
          message: cast.message ?? '',
          birthday: cast.birthday ?? '',
          blood_type: cast.blood_type ?? '',
          hobby: cast.hobby ?? '',
          x_url: cast.x_url ?? '',
          instagram_url: cast.instagram_url ?? '',
          tiktok_url: cast.tiktok_url ?? '',
          default_workdays: cast.default_workdays ?? [],
          default_work_start: cast.default_work_start ?? '',
          default_work_end: cast.default_work_end ?? '',
          sort_order: cast.sort_order ?? 0,
          is_public: cast.is_public ?? false,
          main_image_url: cast.main_image_url ?? '',
          sub_image_urls: cast.sub_image_urls ?? [],
        });
      } catch {
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleWorkday = (day: number) => {
    setForm((prev) => ({
      ...prev,
      default_workdays: prev.default_workdays.includes(day)
        ? prev.default_workdays.filter((d) => d !== day)
        : [...prev.default_workdays, day].sort(),
    }));
  };

  const handleSubImageUpload = (url: string) => {
    setForm((prev) => ({ ...prev, sub_image_urls: [...prev.sub_image_urls, url] }));
  };

  const removeSubImage = async (idx: number) => {
    const url = form.sub_image_urls[idx];
    setForm((prev) => ({
      ...prev,
      sub_image_urls: prev.sub_image_urls.filter((_, i) => i !== idx),
    }));
    if (url) {
      try {
        const supabase = createClient();
        const { data: { publicUrl } } = supabase.storage.from('cast-images').getPublicUrl('');
        const baseUrl = publicUrl.replace(/\/$/, '');
        if (url.startsWith(baseUrl + '/')) {
          const path = url.slice(baseUrl.length + 1);
          await supabase.storage.from('cast-images').remove([path]);
        }
      } catch {
        // 削除失敗は無視
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('casts').update({
        name: form.name,
        slug: form.slug,
        message: form.message || null,
        birthday: form.birthday || null,
        blood_type: form.blood_type || null,
        hobby: form.hobby || null,
        x_url: form.x_url || null,
        instagram_url: form.instagram_url || null,
        tiktok_url: form.tiktok_url || null,
        default_workdays: form.default_workdays,
        default_work_start: form.default_work_start || null,
        default_work_end: form.default_work_end || null,
        sort_order: form.sort_order,
        is_public: form.is_public,
        main_image_url: form.main_image_url || null,
        sub_image_urls: form.sub_image_urls,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      router.push('/admin/cast');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug')) {
        setError('このスラッグはすでに使用されています。別のスラッグを入力してください。');
      } else {
        setError(msg || '保存に失敗しました');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#6a5518] text-sm">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl">
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
        <h1 className="text-xl font-bold text-[#d4af37]">キャスト編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#d4af37]">基本情報</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">名前 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">
                スラッグ *
                <span className="ml-1 font-normal text-[#6a5518]">（URL用・英数字とハイフンのみ）</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-1">メッセージ</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] resize-none bg-[#1a1a1a] text-[#d4af37]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">誕生日</label>
              <input
                type="text"
                value={form.birthday}
                onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                placeholder="例: 1月1日"
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">血液型</label>
              <input
                type="text"
                value={form.blood_type}
                onChange={(e) => setForm((p) => ({ ...p, blood_type: e.target.value }))}
                placeholder="例: A型"
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">趣味</label>
              <input
                type="text"
                value={form.hobby}
                onChange={(e) => setForm((p) => ({ ...p, hobby: e.target.value }))}
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
          </div>

        </div>

        {/* SNS */}
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#d4af37]">SNS</h2>
          {[
            { key: 'x_url', label: 'X (Twitter) URL' },
            { key: 'instagram_url', label: 'Instagram URL' },
            { key: 'tiktok_url', label: 'TikTok URL' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">{label}</label>
              <input
                type="url"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="https://"
                className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
          ))}
        </div>

        {/* Work settings */}
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#d4af37]">勤務設定</h2>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-2">デフォルト出勤曜日</label>
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleWorkday(i)}
                  className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                    form.default_workdays.includes(i)
                      ? 'border-[#d4af37] text-black'
                      : 'border-[#2a2a1a] text-[#c8a830] hover:border-[#d4af37]'
                  }`}
                  style={form.default_workdays.includes(i) ? { backgroundColor: '#d4af37' } : {}}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-2">デフォルト勤務時間</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={form.default_work_start}
                onChange={(e) => setForm((p) => ({ ...p, default_work_start: e.target.value }))}
                className="px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
              <span className="text-[#6a5518] text-sm">〜</span>
              <input
                type="time"
                value={form.default_work_end}
                onChange={(e) => setForm((p) => ({ ...p, default_work_end: e.target.value }))}
                className="px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c8a830] mb-1">表示順</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
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

        {/* Images */}
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#d4af37]">画像</h2>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-2">メイン画像</label>
            <ImageUpload
              bucket="cast-images"
              currentUrl={form.main_image_url || null}
              onUpload={(url) => setForm((p) => ({ ...p, main_image_url: url }))}
              label="メイン画像をアップロード"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-2">サブ画像（複数可）</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.sub_image_urls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a1a] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeSubImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <ImageUpload
              bucket="cast-images"
              onUpload={handleSubImageUpload}
              label="サブ画像を追加"
            />
          </div>
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
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-black disabled:opacity-70 transition-opacity"
            style={{ backgroundColor: '#d4af37' }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/cast')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222] transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
