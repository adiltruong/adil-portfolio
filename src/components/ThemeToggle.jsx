import { useState } from 'react'

// Dark is the default. index.html applies a saved choice before first paint;
// this button flips it and remembers the new one.
const THEME_COLORS = { dark: '#020618', light: '#ffffff' }

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Storage can be blocked (private mode); the toggle still works this visit.
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 transition hover:text-court hover:ring-court/50 dark:text-slate-400 dark:ring-slate-700 dark:hover:text-ball dark:hover:ring-ball/50"
    >
      {theme === 'dark' ? (
        // moon
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        // sun
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  )
}
