import type { Metadata } from 'next';
import Image from 'next/image';
import { getShop } from '@/lib/data';

export const metadata: Metadata = {
  title: 'SYSTEM',
  description: '料金・メニューのご案内。',
};

export const revalidate = 0;

export default async function SystemPage() {
  const shop = await getShop().catch(() => null);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <p className="section-title">System</p>
        <h1 className="section-heading">料金・メニュー</h1>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-accent" />
      </div>

      {shop?.menu_image_url && (
        <div className="mb-10">
          <Image
            src={shop.menu_image_url}
            alt="料金・メニュー"
            width={900}
            height={600}
            className="w-full h-auto rounded-lg"
            priority
          />
        </div>
      )}

      {shop?.system_text ? (
        <div
          className="richtext"
          dangerouslySetInnerHTML={{ __html: shop.system_text }}
        />
      ) : (
        !shop?.menu_image_url && (
          <div className="text-center py-20 text-text-muted">
            <p>現在準備中です。</p>
          </div>
        )
      )}
    </div>
  );
}
