import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { useEffect, useMemo, useState } from 'react'
import './index.css'
import App from './App'
import { applyTheme, getInitialTheme, ThemeContext, type Theme } from './theme'

import { BrowserRouter } from 'react-router-dom'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in client/reactjs/.env')
}

function Root() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const themeValue = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === 'light' ? 'dark' : 'light',
        ),
    }),
    [theme],
  );

  return (
    <ClerkProvider
      appearance={{
        ...(theme === 'dark' ? { baseTheme: dark } : {}),
        variables: {
          colorPrimary: '#4f39f6',
          colorTextOnPrimaryBackground: '#ffffff',
        },
      }}
      publishableKey={PUBLISHABLE_KEY}
    >
      <ThemeContext.Provider value={themeValue}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeContext.Provider>
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')! as HTMLElement).render(<Root />)
