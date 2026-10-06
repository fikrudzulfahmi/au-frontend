import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { FormField, kelasInput } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'

/** FR-SEC-04 — pengguna dapat mengganti password sendiri. */
const skema = z
  .object({
    lama: z.string().min(1, 'Password lama wajib diisi.'),
    baru: z.string().min(8, 'Password baru minimal 8 karakter.'),
    konfirmasi: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((v) => v.baru === v.konfirmasi, {
    message: 'Konfirmasi password tidak sama.',
    path: ['konfirmasi'],
  })

type FormNilai = z.infer<typeof skema>

export function GantiPasswordPage() {
  const { gantiPassword } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [galat, setGalat] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormNilai>({
    resolver: zodResolver(skema),
    defaultValues: { lama: '', baru: '', konfirmasi: '' },
  })

  const kirim = handleSubmit(async (nilai) => {
    setGalat(null)
    try {
      await gantiPassword(nilai.lama, nilai.baru, nilai.konfirmasi)
      toast.sukses('Password berhasil diganti.')
      navigate('/dashboard')
    } catch (error) {
      setGalat(pesanError(error))
    }
  })

  return (
    <div className="space-y-4">
      <PageHeader judul="Ganti Password" keterangan="Minimal 8 karakter." />

      <form onSubmit={kirim} className="card max-w-lg space-y-4 p-5" noValidate>
        {galat && (
          <p role="alert" className="rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {galat}
          </p>
        )}

        <FormField label="Password lama" htmlFor="lama" wajib pesanError={errors.lama?.message}>
          <input id="lama" type="password" className={kelasInput} {...register('lama')} />
        </FormField>

        <FormField label="Password baru" htmlFor="baru" wajib pesanError={errors.baru?.message}>
          <input id="baru" type="password" className={kelasInput} {...register('baru')} />
        </FormField>

        <FormField
          label="Konfirmasi password baru"
          htmlFor="konfirmasi"
          wajib
          pesanError={errors.konfirmasi?.message}
        >
          <input
            id="konfirmasi"
            type="password"
            className={kelasInput}
            {...register('konfirmasi')}
          />
        </FormField>

        <Button type="submit" memuat={isSubmitting}>
          <KeyRound size={17} /> Simpan Password
        </Button>
      </form>
    </div>
  )
}
