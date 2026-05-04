import type { Metadata } from 'next';
import { getNewsList } from '@/lib/data';
import NewsCard from '@/components/NewsCard';

export const metadata: Metadata = {
  title: 'NEWS',
  description: '最新ニュース・お知らせ一覧。',
};

export const revalidate = 0;

export default async function NewsListPage() {
  const result = await getNewsList(20).catch(() => ({ data: [], count: 0 }));
  const newsList = result.data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <p className="section-title">News</p>
        <h1 className="section-heading">ニュース</h1>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-accent" />
      </div>

      {newsList.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p>現在公開中のニュースはありません。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsList.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      )}
    </div>
  );
}
