import type { Metadata } from 'next';
import { getGalleries, getShop } from '@/lib/data';
import GalleryItem from '@/components/GalleryItem';

export const metadata: Metadata = {
  title: 'GALLERY',
  description: 'ギャラリー。店内やキャストの写真をご覧いただけます。',
};

export const revalidate = 0;

export default async function GalleryPage() {
  const [galleries, shop] = await Promise.all([
    getGalleries(60).catch(() => []),
    getShop().catch(() => null),
  ]);

  // カテゴリ順を shop テーブルから取得、なければ出現順
  let savedOrder: string[] = [];
  try {
    if (shop?.gallery_category_order) savedOrder = JSON.parse(shop.gallery_category_order);
  } catch { /* ignore */ }

  const allCategories = Array.from(new Set(galleries.map((g) => g.category).filter(Boolean))) as string[];
  const categories = [
    ...savedOrder.filter((c) => allCategories.includes(c)),
    ...allCategories.filter((c) => !savedOrder.includes(c)),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <p className="section-title">Gallery</p>
        <h1 className="section-heading">ギャラリー</h1>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-accent" />
      </div>

      {galleries.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p>現在公開中のギャラリーはありません。</p>
        </div>
      ) : (
        <>
          {categories.length > 0 ? (
            // Categorized display
            <div className="space-y-12">
              {categories.map((category) => {
                const items = galleries.filter((g) => g.category === category);
                return (
                  <section key={category}>
                    <h2 className="text-sm tracking-widest text-accent mb-6 uppercase">{category}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                      {items.map((item) => (
                        <GalleryItem key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                );
              })}
              {/* Items without category */}
              {(() => {
                const uncategorized = galleries.filter((g) => !g.category);
                if (uncategorized.length === 0) return null;
                return (
                  <section>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                      {uncategorized.map((item) => (
                        <GalleryItem key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                );
              })()}
            </div>
          ) : (
            // Simple grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {galleries.map((item) => (
                <GalleryItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
