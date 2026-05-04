'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import ScheduleCalendar from '@/components/admin/ScheduleCalendar';
import type { Schedule, Cast } from '@/types';

type ScheduleWithTimes = Schedule & { castTimes: Record<string, { start: string; end: string }> };

type ModalState = {
  open: boolean;
  date: string;
  schedule?: Schedule;
};

export default function AdminSchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [schedules, setSchedules] = useState<ScheduleWithTimes[]>([]);
  const [allCasts, setAllCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<'owner' | 'staff' | 'cast' | null>(null);
  const [myCastId, setMyCastId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, date: '' });
  const [modalCastIds, setModalCastIds] = useState<string[]>([]);
  const [modalCastTimes, setModalCastTimes] = useState<Record<string, { start: string; end: string }>>({});
  const [modalNote, setModalNote] = useState('');
  const [modalPublic, setModalPublic] = useState(false);
  const [savingModal, setSavingModal] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [bulkPublishLoading, setBulkPublishLoading] = useState(false);
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // キャストパネルの一時的なデフォルト時間（DBには保存しない）
  const [localCastTimes, setLocalCastTimes] = useState<Record<string, { start: string; end: string }>>({});

  // ログインユーザーのロールと cast_id を取得
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('role, cast_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setMyRole(data.role as 'owner' | 'staff' | 'cast');
            setMyCastId(data.cast_id ?? null);
          }
        });
    });
  }, []);

  // allCasts がロードされたら localCastTimes を初期化（未設定分のみ）
  useEffect(() => {
    setLocalCastTimes((prev) => {
      const next = { ...prev };
      for (const cast of allCasts) {
        if (!next[cast.id]) {
          next[cast.id] = {
            start: cast.default_work_start ?? '',
            end: cast.default_work_end ?? '',
          };
        }
      }
      return next;
    });
  }, [allCasts]);

  // キャスト時間編集ミニモーダル
  const [castTimeModal, setCastTimeModal] = useState<{
    open: boolean;
    date: string;
    castId: string;
    castName: string;
    start: string;
    end: string;
    scheduleId: string;
  } | null>(null);
  const [savingCastTime, setSavingCastTime] = useState(false);

  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

  const parseSchedules = (data: Record<string, unknown>[]): ScheduleWithTimes[] =>
    data.map((s) => ({
      ...s,
      casts: ((s.casts as Array<{ cast: Cast; work_start: string | null; work_end: string | null }>) ?? []).map((sc) => sc.cast).filter(Boolean),
      castTimes: Object.fromEntries(
        ((s.casts as Array<{ cast: Cast; work_start: string | null; work_end: string | null }>) ?? [])
          .filter((sc) => sc.cast)
          .map((sc) => [sc.cast.id, { start: sc.work_start ?? '', end: sc.work_end ?? '' }])
      ),
    })) as ScheduleWithTimes[];

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const supabase = createClient();
      const [schedulesRes, castsRes] = await Promise.all([
        supabase
          .from('schedules')
          .select('*, casts:schedule_casts(cast:casts(*), work_start, work_end)')
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date'),
        supabase.from('casts').select('*').order('sort_order'),
      ]);
      setSchedules(parseSchedules(schedulesRes.data ?? []));
      setAllCasts((castsRes.data as Cast[]) ?? []);
    } catch {
      // ignore
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [startOfMonth, endOfMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 初回ロード完了後、今日の行へスクロール
  useEffect(() => {
    if (loading) return;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (now.getFullYear() !== year || now.getMonth() + 1 !== month) return;
    const el = calendarScrollRef.current?.querySelector<HTMLElement>(`[data-date="${todayStr}"]`);
    if (el) el.scrollIntoView({ block: 'start' });
  }, [loading]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // cast ロールの場合は自分のキャストのみ操作可能
  const editableCasts = myRole === 'cast'
    ? allCasts.filter((c) => c.id === myCastId)
    : allCasts;

  const openModal = (date: string, schedule?: Schedule) => {
    setModal({ open: true, date, schedule });
    setModalCastIds((schedule?.casts ?? []).map((c) => c.id));
    const s = schedule as (Schedule & { castTimes?: Record<string, { start: string; end: string }> }) | undefined;
    const existingTimes = s?.castTimes ?? {};
    const initialTimes: Record<string, { start: string; end: string }> = {};
    for (const cast of allCasts) {
      initialTimes[cast.id] = existingTimes[cast.id] ?? {
        start: cast.default_work_start ?? '',
        end: cast.default_work_end ?? '',
      };
    }
    setModalCastTimes(initialTimes);
    setModalNote(schedule?.note ?? '');
    setModalPublic(schedule?.is_public ?? false);
  };

  const closeModal = () => setModal({ open: false, date: '' });

  const toggleModalCast = (id: string) => {
    setModalCastIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      const cast = allCasts.find((c) => c.id === id);
      setModalCastTimes((times) => ({
        ...times,
        [id]: { start: cast?.default_work_start ?? '', end: cast?.default_work_end ?? '' },
      }));
      return [...prev, id];
    });
  };

  const saveModal = async () => {
    setSavingModal(true);
    try {
      const supabase = createClient();
      let scheduleId = modal.schedule?.id;

      if (scheduleId) {
        if (myRole !== 'cast') {
          await supabase
            .from('schedules')
            .update({ note: modalNote || null, is_public: modalPublic, updated_at: new Date().toISOString() })
            .eq('id', scheduleId);
        }
      } else {
        const { data } = await supabase
          .from('schedules')
          .insert([{ date: modal.date, note: myRole !== 'cast' ? (modalNote || null) : null, is_public: false }])
          .select()
          .single();
        scheduleId = data?.id;
      }

      if (scheduleId) {
        if (myRole === 'cast' && myCastId) {
          // cast ロール: 自分のキャストのみ追加/削除
          await supabase
            .from('schedule_casts')
            .delete()
            .eq('schedule_id', scheduleId)
            .eq('cast_id', myCastId);
          if (modalCastIds.includes(myCastId)) {
            await supabase.from('schedule_casts').insert([{
              schedule_id: scheduleId,
              cast_id: myCastId,
              work_start: modalCastTimes[myCastId]?.start || null,
              work_end: modalCastTimes[myCastId]?.end || null,
            }]);
          }
        } else {
          await supabase.from('schedule_casts').delete().eq('schedule_id', scheduleId);
          if (modalCastIds.length > 0) {
            await supabase.from('schedule_casts').insert(
              modalCastIds.map((cast_id) => ({
                schedule_id: scheduleId,
                cast_id,
                work_start: modalCastTimes[cast_id]?.start || null,
                work_end: modalCastTimes[cast_id]?.end || null,
              }))
            );
          }
        }
      }

      closeModal();
      loadData();
    } catch (err) {
      alert('保存に失敗しました: ' + String(err));
    } finally {
      setSavingModal(false);
    }
  };

  // キャストバッジクリック → 時間編集ミニモーダルを開く
  const handleClickCast = (date: string, castId: string, schedule: ScheduleWithTimes) => {
    if (myRole === 'cast' && castId !== myCastId) return;
    const cast = allCasts.find((c) => c.id === castId);
    const times = schedule.castTimes?.[castId];
    setCastTimeModal({
      open: true,
      date,
      castId,
      castName: cast?.name ?? '',
      start: times?.start ?? '',
      end: times?.end ?? '',
      scheduleId: schedule.id,
    });
  };

  const saveCastTime = async () => {
    if (!castTimeModal) return;
    setSavingCastTime(true);
    // 楽観的更新
    updateScheduleLocally(castTimeModal.date, (s) => ({
      ...s,
      castTimes: {
        ...s.castTimes,
        [castTimeModal.castId]: { start: castTimeModal.start, end: castTimeModal.end },
      },
    }));
    setCastTimeModal(null);
    try {
      const supabase = createClient();
      await supabase
        .from('schedule_casts')
        .update({
          work_start: castTimeModal.start || null,
          work_end: castTimeModal.end || null,
        })
        .eq('schedule_id', castTimeModal.scheduleId)
        .eq('cast_id', castTimeModal.castId);
    } catch (err) {
      loadData(false);
      alert('保存に失敗しました: ' + String(err));
    } finally {
      setSavingCastTime(false);
    }
  };

  // ローカル状態だけを更新するヘルパー
  const updateScheduleLocally = (dateStr: string, updater: (s: ScheduleWithTimes) => ScheduleWithTimes, newSchedule?: ScheduleWithTimes) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.date === dateStr);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updater(prev[idx]);
        return next;
      }
      // 新規スケジュールの場合は挿入してソート
      if (newSchedule) {
        return [...prev, newSchedule].sort((a, b) => a.date.localeCompare(b.date));
      }
      return prev;
    });
  };

  // ドラッグ&ドロップでキャストをシフトから外す
  const handleRemoveCast = async (dateStr: string, castId: string) => {
    if (myRole === 'cast' && castId !== myCastId) return;
    const existing = schedules.find((s) => s.date === dateStr);
    if (!existing?.id) return;

    // 楽観的更新
    updateScheduleLocally(dateStr, (s) => ({
      ...s,
      casts: (s.casts ?? []).filter((c) => c.id !== castId),
      castTimes: Object.fromEntries(Object.entries(s.castTimes).filter(([id]) => id !== castId)),
    }));

    try {
      const supabase = createClient();
      await supabase
        .from('schedule_casts')
        .delete()
        .eq('schedule_id', existing.id)
        .eq('cast_id', castId);
    } catch (err) {
      // ロールバック
      loadData(false);
      alert('キャストの削除に失敗しました: ' + String(err));
    }
  };

  // ドラッグ&ドロップでキャストを追加
  const handleDropCast = async (dateStr: string, castId: string) => {
    if (myRole === 'cast' && castId !== myCastId) return;
    const cast = allCasts.find((c) => c.id === castId);
    if (!cast) return;

    const existing = schedules.find((s) => s.date === dateStr);

    // 重複チェック
    if ((existing?.casts ?? []).some((c) => c.id === castId)) return;

    const newCastTime = localCastTimes[castId] ?? { start: cast.default_work_start ?? '', end: cast.default_work_end ?? '' };

    if (existing) {
      // 楽観的更新（既存スケジュールにキャスト追加）
      updateScheduleLocally(dateStr, (s) => ({
        ...s,
        casts: [...(s.casts ?? []), cast],
        castTimes: { ...s.castTimes, [castId]: newCastTime },
      }));
    } else {
      // 楽観的更新（新規スケジュール）
      const optimistic: ScheduleWithTimes = {
        id: `optimistic-${dateStr}`,
        date: dateStr,
        note: null,
        is_public: false,
        created_at: '',
        updated_at: '',
        casts: [cast],
        castTimes: { [castId]: newCastTime },
      };
      updateScheduleLocally(dateStr, (s) => s, optimistic);
    }

    try {
      const supabase = createClient();
      let scheduleId: string | undefined = existing?.id;

      if (!scheduleId) {
        const { data } = await supabase
          .from('schedules')
          .insert([{ date: dateStr, is_public: false }])
          .select()
          .single();
        scheduleId = data?.id;
        // 仮IDを本物のIDに差し替え
        if (scheduleId) {
          setSchedules((prev) => prev.map((s) =>
            s.date === dateStr && s.id.startsWith('optimistic-')
              ? { ...s, id: scheduleId! }
              : s
          ));
        }
      }

      if (!scheduleId) return;

      await supabase.from('schedule_casts').insert([{
        schedule_id: scheduleId,
        cast_id: castId,
        work_start: newCastTime.start || null,
        work_end: newCastTime.end || null,
      }]);
    } catch (err) {
      // ロールバック
      loadData(false);
      alert('キャストの追加に失敗しました: ' + String(err));
    }
  };

  const autoGenerate = async () => {
    if (!confirm(`${year}年${month}月のシフトを自動生成しますか？`)) return;
    setAutoGenLoading(true);
    try {
      const supabase = createClient();
      const casts = allCasts;
      const dates: string[] = [];
      for (let d = 1; d <= lastDayNum; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dates.push(dateStr);
      }

      for (const dateStr of dates) {
        const dayOfWeek = new Date(dateStr).getDay();
        const castsForDay = casts.filter((c) => c.default_workdays.includes(dayOfWeek));
        const existing = schedules.find((s) => s.date === dateStr);
        let scheduleId: string | undefined = existing?.id;
        if (!scheduleId) {
          const { data } = await supabase
            .from('schedules')
            .insert([{ date: dateStr, is_public: false }])
            .select()
            .single();
          scheduleId = data?.id;
        }
        if (scheduleId && castsForDay.length > 0) {
          await supabase.from('schedule_casts').delete().eq('schedule_id', scheduleId);
          await supabase.from('schedule_casts').insert(
            castsForDay.map((c) => ({
              schedule_id: scheduleId,
              cast_id: c.id,
              work_start: c.default_work_start ?? null,
              work_end: c.default_work_end ?? null,
            }))
          );
        }
      }

      loadData();
    } catch (err) {
      alert('自動生成に失敗しました: ' + String(err));
    } finally {
      setAutoGenLoading(false);
    }
  };

  const bulkPublish = async () => {
    if (!confirm(`${year}年${month}月の全シフトを公開しますか？`)) return;
    setBulkPublishLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from('schedules')
        .update({ is_public: true, updated_at: new Date().toISOString() })
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);
      loadData();
    } catch (err) {
      alert('一括公開に失敗しました: ' + String(err));
    } finally {
      setBulkPublishLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-[#d4af37]">シフト管理</h1>
        {myRole !== 'cast' && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={autoGenerate}
              disabled={autoGenLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1a1a1a] text-[#c8a830] hover:bg-[#222222] disabled:opacity-60 transition-colors"
            >
              {autoGenLoading ? '生成中...' : 'シフト自動生成'}
            </button>
            <button
              type="button"
              onClick={bulkPublish}
              disabled={bulkPublishLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-black disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#d4af37' }}
            >
              {bulkPublishLoading ? '公開中...' : '一括公開'}
            </button>
          </div>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg text-[#8a7020] hover:bg-[#1a1a1a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-[#d4af37] min-w-[120px] text-center">
          {year}年{month}月
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg text-[#8a7020] hover:bg-[#1a1a1a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Main layout: Calendar + Cast panel */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 170px)' }}>
        {/* Calendar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0" ref={calendarScrollRef}>
          {loading ? (
            <div className="p-8 text-center text-[#6a5518] text-sm">読み込み中...</div>
          ) : (
            <ScheduleCalendar
              year={year}
              month={month}
              schedules={schedules}
              allCasts={allCasts}
              onClickCell={openModal}
              onClickCast={handleClickCast}
              onDropCast={handleDropCast}
              onRemoveCast={handleRemoveCast}
            />
          )}
        </div>

        {/* Cast panel */}
        <div className="lg:w-64 flex-shrink-0 flex flex-col">
          <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] flex flex-col lg:h-full overflow-hidden">
            <div className="px-3 py-2 border-b border-[#2a2a1a] flex-shrink-0">
              <p className="text-xs font-medium text-[#c8a830]">キャスト</p>
              <p className="text-[10px] text-[#4a4018] mt-0.5">ドラッグで追加 / 時間は一時設定</p>
            </div>
            {/* スマホ: 横スクロール / デスクトップ: 縦スクロール */}
            <div className="flex lg:flex-col flex-row lg:divide-y lg:divide-x-0 divide-x divide-[#2a2a1a] overflow-x-auto lg:overflow-x-hidden overflow-y-hidden lg:overflow-y-auto flex-1">
              {editableCasts.map((cast) => {
                const times = localCastTimes[cast.id] ?? { start: '', end: '' };
                return (
                  <div
                    key={cast.id}
                    className="flex-shrink-0 lg:flex-shrink px-3 py-2 hover:bg-[#161606] transition-colors"
                  >
                    {/* 上段: アバター + 名前 + ドラッグハンドル */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('castId', cast.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="flex items-center gap-2 cursor-grab active:cursor-grabbing select-none mb-1.5"
                    >
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#222222] flex-shrink-0 border border-[#2a2a1a]">
                        {cast.main_image_url ? (
                          <Image
                            src={cast.main_image_url}
                            alt={cast.name}
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full text-[8px] text-[#8a7020]">
                            {cast.name.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#c8a830] truncate flex-1">{cast.name}</span>
                      <svg className="w-3 h-3 text-[#3a3010] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    {/* 下段: 時間入力 */}
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={times.start}
                        onChange={(e) => setLocalCastTimes((prev) => ({
                          ...prev,
                          [cast.id]: { ...prev[cast.id], start: e.target.value },
                        }))}
                        className="w-full px-1.5 py-0.5 bg-[#1a1a0a] border border-[#2a2a1a] rounded text-[10px] text-[#c8a830] focus:outline-none focus:border-[#d4af37]"
                      />
                      <span className="text-[#4a4018] text-[9px] flex-shrink-0">〜</span>
                      <input
                        type="time"
                        value={times.end}
                        onChange={(e) => setLocalCastTimes((prev) => ({
                          ...prev,
                          [cast.id]: { ...prev[cast.id], end: e.target.value },
                        }))}
                        className="w-full px-1.5 py-0.5 bg-[#1a1a0a] border border-[#2a2a1a] rounded text-[10px] text-[#c8a830] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#111111] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a1a]">
              <h3 className="font-semibold text-[#d4af37]">{modal.date} のシフト</h3>
              <button type="button" onClick={closeModal} className="text-[#6a5518] hover:text-[#d4af37]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Cast selection */}
              <div>
                <p className="text-xs font-medium text-[#c8a830] mb-2">出勤キャスト</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editableCasts.map((cast) => (
                    <div key={cast.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={modalCastIds.includes(cast.id)}
                        onChange={() => toggleModalCast(cast.id)}
                        className="w-4 h-4 accent-[#d4af37] shrink-0"
                      />
                      <span className="text-sm text-[#d4af37] w-20 shrink-0">{cast.name}</span>
                      <input
                        type="time"
                        value={modalCastTimes[cast.id]?.start ?? ''}
                        onChange={(e) =>
                          setModalCastTimes((prev) => ({
                            ...prev,
                            [cast.id]: { ...prev[cast.id], start: e.target.value },
                          }))
                        }
                        className="px-2 py-1 border border-[#2a2a1a] rounded-lg text-xs focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                      />
                      <span className="text-[#6a5518] text-xs">〜</span>
                      <input
                        type="time"
                        value={modalCastTimes[cast.id]?.end ?? ''}
                        onChange={(e) =>
                          setModalCastTimes((prev) => ({
                            ...prev,
                            [cast.id]: { ...prev[cast.id], end: e.target.value },
                          }))
                        }
                        className="px-2 py-1 border border-[#2a2a1a] rounded-lg text-xs focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {myRole !== 'cast' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#c8a830] mb-1">備考</label>
                    <textarea
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] resize-none bg-[#1a1a1a] text-[#d4af37]"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalPublic}
                      onChange={(e) => setModalPublic(e.target.checked)}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                    <span className="text-sm text-[#d4af37]">公開する</span>
                  </label>
                </>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a1a]">
              <button
                type="button"
                onClick={saveModal}
                disabled={savingModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-black disabled:opacity-70"
                style={{ backgroundColor: '#d4af37' }}
              >
                {savingModal ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222]"
              >
                キャンセル
            </button>
            </div>
          </div>
        </div>
      )}

      {/* キャスト時間編集ミニモーダル */}
      {castTimeModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#111111] rounded-2xl shadow-xl w-full max-w-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a1a]">
              <h3 className="font-semibold text-[#d4af37] text-sm">
                {castTimeModal.date} — {castTimeModal.castName}
              </h3>
              <button
                type="button"
                onClick={() => setCastTimeModal(null)}
                className="text-[#6a5518] hover:text-[#d4af37]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-[#8a7020]">出勤時間</p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={castTimeModal.start}
                  onChange={(e) => setCastTimeModal((m) => m ? { ...m, start: e.target.value } : m)}
                  className="flex-1 px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                />
                <span className="text-[#6a5518] text-sm">〜</span>
                <input
                  type="time"
                  value={castTimeModal.end}
                  onChange={(e) => setCastTimeModal((m) => m ? { ...m, end: e.target.value } : m)}
                  className="flex-1 px-3 py-2 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:border-[#d4af37] bg-[#1a1a1a] text-[#d4af37]"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-[#2a2a1a]">
              <button
                type="button"
                onClick={saveCastTime}
                disabled={savingCastTime}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-70"
                style={{ backgroundColor: '#d4af37' }}
              >
                {savingCastTime ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => setCastTimeModal(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-[#c8a830] bg-[#1a1a1a] hover:bg-[#222222]"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
