'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Cast, Schedule } from '@/types';

export default function EditSchedulePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCasts, setAllCasts] = useState<Cast[]>([]);

  const [form, setForm] = useState({
    date: '',
    note: '',
    is_public: false,
    selectedCastIds: [] as string[],
    castTimes: {} as Record<string, { start: string; end: string }>,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const [scheduleRes, castsRes] = await Promise.all([
          supabase
            .from('schedules')
            .select('*, casts:schedule_casts(cast:casts(*), work_start, work_end)')
            .eq('id', id)
            .single(),
          supabase.from('casts').select('*').order('sort_order'),
        ]);

        if (scheduleRes.error) throw scheduleRes.error;

        type RawScheduleCast = { cast: Cast; work_start: string | null; work_end: string | null };
        type RawSchedule = Omit<Schedule, 'casts'> & { casts: RawScheduleCast[] };
        const schedule = scheduleRes.data as unknown as RawSchedule;
        const castIds = (schedule.casts ?? []).map((sc) => sc.cast.id);
        const castTimes = Object.fromEntries(
          (schedule.casts ?? []).map((sc) => [sc.cast.id, { start: sc.work_start ?? '', end: sc.work_end ?? '' }])
        );

        setForm({
          date: schedule.date ?? '',
          note: schedule.note ?? '',
          is_public: schedule.is_public ?? false,
          selectedCastIds: castIds,
          castTimes,
        });

        setAllCasts((castsRes.data as Cast[]) ?? []);
      } catch {
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleCast = (castId: string) => {
    setForm((prev) => {
      if (prev.selectedCastIds.includes(castId)) {
        return { ...prev, selectedCastIds: prev.selectedCastIds.filter((c) => c !== castId) };
      }
      const cast = allCasts.find((c) => c.id === castId);
      return {
        ...prev,
        selectedCastIds: [...prev.selectedCastIds, castId],
        castTimes: {
          ...prev.castTimes,
          [castId]: { start: cast?.default_work_start ?? '', end: cast?.default_work_end ?? '' },
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('schedules')
        .update({
          date: form.date,
          note: form.note || null,
          is_public: form.is_public,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Sync schedule_casts
      await supabase.from('schedule_casts').delete().eq('schedule_id', id);
      if (form.selectedCastIds.length > 0) {
        await supabase.from('schedule_casts').insert(
          form.selectedCastIds.map((cast_id) => ({
            schedule_id: id,
            cast_id,
            work_start: form.castTimes[cast_id]?.start || null,
            work_end: form.castTimes[cast_id]?.end || null,
          }))
        );
      }

      router.push('/admin/schedule');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#6a5518] text-sm">読み込み中...</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-[#6a5518] hover:bg-[#1a1a1a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#d4af37]">シフト編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-1">日付</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-2">出勤キャスト</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-[#2a2a1a] rounded-lg p-3">
              {allCasts.map((cast) => (
                <div key={cast.id}>
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={form.selectedCastIds.includes(cast.id)}
                      onChange={() => toggleCast(cast.id)}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                    <span className="text-sm text-[#d4af37]">{cast.name}</span>
                  </label>
                  {form.selectedCastIds.includes(cast.id) && (
                    <div className="flex items-center gap-2 ml-6 mt-1">
                      <input
                        type="time"
                        value={form.castTimes[cast.id]?.start ?? ''}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            castTimes: {
                              ...prev.castTimes,
                              [cast.id]: { ...prev.castTimes[cast.id], start: e.target.value },
                            },
                          }))
                        }
                        className="px-2 py-1 border border-[#2a2a1a] rounded-lg text-xs focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                      />
                      <span className="text-[#6a5518] text-xs">〜</span>
                      <input
                        type="time"
                        value={form.castTimes[cast.id]?.end ?? ''}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            castTimes: {
                              ...prev.castTimes,
                              [cast.id]: { ...prev.castTimes[cast.id], end: e.target.value },
                            },
                          }))
                        }
                        className="px-2 py-1 border border-[#2a2a1a] rounded-lg text-xs focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c8a830] mb-1">備考</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] resize-none bg-[#1a1a1a] text-[#d4af37]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
              className="w-4 h-4 accent-[#d4af37]"
            />
            <span className="text-sm text-[#d4af37]">公開する</span>
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-black disabled:opacity-70"
            style={{ backgroundColor: '#d4af37' }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/schedule')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222]"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
