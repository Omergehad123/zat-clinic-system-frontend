'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import GlobalModals from '../../components/modules/GlobalModals';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const token = useAuthStore(s => s.token);
  const checkAuth = useAuthStore(s => s.checkAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token && !isAuthenticated) {
      router.push('/login');
    } else {
      checkAuth();
    }
  }, [token, isAuthenticated]);

  if (!mounted || (!isAuthenticated && !token)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:mr-64 min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <GlobalModals />
    </div>
  );
}
