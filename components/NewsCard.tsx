import Image from 'next/image';
import Link from 'next/link';
import type { News } from '@/types';

type Props = {
  news: News;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function NewsCard({ news }: Props) {
  return (
    <Link
      href={`/news/${news.slug}`}
      className="group flex gap-4 p-4 rounded-lg bg-surface hover:bg-surface-2 transition-colors border border-border hover:border-accent/40 hover:shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded-md bg-surface-2">
        {news.thumbnail_url ? (
          <Image
            src={news.thumbnail_url}
            alt={news.title}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-xs">
            NO IMAGE
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {news.category && (
            <span className="inline-block mb-1.5 text-[10px] tracking-widest text-accent font-medium uppercase">
              {news.category}
            </span>
          )}
          <h3 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent-light transition-colors">
            {news.title}
          </h3>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {formatDate(news.published_at ?? news.created_at)}
        </p>
      </div>
    </Link>
  );
}
