import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { ApiError, get, post, setToken, setUnauthorizedHandler } from '@/lib/api'
import type { Pengguna } from '@/lib/roles'

interface LoginResponse {
  data: {
    token: string
    token_type: string
    user: Pengguna
  }
}

interface MeResponse {
  data: Pengguna
}

interface AuthContextValue {
  user: Pengguna | null
  memuat: boolean
  masuk: (username: string, password: string) => Promise<Pengguna>
  keluar: () => Promise<void>
  segarkan: () => Promise<void>
  gantiPassword: (passwordLama: string, passwordBaru: string, konfirmasi: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Pengguna | null>(null)
  const [memuat, setMemuat] = useState(true)

  const segarkan = useCallback(async () => {
    try {
      const res = await get<MeResponse>('/auth/me')
      setUser(res.data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null)
      else setUser(null)
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    void (async () => {
      await segarkan()
      setMemuat(false)
    })()
  }, [segarkan])

  const masuk = useCallback(async (username: string, password: string) => {
    const res = await post<LoginResponse>('/auth/login', { username, password })
    setToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const keluar = useCallback(async () => {
    try {
      await post('/auth/logout')
    } catch {
      /* token mungkin sudah tidak berlaku */
    }
    setToken(null)
    setUser(null)
  }, [])

  const gantiPassword = useCallback(
    async (passwordLama: string, passwordBaru: string, konfirmasi: string) => {
      await post('/auth/ganti-password', {
        password_lama: passwordLama,
        password: passwordBaru,
        password_confirmation: konfirmasi,
      })
      await segarkan()
    },
    [segarkan],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, memuat, masuk, keluar, segarkan, gantiPassword }),
    [user, memuat, masuk, keluar, segarkan, gantiPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
