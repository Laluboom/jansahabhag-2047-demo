import { create } from 'zustand';

interface AppRefreshState {
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useAppRefreshStore = create<AppRefreshState>((set) => ({
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
