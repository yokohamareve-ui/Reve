'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import type { Schedule, Cast } from '@/types';

type ScheduleWithTimes = Schedule & { castTimes: Record<string, { start: string; end: string }> };

type Props = {
  year: number;
  month: number; // 1-12
  schedules: ScheduleWithTimes[];
  allCasts: Cast[];
  onClickCell: (date: string, schedule?: ScheduleWithTimes) => void;
  onClickCast: (date: string, castId: string, schedule: ScheduleWithTimes) => void;
  onDropCast: (date: string, castId: string) => void;
  onRemoveCast: (date: string, castId: string) => void;
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function ScheduleCalendar({ year, month, schedules, allCasts, onClickCell, onClickCast, onDropCast, onRemoveCast }: Props) {
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();

  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [isDraggingCast, setIsDraggingCast] = useState(false);
  const [isOverRemoveZone, setIsOverRemoveZone] = useState(false);
  const dragCastId = useRef<string | null>(null);
  const dragFromDate = useRef<string | null>(null);

  // Map date string -> schedule
  const scheduleMap = new Map<string, ScheduleWithTimes>();
  for (const s of schedules) {
    scheduleMap.set(s.date, s);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // カレンダーへのドロップ（右パネルから追加）
  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (!isDraggingCast) setDragOverDate(dateStr);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const castId = e.dataTransfer.getData('castId');
    const action = e.dataTransfer.getData('action');
    if (action === 'remove') return; // 削除ゾーン向けのドラッグは無視
    if (castId) {
      onDropCast(dateStr, castId);
    }
    setDragOverDate(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 子要素への移動では発火しないよう relatedTarget を確認
    const related = e.relatedTarget as Node | null;
    if (related && (e.currentTarget as Node).contains(related)) return;
    setDragOverDate(null);
  };

  // バッジのドラッグ開始
  const handleCastDragStart = (e: React.DragEvent, dateStr: string, castId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('action', 'remove');
    e.dataTransfer.setData('castId', castId);
    e.dataTransfer.setData('date', dateStr);
    e.dataTransfer.effectAllowed = 'move';
    dragCastId.current = castId;
    dragFromDate.current = dateStr;
    setIsDraggingCast(true);
  };

  const handleCastDragEnd = () => {
    setIsDraggingCast(false);
    setIsOverRemoveZone(false);
    dragCastId.current = null;
    dragFromDate.current = null;
  };

  // 削除ゾーンへのドロップ
  const handleRemoveZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOverRemoveZone(true);
  };

  const handleRemoveZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const castId = e.dataTransfer.getData('castId');
    const date = e.dataTransfer.getData('date');
    if (castId && date) {
      onRemoveCast(date, castId);
    }
    setIsDraggingCast(false);
    setIsOverRemoveZone(false);
  };

  return (
    <div className="relative">
      <div className="bg-[#111111] rounded-xl border border-[#2a2a1a] overflow-hidden">
        {/* Header row */}
        <div className="grid border-b border-[#2a2a1a]" style={{ gridTemplateColumns: '56px 40px 1fr 60px' }}>
          <div className="py-2 px-2 text-xs text-[#6a5518]"></div>
          <div className="py-2 px-1 text-xs font-medium text-[#8a7020]">曜</div>
          <div className="py-2 px-2 text-xs font-medium text-[#8a7020]">出勤キャスト</div>
          <div className="py-2 px-2 text-xs font-medium text-[#8a7020] text-center">状態</div>
        </div>

        {/* Day rows */}
        <div className="divide-y divide-[#2a2a1a]">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const schedule = scheduleMap.get(dateStr);
            const isToday = dateStr === todayStr;
            const dayOfWeek = new Date(dateStr).getDay();
            const isSun = dayOfWeek === 0;
            const isSat = dayOfWeek === 6;
            const isDragOver = dragOverDate === dateStr && !isDraggingCast;

            return (
              <div
                key={dateStr}
                data-date={dateStr}
                className={`grid items-center transition-colors min-h-[78px] ${
                  isDragOver
                    ? 'bg-[#2a2a10]'
                    : isToday
                    ? 'bg-[#1a1a0a]'
                    : 'hover:bg-[#161606]'
                }`}
                style={{ gridTemplateColumns: '56px 40px 1fr 60px' }}
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDrop={(e) => handleDrop(e, dateStr)}
                onDragLeave={handleDragLeave}
              >
                {/* Day number */}
                <button
                  type="button"
                  onClick={() => onClickCell(dateStr, schedule)}
                  className="py-3 px-2 text-left"
                >
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-base font-medium ${
                      isToday
                        ? 'text-black'
                        : isSun
                        ? 'text-red-400'
                        : isSat
                        ? 'text-blue-400'
                        : 'text-[#d4af37]'
                    }`}
                    style={isToday ? { backgroundColor: '#d4af37' } : {}}
                  >
                    {day}
                  </span>
                </button>

                {/* Weekday */}
                <div
                  className={`py-3 px-1 text-sm ${
                    isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-[#8a7020]'
                  }`}
                >
                  {WEEKDAYS[dayOfWeek]}
                </div>

                {/* Cast list */}
                <div className="py-3 px-2">
                  {schedule?.casts && schedule.casts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {schedule.casts.map((cast: Cast) => {
                        const times = schedule.castTimes[cast.id];
                        const timeStr = times?.start && times?.end
                          ? `${times.start}〜${times.end}`
                          : times?.start
                          ? `${times.start}〜`
                          : null;
                        return (
                          <div
                            key={cast.id}
                            draggable
                            onDragStart={(e) => handleCastDragStart(e, dateStr, cast.id)}
                            onDragEnd={handleCastDragEnd}
                            onClick={(e) => { e.stopPropagation(); if (schedule) onClickCast(dateStr, cast.id, schedule); }}
                            className="flex items-center gap-2 bg-[#1a1a0a] rounded-lg pl-1 pr-3 py-1.5 cursor-pointer hover:bg-[#2a2a10] active:opacity-50 transition-colors"
                            title="クリックで時間編集 / ドラッグで削除"
                          >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#222222] flex-shrink-0">
                              {cast.main_image_url ? (
                                <Image
                                  src={cast.main_image_url}
                                  alt={cast.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex items-center justify-center w-full h-full text-[11px] text-[#8a7020]">
                                  {cast.name.slice(0, 1)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="text-sm text-[#c8a830] whitespace-nowrap">{cast.name}</span>
                              {timeStr && (
                                <span className="text-xs text-[#6a5518] whitespace-nowrap">{timeStr}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {isDragOver && (
                        <span className="text-[10px] text-[#d4af37] border border-dashed border-[#d4af37] rounded-full px-2 py-0.5">
                          ここにドロップ
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onClickCell(dateStr, schedule)}
                      className="w-full text-left"
                    >
                      <span className={`text-xs ${isDragOver ? 'text-[#d4af37]' : 'text-[#3a3a1a]'}`}>
                        {isDragOver ? 'ここにドロップ' : 'キャストなし'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Status badge */}
                <div className="py-3 px-2 text-center">
                  {schedule ? (
                    <button
                      type="button"
                      onClick={() => onClickCell(dateStr, schedule)}
                      className="inline-block"
                    >
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                          schedule.is_public
                            ? 'bg-[#0a2a0a] text-[#4ade80]'
                            : 'bg-[#1a1a1a] text-[#6a5518]'
                        }`}
                      >
                        {schedule.is_public ? '公開' : '非公開'}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 削除ゾーン（キャストバッジドラッグ中のみ表示） */}
      {isDraggingCast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-dashed transition-all pointer-events-auto ${
            isOverRemoveZone
              ? 'bg-red-950 border-red-400 text-red-300'
              : 'bg-[#1a0a0a] border-red-800 text-red-600'
          }`}
          onDragOver={handleRemoveZoneDragOver}
          onDragLeave={() => setIsOverRemoveZone(false)}
          onDrop={handleRemoveZoneDrop}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-sm font-medium">ここにドロップしてシフトから外す</span>
        </div>
      )}
    </div>
  );
}
