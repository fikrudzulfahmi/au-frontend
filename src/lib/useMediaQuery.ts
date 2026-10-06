import { useEffect, useState } from 'react'

/** Hook media query reaktif (dipakai FR-UI-01: 1024 px mobile vs desktop). */
export function useMediaQuery(query: string): boolean {
  const [cocok, setCocok] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setCocok(event.matches)
    setCocok(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return cocok
}
