'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { Building2, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore(s => s.login);
  const showToast = useUIStore(s => s.showToast);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      showToast(`أهلاً بك ${res.user.name}`, 'success');

      // Role-based auto redirect requirement
      // super_admin, branch_manager, receptionist, accountant -> /dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const setQuickUser = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle monochrome ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-800/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-xl shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">نظام إدارة الفروع والمصحة</h1>
          <p className="text-sm text-zinc-400 mt-1">سجل الدخول للوصول إلى لوحة الفرع الخاصة بك</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-zinc-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@clinic.com"
                className="mono-input pl-4 pr-10 text-left dir-ltr"
              />
              <Mail className="w-5 h-5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mono-input pl-4 pr-10 text-left dir-ltr"
              />
              <Lock className="w-5 h-5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mono-btn-primary py-3 text-base shadow-lg hover:shadow-xl transition-all mt-2"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            {!loading && <ArrowLeft className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
