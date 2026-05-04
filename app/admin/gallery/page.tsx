'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import ImageUpload from '@/components/admin/ImageUpload';
import type { Gallery } from '@/types';

const PER_PAGE = 20;

const CATEGORY_OPTIONS = ['店内', '店外', 'キャスト', 'イベント', 'フード・ドリンク', 'コスプレ', '誕生日', 'その他'];

export default function AdminGalleryPage() {
  const [gallery, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', category: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // カテゴリ順設定
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef(-1);

  const loadData = async (targetPage = 1) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (targetPage - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;
      const [galleryRes, shopRes] = await Promise.all([
        supabase
          .from('gallery')
          .select('*', { count: 'exact' })
          .order('sort_order')
          .range(from, to),
        supabase.from('shop').select('gallery_category_order').single(),
      ]);
      setGalleries((galleryRes.data as Gallery[]) ?? []);
      setTotalPages(Math.max(1, Math.ceil(((galleryRes.count ?? 0)) / PER_PAGE)));

      const saved = shopRes.data?.gallery_category_order;
      if (saved) {
        try { setCategoryOrder(JSON.parse(saved)); } catch { setCategoryOrder([]); }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 全ページのカテゴリを取得して order を補完
  const loadAllCategories = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from('gallery').select('category');
      const all = Array.from(new Set((data ?? []).map((g: { category: string | null }) => g.category).filter(Boolean))) as string[];
      setCategoryOrder((prev) => {
        const merged = [...prev.filter((c) => all.includes(c))];
        for (const c of all) { if (!merged.includes(c)) merged.push(c); }
        return merged;
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadData(page); }, [page]);
  useEffect(() => { loadAllCategories(); }, [loadAllCategories]);

  const saveCategoryOrder = async (order: string[]) => {
    setSavingOrder(true);
    try {
      const supabase = createClient();
      await supabase.from('shop').update({ gallery_category_order: JSON.stringify(order) }).eq('id', 1);
    } catch (err) {
      alert('保存に失敗しました: ' + String(err));
    } finally {
      setSavingOrder(false);
    }
  };

  // ドラッグ並び替え
  const handleOrderDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleOrderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleOrderDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === toIndex || fromIndex < 0) { setDragOverIndex(null); return; }
    const next = [...categoryOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setCategoryOrder(next);
    setDragOverIndex(null);
    dragIndexRef.current = -1;
  };

  const handleUpload = async (url: string) => {
    try {
      const supabase = createClient();
      const { data: maxData } = await supabase
        .from('gallery')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      const maxSortOrder = (maxData as { sort_order: number } | null)?.sort_order ?? 0;
      const { error } = await supabase.from('gallery').insert([{
        image_url: url,
        is_public: false,
        sort_order: maxSortOrder + 1,
      }]);
      if (error) throw error;
      const { count } = await supabase.from('gallery').select('*', { count: 'exact', head: true });
      const lastPage = Math.max(1, Math.ceil(((count ?? 0)) / PER_PAGE));
      setPage(lastPage);
      if (lastPage === page) loadData(lastPage);
      loadAllCategories();
    } catch (err) {
      alert('アップロードに失敗しました: ' + String(err));
    }
  };

  const togglePublic = async (item: Gallery) => {
    try {
      const supabase = createClient();
      await supabase.from('gallery').update({ is_public: !item.is_public }).eq('id', item.id);
      setGalleries((prev) => prev.map((g) => g.id === item.id ? { ...g, is_public: !g.is_public } : g));
    } catch (err) {
      alert('更新に失敗しました: ' + String(err));
    }
  };

  const startEdit = (item: Gallery) => {
    setEditingId(item.id);
    setEditForm({ caption: item.caption ?? '', category: item.category ?? '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from('gallery')
        .update({ caption: editForm.caption || null, category: editForm.category || null })
        .eq('id', id);
      setGalleries((prev) =>
        prev.map((g) => g.id === id ? { ...g, caption: editForm.caption || null, category: editForm.category || null } : g)
      );
      setEditingId(null);
      loadAllCategories();
    } catch (err) {
      alert('保存に失敗しました: ' + String(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      const supabase = createClient();
      const item = gallery.find((g) => g.id === id);
      await supabase.from('gallery').delete().eq('id', id);
      setGalleries((prev) => prev.filter((g) => g.id !== id));
      if (item?.image_url) {
        const { data: { publicUrl } } = supabase.storage.from('gallery-images').getPublicUrl('');
        const baseUrl = publicUrl.replace(/\/$/, '');
        if (item.image_url.startsWith(baseUrl + '/')) {
          const path = item.image_url.slice(baseUrl.length + 1);
          await supabase.storage.from('gallery-images').remove([path]);
        }
      }
    } catch (err) {
      alert('削除に失敗しました: ' + String(err));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-[#d4af37] mb-6">ギャラリー管理</h1>

      {/* Upload */}
      <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 mb-4">
        <h2 className="text-sm font-semibold text-[#d4af37] mb-3">画像を追加</h2>
        <ImageUpload
          bucket="gallery-images"
          onUpload={handleUpload}
          label="ギャラリー画像をアップロード"
        />
      </div>

      {/* Category order panel */}
      <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOrderPanel((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-[#c8a830] hover:bg-[#1a1a0a] transition-colors"
        >
          <span>カテゴリの表示順</span>
          <svg
            className={`w-4 h-4 transition-transform ${showOrderPanel ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showOrderPanel && (
          <div className="px-5 pb-4 border-t border-[#2a2a1a]">
            <p className="text-[11px] text-[#4a4018] mt-3 mb-3">ドラッグして並び替え。公開ページのカテゴリ表示順に反映されます。</p>
            <div className="space-y-1.5 mb-4">
              {categoryOrder.length === 0 && (
                <p className="text-xs text-[#4a4018] py-2">カテゴリが設定された画像がありません</p>
              )}
              {categoryOrder.map((cat, i) => (
                <div
                  key={cat}
                  draggable
                  onDragStart={() => handleOrderDragStart(i)}
                  onDragOver={(e) => handleOrderDragOver(e, i)}
                  onDrop={(e) => handleOrderDrop(e, i)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-colors select-none ${
                    dragOverIndex === i
                      ? 'border-[#d4af37] bg-[#2a2a10]'
                      : 'border-[#2a2a1a] bg-[#1a1a0a] hover:bg-[#1a1a12]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-[#4a4018] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="text-sm text-[#c8a830] flex-1">{cat}</span>
                  <span className="text-[10px] text-[#4a4018]">{i + 1}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => saveCategoryOrder(categoryOrder)}
              disabled={savingOrder || categoryOrder.length === 0}
              className="px-4 py-2 text-sm font-medium rounded-lg text-black disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#d4af37' }}
            >
              {savingOrder ? '保存中...' : '順番を保存'}
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-8 text-center text-[#6a5518] text-sm">読み込み中...</div>
      ) : gallery.length === 0 ? (
        <div className="p-8 text-center text-[#6a5518] text-sm">ギャラリーがありません</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {gallery.map((item) => (
            <div key={item.id} className="bg-[#111111] rounded-xl border border-[#2a2a1a] overflow-hidden group">
              <div className="relative aspect-square bg-[#1a1a1a]">
                <Image
                  src={item.image_url}
                  alt={item.caption ?? ''}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${item.is_public ? 'bg-green-500 text-white' : 'bg-[#4a4010] text-[#d4af37]'}`}>
                    {item.is_public ? '公開' : '非公開'}
                  </span>
                </div>
                {item.category && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-[#c8a830]">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2.5 space-y-2">
                {editingId === item.id ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editForm.caption}
                      onChange={(e) => setEditForm((p) => ({ ...p, caption: e.target.value }))}
                      placeholder="キャプション"
                      className="w-full px-2 py-1 text-xs border border-[#2a2a1a] rounded focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                    />
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-[#2a2a1a] rounded focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                    >
                      <option value="">未選択</option>
                      {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      className="w-full py-1 text-xs font-medium text-black rounded"
                      style={{ backgroundColor: '#d4af37' }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <>
                    {item.caption && <p className="text-[11px] text-[#8a7020] truncate">{item.caption}</p>}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => togglePublic(item)}
                        className={`flex-1 py-1 text-[11px] font-medium rounded transition-colors ${
                          item.is_public
                            ? 'bg-[#0a2a0a] text-[#4ade80] hover:bg-[#0a1a0a]'
                            : 'bg-[#1a1a1a] text-[#6a5518] hover:bg-[#222222]'
                        }`}
                        title={item.is_public ? 'クリックで非公開にする' : 'クリックで公開する'}
                      >
                        {item.is_public ? '● 公開中' : '○ 非公開'}
                      </button>
                      <button type="button" onClick={() => startEdit(item)} className="py-1 px-2 text-[11px] rounded bg-[#1a1a1a] text-[#c8a830] hover:bg-[#222222]">
                        編集
                      </button>
                      <button type="button" onClick={() => handleDelete(item.id)} className="py-1 px-2 text-[11px] rounded bg-red-50 text-red-500 hover:bg-red-100">
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-40 transition-colors">
            前へ
          </button>
          <span className="text-xs text-[#8a7020]">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-40 transition-colors">
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
