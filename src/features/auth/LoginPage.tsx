import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import ilustrasiTunggal from '@/assets/ilustrasi/guru-khaki-tunggal.svg'
import { Button } from '@/components/ui/Button'
import { FormField, kelasInput } from '@/components/ui/FormField'
import { Logo } from '@/components/ui/Logo'
import { pesanError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { useAuth } from '@/features/auth/AuthContext'
import { useSekolah } from '@/features/sekolah/useSekolah'

const skema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

type FormNilai = z.infer<typeof skema>

interface LokasiState {
  dari?: string
}

/** Halaman masuk (8.1 — /masuk). */
export function LoginPage() {
  const { masuk, user, memuat } = useAuth()
  const { data: sekolah } = useSekolah()
  const navigate = useNavigate()
  const location = useLocation()
  const [galat, setGalat] = useState<string | null>(null)
  const [lihatPassword, setLihatPassword] = useState(false)

  const dari = (location.state as LokasiState | null)?.dari ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormNilai>({ resolver: zodResolver(skema), defaultValues: { username: '', password: '' } })

  useEffect(() => {
    if (!memuat && user) navigate(dari, { replace: true })
  }, [memuat, user, navigate, dari])

  const kirim = handleSubmit(async (nilai) => {
    setGalat(null)
    try {
      await masuk(nilai.username, nilai.password)
      navigate(dari, { replace: true })
    } catch (error) {
      setGalat(pesanError(error))
    }
  })

  return (
    <div className="grid min-h-dvh bg-app lg:grid-cols-2">
      {/* Panel kiri: identitas */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        <div>
          <Logo ukuran="lg" terang />
          <h1 className="mt-10 max-w-md text-3xl font-extrabold leading-tight">
            {sekolah?.nama_sekolah ?? 'Presensi & Jurnal Digital'}
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/80">
            {sekolah?.tagline ?? 'SIPANDU — Sistem Presensi & Jurnal Digital'}
          </p>
        </div>

        <ul className="space-y-3 text-sm text-white/85">
          <li>• Presensi GPS dan swafoto dari kamera</li>
          <li>• Jurnal pembelajaran dan presensi siswa</li>
          <li>• Laporan resmi PDF &amp; Excel</li>
        </ul>

        <img
          src={ilustrasiTunggal}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-4 right-2 h-[320px] w-auto opacity-95"
        />
      </div>

      {/* Panel kanan: formulir */}
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo ukuran="lg" />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-strong lg:mt-0">Masuk</h1>
          <p className="mt-1 text-sm text-muted">
            {sekolah?.nama_sekolah ?? 'Gunakan akun yang diberikan admin sekolah.'}
          </p>

          <form onSubmit={kirim} className="card mt-6 space-y-4 p-6" noValidate>
            {galat && (
              <p
                role="alert"
                className="rounded-control bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger"
              >
                {galat}
              </p>
            )}

            <FormField label="Username" htmlFor="username" wajib pesanError={errors.username?.message}>
              <input
                id="username"
                autoComplete="username"
                className={kelasInput}
                placeholder="NIP atau ID pengguna"
                {...register('username')}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" wajib pesanError={errors.password?.message}>
              <div className="relative">
                <input
                  id="password"
                  type={lihatPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(kelasInput, 'pr-11')}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setLihatPassword((v) => !v)}
                  aria-label={lihatPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted"
                >
                  {lihatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>

            <Button type="submit" penuh memuat={isSubmitting}>
              {!isSubmitting && <LogIn size={18} />} Masuk
            </Button>

            <p className="text-center text-xs text-muted">
              Lupa password? Hubungi administrator sekolah untuk melakukan reset password.
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            <Link to="/" className="font-semibold text-link">
              ← Kembali ke halaman utama
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
