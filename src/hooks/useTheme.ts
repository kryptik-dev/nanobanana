import { useState, useEffect } from 'react'

type Theme = 'dark'

export function useTheme() {
  const [theme] = useState<Theme>('dark')

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  return { theme, setTheme: () => {} }
} 