import { Link } from 'react-router-dom'
import { ChevronRight, FileBarChart2, Info } from 'lucide-react'

import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/features/auth/AuthContext'
import { laporanUntukPeran } from './config'
import type { KonfigurasiLaporan } from './config'

/**
 * 5.14 — hub laporan.
 *
 * Menampilkan laporan yang boleh dibuka peran pengguna. Penyembunyian ini
 * hanya lapisan tampilan: server tetap menolak permintaan yang di luar hak
 * perannya (matriks Bagian 2), sehingga menyembunyikan menu bukan pengganti
 * otorisasi.
 */
export function HubLaporanPage() {
  const { user } = useAuth()
  const daftar = laporanUntukPeran(user)

  const kelompok = ['Presensi Pegawai', 'Jurnal & Siswa'] as const

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Laporan"
        keterangan="Seluruh laporan dapat dilihat di web serta diekspor PDF dan Excel dengan kop surat dan tanda tangan dari pengaturan dokumen."
      />

      {daftar.length === 0 ? (
        <div className="card overflow-hidden">
          <EmptyState
            judul="Belum ada laporan untuk peran Anda"
            keterangan="Hubungi administrator bila Anda seharusnya dapat membuka laporan."
            icon={FileBarChart2}
          />
        </div>
      ) : (
        kelompok.map((nama) => {
          const isi = daftar.filter((l) => l.kelompok === nama)
          if (isi.length === 0) return null

          return (
            <section key={nama} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{nama}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {isi.map((l) => (
                  <KartuLaporan key={l.jalur} konfigurasi={l} />
                ))}
              </div>
            </section>
          )
        })
      )}

      <p className="flex items-start gap-2 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0" />
        Perubahan kop surat, penandatangan, atau tanggal penetapan langsung tercermin pada laporan
        berikutnya karena dokumen membaca pengaturan saat dicetak (KP-5.2).
      </p>
    </div>
  )
}

function KartuLaporan({ konfigurasi }: { konfigurasi: KonfigurasiLaporan }) {
  return (
    <Link
      to={konfigurasi.jalur}
      className="card flex items-start gap-3 p-4 transition-colors hover:bg-app-soft/60"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
        <FileBarChart2 size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-strong">{konfigurasi.judul}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
          {konfigurasi.keterangan}
        </span>
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          {konfigurasi.kode}
        </span>
      </span>
      <ChevronRight size={18} className="mt-1 shrink-0 text-muted" />
    </Link>
  )
}
