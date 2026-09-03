'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { NAVIGATION_PERMISSIONS, hasRole } from '../../utils/permissions';
import { 
  LayoutDashboard, 
  GitFork,
  UserCog, 
  Users, 
  UserCheck, 
  CalendarCheck, 
  Wallet, 
  TrendingUp, 
  FileText, 
  BarChart3,
  History,
  X,
  Building2
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore(s => s.user);
  const branch = useAuthStore(s => s.branch);
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = [
    { key: 'dashboard', label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
    { key: 'branches', label: 'إدارة الفروع', href: '/dashboard/branches', icon: GitFork },
    { key: 'patients', label: 'النزلاء', href: '/dashboard/patients', icon: Users },
    { key: 'employees', label: 'الموظفون', href: '/dashboard/employees', icon: UserCheck },
    { key: 'attendance', label: 'الحضور', href: '/dashboard/attendance', icon: CalendarCheck },
    { key: 'advances', label: 'السلف', href: '/dashboard/advances', icon: Wallet },
    { key: 'finance', label: 'المالية', href: '/dashboard/finance', icon: TrendingUp },
    { key: 'invoices', label: 'الفواتير', href: '/dashboard/invoices', icon: FileText },
    { key: 'reports', label: 'التقارير', href: '/dashboard/reports', icon: BarChart3 },
    { key: 'audit-logs', label: 'سجل النشاط', href: '/dashboard/audit-logs', icon: History }
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 right-0 bottom-0 z-50 w-64 bg-zinc-950 border-l border-zinc-800 
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* App Branding Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-bold shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">إدارة المنظومة</h2>
              <p className="text-xs text-zinc-400 font-medium">
                {isSuperAdmin ? 'اللوحة العامة الرئيسية' : (branch?.name || 'فرع المصحة')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const allowed = hasRole(user, NAVIGATION_PERMISSIONS[item.key]);
            if (!allowed) return null;

            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-white text-black font-semibold shadow-md' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-300">
              {isSuperAdmin ? 'تحكم شامل بكافة الفروع' : 'نطاق الفرع محدد تلقائياً'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {isSuperAdmin ? 'Super Admin Dashboard (EGP)' : 'حساب مستخدم الفرع'}
          </p>
        </div>
      </aside>
    </>
  );
}
