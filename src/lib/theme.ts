import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface ThemeState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: (Cookies.get('theme') as 'dark' | 'light') || 'dark',
      setTheme: (theme) => {
        Cookies.set('theme', theme, { expires: 365 });
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          Cookies.set('theme', newTheme, { expires: 365 });
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
); 