'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

type Props = {
  bucket: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  accept?: string;
  label?: string;
};

export default function ImageUpload({
  bucket,
  currentUrl,
  onUpload,
  accept = 'image/*',
  label = '画像をアップロード',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const deleteStorageFile = async (url: string) => {
    try {
      const supabase = createClient();
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl('');
      const baseUrl = publicUrl.replace(/\/$/, '');
      if (url.startsWith(baseUrl + '/')) {
        const path = url.slice(baseUrl.length + 1);
        await supabase.storage.from(bucket).remove([path]);
      }
    } catch {
      // 削除失敗は無視（アップロードを優先）
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      if (currentUrl) {
        await deleteStorageFile(currentUrl);
      }

      onUpload(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {currentUrl && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a1a]">
          <Image
            src={currentUrl}
            alt="preview"
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#2a2a1a] rounded-lg p-6 text-center hover:border-[#d4af37]/40 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#8a7020]">アップロード中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-[#6a5518]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-[#8a7020]">{label}</p>
            <p className="text-xs text-[#6a5518]">クリックまたはドラッグ&ドロップ</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
