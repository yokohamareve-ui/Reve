'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { News } from '@/types';

const PER_PAGE = 20;

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (targetPage = 1) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const from = (targetPage - 1) * PER_PAGE;
      const to = from + PER_PAGE - 1;
      const { data, count } = await supabase
        .from('news')
        .select('*', { count: 'exact' })
        .order('published_at', { ascending: false })
        .range(from, to);
      setNewsList((data as News[]) ?? []);
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
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
      return;
    }
    setNewsList((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#d4af37]">ニュース管理</h1>
        <Link
          href="/admin/news/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black"
          style={{ backgroundColor: '#d4af37' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Link>
      </div>

      <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#6a5518] text-sm">読み込み中...</div>
        ) : newsList.length === 0 ? (
          <div className="p-8 text-center text-[#6a5518] text-sm">ニュースがありません</div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {newsList.map((news) => (
              <div key={news.id} className="px-4 py-3 hover:bg-[#1a1a1a] transition-colors">
                <p className="font-medium text-[#d4af37] text-sm truncate mb-2">{news.title}</p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-[#8a7020]">
                  {news.category && <span>{news.category}</span>}
                  <span>{formatDate(news.published_at)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium ${
                      news.is_public ? 'bg-[#0a1a0a] text-[#4ade80]' : 'bg-[#1a1a1a] text-[#6a5518]'
                    }`}
                  >
                    {news.is_public ? '公開' : '非公開'}
                  </span>
                  <Link
                    href={`/admin/news/${news.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a1a] text-[#c8a830] hover:bg-[#222222] transition-colors"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(news.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    削除
                  </button>
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
