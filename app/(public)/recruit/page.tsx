import type { Metadata } from 'next';
import { getShop } from '@/lib/data';

export const metadata: Metadata = {
  title: 'RECRUIT',
  description: '採用情報。一緒に働くキャストを募集しています。',
};

export const revalidate = 0;

export default async function RecruitPage() {
  const shop = await getShop().catch(() => null);

  const tiktokUrl = shop?.tiktok_url;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <p className="section-title">Recruit</p>
        <h1 className="section-heading">採用情報</h1>
        <div className="mt-4 mx-auto w-12 h-0.5 bg-accent" />
      </div>

      {/* Hero Banner */}
      <div className="mb-10 p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 border border-accent/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-pink-glow pointer-events-none" />
        <p className="relative text-xs tracking-[0.3em] text-accent mb-3 font-medium">STAFF WANTED</p>
        <h2 className="relative text-2xl sm:text-3xl font-display font-bold text-text-primary mb-4">
          一緒に働きませんか？
        </h2>
        <p className="relative text-text-secondary text-sm leading-relaxed max-w-md mx-auto">
          未経験・経験者問わず大歓迎！<br />
          あなたらしく輝ける環境でお待ちしています。
        </p>
      </div>

      {/* Recruit Text */}
      {shop?.recruit_text ? (
        <div className="richtext mb-10">
          <div dangerouslySetInnerHTML={{ __html: shop.recruit_text }} />
        </div>
      ) : (
        <div className="mb-10 space-y-4">
          {/* Placeholder content when no data */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-accent tracking-widest mb-3">BENEFITS</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="text-accent">✦</span> 日払い・週払い対応
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✦</span> 未経験・副業OK
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✦</span> シフト自由
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✦</span> 完全個室面接
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Apply Buttons */}
      <div className="mt-10 p-6 rounded-xl bg-surface border border-border shadow-sm text-center">
        <p className="text-xs tracking-widest text-accent mb-4 font-medium">APPLY</p>
        <h3 className="text-lg font-bold text-text-primary mb-6">応募はこちら</h3>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {tiktokUrl ? (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-black hover:bg-gray-900 text-white text-sm font-medium tracking-wider rounded-full transition-all duration-300 border border-white/20 hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
              </svg>
              TikTok DMで応募する
            </a>
          ) : (
            <p className="text-text-muted text-sm">
              応募方法は随時更新します。SNSまたは店頭にてお問い合わせください。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
