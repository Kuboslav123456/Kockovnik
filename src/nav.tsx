import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'newGame' }
  | { name: 'game' }
  | { name: 'victory' }
  | { name: 'profiles' }
  | { name: 'profile'; id: string }
  | { name: 'pass'; id?: string }
  | { name: 'treasury'; id?: string }
  | { name: 'stats' }

interface Nav {
  route: Route
  direction: 1 | -1
  go: (r: Route) => void
  back: () => void
  /** nahradí celý zásobník (napr. po skončení hry) */
  reset: (r: Route) => void
}

const NavContext = createContext<Nav | null>(null)

export function NavProvider({ children, initial }: { children: ReactNode; initial: Route }) {
  const [stack, setStack] = useState<Route[]>([initial])
  const [direction, setDirection] = useState<1 | -1>(1)
  const stackRef = useRef(stack)
  stackRef.current = stack

  // Systémové tlačidlo späť (Android / gesto) vráti o obrazovku späť
  useEffect(() => {
    const onPop = () => {
      if (stackRef.current.length > 1) {
        setDirection(-1)
        setStack((s) => s.slice(0, -1))
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((r: Route) => {
    setDirection(1)
    setStack((s) => [...s, r])
    try {
      history.pushState(null, '')
    } catch {
      /* ignore */
    }
  }, [])

  const back = useCallback(() => {
    if (stackRef.current.length > 1) history.back()
  }, [])

  const reset = useCallback((r: Route) => {
    setDirection(1)
    setStack([{ name: 'home' }, ...(r.name === 'home' ? [] : [r])])
  }, [])

  const value = useMemo(() => ({ route: stack[stack.length - 1], direction, go, back, reset }), [stack, direction, go, back, reset])
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav() {
  const n = useContext(NavContext)
  if (!n) throw new Error('useNav mimo NavProvider')
  return n
}
