'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Gallery } from '@/types';

type Props = {
  item: Gallery;
};

export default function GalleryItem({ item }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      {/* Grid Item */}
      <button
        onClick={() => setLightboxOpen(true)}
        className="group relative aspect-square overflow-hidden rounded-lg bg-surface-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label={item.caption ?? '画像を拡大表示'}
      >
        <Image
          src={item.image_url}
          alt={item.caption ?? ''}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </div>
      </button>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-accent transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="relative max-w-3xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              <Image
                src={item.image_url}
                alt={item.caption ?? ''}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain rounded-lg"
              />
            </div>
            {item.caption && (
              <p className="mt-3 text-center text-sm text-text-secondary">{item.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
