'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useBranches } from '../../hooks/useDashboardQueries';
import { ROLE_LABELS } from '../../utils/permissions';
import { Menu, LogOut, MapPin, User, ShieldCheck, Calendar } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const logout = useAuthStore(s => s.logout);
  const { 
    toggleSidebar, 
    selectedBranchId, 
    setSelectedBranchId,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
  } = useUIStore();

  const { data: branches = [] } = useBranches();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      
      {/* Right side: Mobile Menu Toggle & Branch Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
          aria-label="القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Branch Selector */}
        {isSuperAdmin ? (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-zinc-900 text-white">كل الفروع</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-zinc-900 text-white">
                  {b.name} {b.status === 'معطل' ? '(معطل)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full">
            <MapPin className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-semibold text-zinc-200">
              {branch?.name || 'فرع مدينة نصر'}
            </span>
          </div>
        )}

        {/* Month / Year quick filter selector for Super Admin */}
        {isSuperAdmin && (
          <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-zinc-300 font-medium focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m} className="bg-zinc-900 text-white">
                  شهر {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-zinc-300 font-medium focus:outline-none cursor-pointer"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-zinc-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Left side: Current User Info & Logout Button */}
      <div className="flex items-center gap-3">
        <div className="text-left hidden sm:block">
          <div className="text-sm font-semibold text-white leading-tight">
            {user?.name || 'د. خالد عبد الرحمن'}
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-end gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{ROLE_LABELS[user?.role] || 'موظف'}</span>
          </div>
        </div>

        <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
          <User className="w-4 h-4" />
        </div>

        <button
          onClick={handleLogout}
          title="تسجيل الخروج"
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

    </header>
  );
}
