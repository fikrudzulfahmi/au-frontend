import { useQueryClient } from '@tanstack/react-query'
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
  /**
   * Benar bila pengguna baru saja keluar SECARA SENGAJA.
   *
   * Dipakai halaman masuk untuk mengabaikan "kembali ke halaman sebelumnya":
   * setelah keluar, orang berikutnya biasanya BUKAN pengguna yang sama, sehingga
   * mengembalikannya ke halaman peran sebelumnya salah — dan bagi peran yang tidak
   * berhak, halaman itu hanya menampilkan tabel kosong.
   */
  keluarBaru: boolean
  masuk: (username: string, password: string) => Promise<Pengguna>
  keluar: () => Promise<void>
  segarkan: () => Promise<void>
  gantiPassword: (passwordLama: string, passwordBaru: string, konfirmasi: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Pengguna | null>(null)
  const [memuat, setMemuat] = useState(true)
  const [keluarBaru, setKeluarBaru] = useState(false)
  const qc = useQueryClient()

  /**
   * Membuang SELURUH cache query.
   *
   * Wajib dipanggil setiap kali IDENTITAS SESI BERGANTI — keluar, masuk, atau sesi
   * berakhir sendiri (401). Tanpa ini, data milik peran sebelumnya tetap tersaji
   * kepada peran berikutnya: admin membuka daftar guru, keluar, lalu masuk sebagai
   * guru — daftar guru itu masih tampil karena `staleTime` 30 detik membuat React
   * Query tidak mengambil ulang. Tombol aksinya tersembunyi oleh pemeriksaan peran,
   * tetapi DATANYA tetap terbaca. Itu kebocoran antar peran, bukan sekadar tampilan
   * yang salah.
   */
  const bersihkanCache = useCallback(() => qc.clear(), [qc])

  const segarkan = useCallback(async () => {
    try {
      const res = await get<MeResponse>('/auth/me')
      setUser(res.data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        bersihkanCache()
      }
      else setUser(null)
    }
  }, [bersihkanCache])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      bersihkanCache()
    })
    void (async () => {
      await segarkan()
      setMemuat(false)
    })()
  }, [segarkan, bersihkanCache])

  const masuk = useCallback(
    async (username: string, password: string) => {
      const res = await post<LoginResponse>('/auth/login', { username, password })

      // Buang cache sesi sebelumnya SEBELUM pengguna baru dipasang, agar data peran
      // lama tidak sempat tersaji kepada peran baru.
      bersihkanCache()

      setToken(res.data.token)
      setUser(res.data.user)
      setKeluarBaru(false)

      return res.data.user
    },
    [bersihkanCache],
  )

  const keluar = useCallback(async () => {
    try {
      await post('/auth/logout')
    } catch {
      /* token mungkin sudah tidak berlaku */
    }
    setToken(null)
    setUser(null)
    bersihkanCache()
    setKeluarBaru(true)
  }, [bersihkanCache])

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
    () => ({ user, memuat, keluarBaru, masuk, keluar, segarkan, gantiPassword }),
    [user, memuat, keluarBaru, masuk, keluar, segarkan, gantiPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
