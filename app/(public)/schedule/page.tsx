import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getSchedules } from '@/lib/data';

export const metadata: Metadata = {
  title: 'SCHEDULE',
  description: '出勤スケジュール。キャストの出勤予定をご確認いただけます。',
};

export const revalidate = 0;

function formatDateJa(dateStr: string) {
  const d = new Date(dateStr);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  return {
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekday: weekDays[d.getDay()],
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
}

function isToday(dateStr: string) {
  const today = new Date();
  const d = new Date(dateStr);
  return (
    today.getFullYear() === d.getFullYear() &&
    today.getMonth() === d.getMonth() &&
    today.getDate() === d.getDate()
  );
}

export default async function SchedulePage() {
  const schedules = await getSchedules(14).catch(() => []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <p className="section-title">Schedule</p>
        <h1 className="section-heading">出勤スケジュール</h1>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-accent" />
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <p>現在公開中のスケジュールはありません。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((schedule) => {
            const { month, day, weekday, isWeekend } = formatDateJa(schedule.date);
            const today = isToday(schedule.date);

            return (
              <div
                key={schedule.id}
                className={`card p-5 sm:p-6 ${today ? 'border-accent/50 ring-1 ring-accent/30' : ''}`}
              >
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                  <div
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-full ${
                      today
                        ? 'bg-accent text-black'
                        : 'bg-surface-2 text-text-primary border border-border'
                    }`}
                  >
                    <span className="text-xs leading-none opacity-70">{month}月</span>
                    <span className="text-xl font-bold leading-tight">{day}</span>
                  </div>
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isWeekend ? 'text-accent' : 'text-text-secondary'
                      }`}
                    >
                      ({weekday})
                    </span>
                    {today && (
                      <span className="ml-2 text-xs tracking-widest text-accent font-medium">TODAY</span>
                    )}
                  </div>
                </div>

                {/* Casts */}
                {schedule.casts && schedule.casts.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {schedule.casts.map((cast) => (
                      <Link
                        key={cast.id}
                        href={`/cast/${cast.slug}`}
                        className="group text-center"
                      >
                        <div className="relative aspect-square rounded-full overflow-hidden bg-surface-2 mb-2 mx-auto w-16 sm:w-20">
                          {cast.main_image_url && (
                            <Image
                              src={cast.main_image_url}
                              alt={cast.name}
                              fill
                              sizes="80px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary group-hover:text-accent transition-colors truncate">
                          {cast.name}
                        </p>
                        {(cast.work_start || cast.work_end) && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {cast.work_start ?? ''}{cast.work_start && cast.work_end ? '〜' : ''}{cast.work_end ?? ''}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">出勤キャスト未定</p>
                )}

                {/* Note */}
                {schedule.note && (
                  <p className="mt-4 pt-4 border-t border-border text-xs text-text-muted">
                    {schedule.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
