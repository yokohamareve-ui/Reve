import type { Metadata } from 'next';
import { getCasts } from '@/lib/data';
import CastCard from '@/components/CastCard';

export const metadata: Metadata = {
  title: 'CAST',
  description: 'キャスト一覧。個性豊かなキャストたちをご紹介します。',
};

export const revalidate = 0;

export default async function CastPage() {
  const casts = await getCasts().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <p className="section-title">Our Cast</p>
        <h1 className="section-heading">キャスト一覧</h1>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-accent" />
      </div>

      {casts.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p>現在公開中のキャスト情報はありません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {casts.map((cast) => (
            <CastCard key={cast.id} cast={cast} />
          ))}
        </div>
      )}
    </div>
  );
}
