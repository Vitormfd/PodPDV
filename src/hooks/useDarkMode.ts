import { useEffect, useState } from 'react'

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem('pdv-theme')
    if (stored) return stored === 'dark'
  } catch {
    // localStorage indisponivel (modo privado, etc.) - segue com o padrao do SO
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem('pdv-theme', isDark ? 'dark' : 'light')
    } catch {
      // ignora falha de storage
    }
  }, [isDark])

  return { isDark, toggle: () => setIsDark((v) => !v) }
}
