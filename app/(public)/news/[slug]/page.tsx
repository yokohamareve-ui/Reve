import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsBySlug, getNewsSlugs } from '@/lib/data';

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const slugs = await getNewsSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug).catch(() => null);
  if (!news) return { title: 'ニュース' };
  return {
    title: news.title,
    description: news.title,
    openGraph: {
      title: news.title,
      images: news.thumbnail_url ? [{ url: news.thumbnail_url }] : [],
    },
  };
}

export const revalidate = 0;

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function NewsDetailPage({ params }: Props) {
  const news = await getNewsBySlug(params.slug).catch(() => null);

  if (!news || !news.is_public) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Back */}
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-xs tracking-widest text-text-muted hover:text-accent transition-colors mb-10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        NEWS 一覧へ
      </Link>

      {/* Category & Date */}
      <div className="flex items-center gap-3 mb-4">
        {news.category && (
          <span className="text-xs tracking-widest text-accent font-medium uppercase">
            {news.category}
          </span>
        )}
        <span className="text-xs text-text-muted">
          {formatDate(news.published_at ?? news.created_at)}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight mb-8">
        {news.title}
      </h1>

      {/* Thumbnail */}
      {news.thumbnail_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-10 bg-surface-2">
          <Image
            src={news.thumbnail_url}
            alt={news.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      {news.content && (
        <div
          className="richtext"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      )}

      {/* Back to list */}
      <div className="mt-12 pt-8 border-t border-border">
        <Link href="/news" className="btn-outline">
          ニュース一覧へ戻る
        </Link>
      </div>
    </article>
  );
}
