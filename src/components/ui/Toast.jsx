'use client';

import { useUIStore } from '../../store/useUIStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, hideToast } = useUIStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-700 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-fade-in max-w-md dir-rtl">
      {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0" />}
      {toast.type === 'info' && <Info className="w-5 h-5 text-zinc-300 shrink-0" />}
      
      <p className="text-sm font-medium text-zinc-100 flex-1">{toast.message}</p>
      
      <button
        onClick={hideToast}
        className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
