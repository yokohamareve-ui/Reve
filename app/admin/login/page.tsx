'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#d4af37' }}>Reve</h1>
          <p className="text-sm text-[#8a7020] mt-1">管理画面</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] rounded-2xl shadow-sm border border-[#2a2a1a] p-8">
          <h2 className="text-lg font-semibold text-[#d4af37] mb-6 text-center">ログイン</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#d4af37] mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-[#1a1a1a] text-[#d4af37]"
                style={{ '--tw-ring-color': '#d4af37' } as React.CSSProperties}
                onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a1a')}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#d4af37] mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-[#2a2a1a] rounded-lg text-sm focus:outline-none transition-all bg-[#1a1a1a] text-[#d4af37]"
                onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a1a')}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-black transition-opacity disabled:opacity-70"
              style={{ backgroundColor: '#d4af37' }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
