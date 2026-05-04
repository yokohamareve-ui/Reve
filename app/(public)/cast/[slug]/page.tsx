import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCastBySlug, getCastSlugs } from '@/lib/data';

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const slugs = await getCastSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cast = await getCastBySlug(params.slug).catch(() => null);
  if (!cast) return { title: 'キャスト詳細' };
  return {
    title: cast.name,
    description: cast.message ?? `${cast.name}のプロフィールページ`,
  };
}

export const revalidate = 0;

const profileItems = [
  { key: 'birthday', label: '誕生日' },
  { key: 'blood_type', label: '血液型' },
  { key: 'hobby', label: '趣味' },
] as const;

export default async function CastDetailPage({ params }: Props) {
  const cast = await getCastBySlug(params.slug).catch(() => null);

  if (!cast || !cast.is_public) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Back */}
      <Link
        href="/cast"
        className="inline-flex items-center gap-2 text-xs tracking-widest text-text-muted hover:text-accent transition-colors mb-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        CAST 一覧へ
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Main Image */}
        <div>
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-2">
            {cast.main_image_url && (
              <Image
                src={cast.main_image_url}
                alt={cast.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>

          {/* Sub Images */}
          {cast.sub_image_urls && cast.sub_image_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {cast.sub_image_urls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-2">
                  <Image
                    src={url}
                    alt={`${cast.name} - ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div>
          <div className="mb-2">
            <p className="text-xs tracking-widest text-accent">CAST</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-6">
            {cast.name}
          </h1>

          {/* Message */}
          {cast.message && (
            <div className="mb-8 p-5 rounded-xl bg-surface border border-border shadow-sm">
              <p className="text-xs tracking-widest text-accent mb-3">MESSAGE</p>
              <p className="text-text-secondary text-sm leading-relaxed">{cast.message}</p>
            </div>
          )}

          {/* Profile Table */}
          <div className="mb-8 space-y-3">
            {profileItems.map(({ key, label }) =>
              cast[key] ? (
                <div key={key} className="flex items-center gap-4 py-3 border-b border-border">
                  <span className="text-xs tracking-widest text-accent w-20 flex-shrink-0">{label}</span>
                  <span className="text-sm text-text-secondary">{cast[key]}</span>
                </div>
              ) : null
            )}
          </div>

          {/* SNS Links */}
          <div className="flex flex-wrap gap-3">
            {cast.x_url && (
              <a
                href={cast.x_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs py-2 px-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X (Twitter)
              </a>
            )}
            {cast.instagram_url && (
              <a
                href={cast.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs py-2 px-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>
            )}
            {cast.tiktok_url && (
              <a
                href={cast.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs py-2 px-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
                TikTok
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
