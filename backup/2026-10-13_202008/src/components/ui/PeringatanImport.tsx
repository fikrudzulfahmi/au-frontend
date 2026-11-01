import { AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react'

import type { LaporanImport } from '@/lib/crud'

interface PeringatanImportProps {
  laporan: LaporanImport
}

/** KP-1.3 — menampilkan hasil import: jumlah berhasil, baris gagal, dan password awal. */
export function PeringatanImport({ laporan }: PeringatanImportProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-control bg-success-soft px-3 py-2.5">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
        <p className="text-sm text-strong">
          <strong>{laporan.berhasil}</strong> dari {laporan.total_baris} baris berhasil diimport.
          {laporan.gagal > 0 && (
            <>
              {' '}
              <strong>{laporan.gagal}</strong> baris gagal.
            </>
          )}
        </p>
      </div>

      {laporan.baris_gagal.length > 0 && (
        <div className="rounded-control bg-warn-bg p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-warn-text">
            <AlertTriangle size={16} /> Baris yang gagal
          </p>
          <ul className="mt-2 space-y-1">
            {laporan.baris_gagal.map((b) => (
              <li key={b.baris} className="text-xs text-strong">
                <span className="tnum font-bold">Baris {b.baris}:</span> {b.pesan}
              </li>
            ))}
          </ul>
        </div>
      )}

      {laporan.akun && laporan.akun.length > 0 && (
        <div className="rounded-control bg-info-soft p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-info">
            <KeyRound size={16} /> Password awal akun baru
          </p>
          <p className="mt-1 text-xs text-muted">
            Catat sekarang — password ini hanya ditampilkan sekali dan wajib diganti saat login
            pertama.
          </p>
          <ul className="tnum mt-2 space-y-1">
            {laporan.akun.map((a) => (
              <li key={a.nip} className="flex justify-between gap-3 text-xs text-strong">
                <span>{a.nip}</span>
                <span className="font-bold">{a.password_awal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
