'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { createClient } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#111111] border-r border-[#2a2a1a] fixed inset-y-0 left-0 z-30">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-[#2a2a1a] transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#111111] border-b border-[#2a2a1a] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#8a7020] hover:bg-[#1a1a1a] transition-colors"
              aria-label="メニューを開く"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold lg:hidden" style={{ color: '#d4af37' }}>
              Reve 管理
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#8a7020] hover:text-[#d4af37] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ログアウト
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
