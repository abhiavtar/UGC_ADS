import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

export const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const savedTheme = window.localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
};

export const applyTheme = (theme: Theme) => {
  const isLight = theme === 'light';

  document.documentElement.classList.toggle('light', isLight);
  document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
  window.localStorage.setItem('theme', theme);
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeContext.Provider');
  }

  return context;
};
