'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Cast, Profile } from '@/types';

const PER_PAGE = 20;

export default function AdminCastPage() {
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dragIndex = useRef<number | null>(null);

  const load = async (targetPage = 1) => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData as Profile | null);

      const from = (targetPage - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;

      let query = supabase.from('casts').select('*', { count: 'exact' }).order('sort_order').range(from, to);

      if (profileData?.role === 'cast' && profileData.cast_id) {
        query = query.eq('id', profileData.cast_id);
      }

      const { data, count } = await query;
      setCasts((data as Cast[]) ?? []);
      setTotalPages(Math.max(1, Math.ceil((count ?? 0) / PER_PAGE)));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;

    const supabase = createClient();
    const { error } = await supabase.from('casts').delete().eq('id', id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
      return;
    }
    setCasts((prev) => prev.filter((c) => c.id !== id));
  };

  const canReorder = profile?.role === 'owner' || profile?.role === 'staff';

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;

    const newCasts = [...casts];
    const dragged = newCasts.splice(dragIndex.current, 1)[0];
    newCasts.splice(index, 0, dragged);
    dragIndex.current = index;
    setCasts(newCasts);
  };

  const handleDragEnd = async () => {
    dragIndex.current = null;
    if (!canReorder) return;

    setSavingOrder(true);
    try {
      const supabase = createClient();
      const offset = (page - 1) * PER_PAGE;
      await Promise.all(
        casts.map((cast, i) =>
          supabase.from('casts').update({ sort_order: offset + i + 1 }).eq('id', cast.id)
        )
      );
    } catch {
      alert('表示順の保存に失敗しました');
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#d4af37]">キャスト管理</h1>
          {savingOrder && (
            <span className="text-xs text-[#8a7020]">並び順を保存中...</span>
          )}
        </div>
        {(profile?.role === 'owner' || profile?.role === 'staff' || !profile) && (
          <Link
            href="/admin/cast/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black"
            style={{ backgroundColor: '#d4af37' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </Link>
        )}
      </div>

      {canReorder && !loading && casts.length > 1 && (
        <p className="text-xs text-[#6a5518] mb-3">行をドラッグして表示順を変更できます（現在のページ内のみ）</p>
      )}

      <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#6a5518] text-sm">読み込み中...</div>
        ) : casts.length === 0 ? (
          <div className="p-8 text-center text-[#6a5518] text-sm">キャストがいません</div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {casts.map((cast, index) => (
              <div
                key={cast.id}
                className="px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                draggable={canReorder}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={canReorder ? { cursor: 'grab' } : undefined}
              >
                <div className="flex items-center gap-3 mb-2">
                  {canReorder && (
                    <svg className="w-4 h-4 text-[#4a3a10] flex-shrink-0 select-none" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    </svg>
                  )}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                    {cast.main_image_url && (
                      <Image
                        src={cast.main_image_url}
                        alt={cast.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="font-medium text-[#d4af37] text-sm">{cast.name}</span>
                  <span className="text-xs text-[#6a5518] ml-auto">{(page - 1) * PER_PAGE + index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium ${
                      cast.is_public
                        ? 'bg-[#0a1a0a] text-[#4ade80]'
                        : 'bg-[#1a1a1a] text-[#6a5518]'
                    }`}
                  >
                    {cast.is_public ? '公開' : '非公開'}
                  </span>
                  {(profile?.role === 'owner' || profile?.role === 'staff' || cast.id === profile?.cast_id) && (
                    <Link
                      href={`/admin/cast/${cast.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a1a] text-[#c8a830] hover:bg-[#222222] transition-colors"
                    >
                      編集
                    </Link>
                  )}
                  {profile?.role === 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(cast.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-40 transition-colors"
          >
            前へ
          </button>
          <span className="text-xs text-[#8a7020]">{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222] disabled:opacity-40 transition-colors"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
