import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-app px-6 text-center">
      <Logo ukuran="lg" />
      <p className="text-5xl font-extrabold text-strong">404</p>
      <p className="max-w-sm text-sm text-muted">
        Halaman yang Anda cari tidak ditemukan atau sudah dipindahkan.
      </p>
      <Link to="/dashboard">
        <Button>Kembali ke Beranda</Button>
      </Link>
    </div>
  )
}
