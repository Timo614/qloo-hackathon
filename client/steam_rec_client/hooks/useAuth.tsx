// hooks/useAuth.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/* ------------------------------------------------------------------ */
/* Types & constants                                                  */
/* ------------------------------------------------------------------ */

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
}

interface UseAuthReturn {
  user: User | null
  token: string | null
  loading: boolean
  register: (email: string, password: string) => Promise<Response>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth(): UseAuthReturn {
  const [user, setUser]   = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  /** Holds the *latest* refresh-token */
  const refreshTokenRef = useRef<string | null>(null)

  /** Keeps the current refresh-timer’s cleanup fn */
  const cleanupRef = useRef<() => void>(() => {})

  /* --------------------------- helpers ---------------------------- */

  /** Calls /auth/refresh with the *current* refresh-token */
  const refresh = useCallback(async () => {
    const rToken = refreshTokenRef.current
    if (!rToken) throw new Error('Missing refresh token')

    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rToken }),
    })
    if (!res.ok) throw new Error('Token refresh failed')

    const {
      access_token,
      refresh_token,
      expires_in,
      user: u,
    } = await res.json()

    setToken(access_token)
    setUser(u)
    refreshTokenRef.current = refresh_token

    localStorage.setItem('token',        access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('expires_at',    String(Date.now() + expires_in * 1000))

    cleanupRef.current?.()
    cleanupRef.current = scheduleRefresh(expires_in * 1000)
  }, [API])

  /** Schedules a silent refresh 60 s before expiry
      –  dependency array is empty on purpose to avoid TDZ issues  */
  const scheduleRefresh = useCallback(
    (delayMs: number) => {
      const id = window.setTimeout(
        refresh,                            // uses latest refresh via ref
        Math.max(5_000, delayMs - 60_000),  // never schedule in < 5 s
      )
      return () => clearTimeout(id)
    },
    [],   // ← do NOT list `refresh` here (prevents TDZ error)
  )

  /* ------------------------ initial load -------------------------- */

  useEffect(() => {
    const t   = localStorage.getItem('token')
    const rt  = localStorage.getItem('refresh_token')
    const exp = Number(localStorage.getItem('expires_at') || 0)

    refreshTokenRef.current = rt

    if (!t || !rt || !exp) {
      setLoading(false)
      return
    }

    if (Date.now() < exp - 60_000) {
      // token still good → hydrate & schedule next refresh
      setToken(t)
      try {
        setUser(JSON.parse(atob(t.split('.')[1])) as User) // quick decode
      } catch {/* ignore malformed JWT */}
      cleanupRef.current = scheduleRefresh(exp - Date.now())
      setLoading(false)
    } else {
      // expired → attempt refresh immediately
      refresh().finally(() => setLoading(false))
    }
  }, [refresh, scheduleRefresh])

  /* --------------------------- actions ---------------------------- */

  /** Register */
  const register = useCallback(
    async (email: string, password: string) =>
      fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: { email, password } }),
      }),
    [API],
  )

  /** Login */
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw await res.text()

      const {
        access_token,
        refresh_token,
        expires_in,
        user: u,
      } = await res.json()

      setToken(access_token)
      setUser(u)
      refreshTokenRef.current = refresh_token

      localStorage.setItem('token',        access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('expires_at',    String(Date.now() + expires_in * 1000))

      cleanupRef.current?.()
      cleanupRef.current = scheduleRefresh(expires_in * 1000)
    },
    [API, scheduleRefresh],
  )

  /** Logout */
  const logout = useCallback(async () => {
    cleanupRef.current?.()
    cleanupRef.current = () => {}
    refreshTokenRef.current = null

    const t = localStorage.getItem('token')
    if (t) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        })
      } catch {/* ignore network errors on logout */}
    }

    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('expires_at')
  }, [API])

  /* --------------------------- return ----------------------------- */

  return { user, token, loading, register, login, logout }
}
