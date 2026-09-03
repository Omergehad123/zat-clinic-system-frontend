import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null, 
  modalData: null,
  toast: null,

  // Global filters state
  selectedBranchId: 'all',
  selectedMonth: 9,
  selectedYear: 2026,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

  setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
  setSelectedMonth: (month) => set({ selectedMonth: Number(month) }),
  setSelectedYear: (year) => set({ selectedYear: Number(year) }),

  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 4000);
  },
  hideToast: () => set({ toast: null })
}));
