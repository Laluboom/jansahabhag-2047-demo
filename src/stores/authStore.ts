import { create } from 'zustand';
import { User } from '../types/domain';
import { demoRepository } from '../services/demoRepository';

export type DemoLanguage = 'en' | 'hi' | 'raj';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  activeLanguage: DemoLanguage;
  availableLanguages: { code: DemoLanguage; label: string; isDemo: boolean }[];
  initialize: () => Promise<void>;
  switchPersona: (userId: string) => Promise<void>;
  setLanguage: (lang: DemoLanguage) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isLoading: true,
  activeLanguage: 'en',
  availableLanguages: [
    { code: 'en', label: 'English', isDemo: false },
    { code: 'hi', label: 'हिन्दी (Hindi - Pending Review)', isDemo: true },
    { code: 'raj', label: 'राजस्थानी (Rajasthani - Demo)', isDemo: true },
  ],

  initialize: async () => {
    try {
      set({ isLoading: true });
      const user = await demoRepository.getCurrentUser();
      set({ currentUser: user, isLoading: false });
    } catch (err) {
      console.error('Failed to initialize auth store', err);
      set({ isLoading: false });
    }
  },

  switchPersona: async (userId: string) => {
    try {
      set({ isLoading: true });
      const user = await demoRepository.switchUser(userId);
      set({ currentUser: user, isLoading: false });
    } catch (err) {
      console.error('Failed to switch persona', err);
      set({ isLoading: false });
    }
  },

  setLanguage: (lang: DemoLanguage) => {
    set({ activeLanguage: lang });
  },

  refreshUser: async () => {
    const { currentUser } = get();
    if (currentUser) {
      const refreshed = await demoRepository.getUser(currentUser.id);
      if (refreshed) {
        set({ currentUser: refreshed });
      }
    }
  },
}));
