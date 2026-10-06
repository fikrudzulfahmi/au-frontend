import { CheckCircle2 } from 'lucide-react'

import { StatusBadge, type StatusVarian } from '@/components/ui/StatusBadge'
import { LABEL_STATUS_AKHIR, type StatusAkhir } from '@/features/akademik/types'

const VARIAN: Record<StatusAkhir, StatusVarian> = {
  berjalan: 'izin',
  naik_kelas: 'hadir',
  tinggal_kelas: 'menunggu',
  lulus: 'hadir',
  pindah: 'cuti',
  keluar: 'alpa',
}

/** Menampilkan status akhir plotting; sudah diproses ditandai agar jelas (FR-PLK-03). */
export function LabStatusAkhir({ nilai, sudahDiproses }: { nilai: StatusAkhir; sudahDiproses: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusBadge varian={VARIAN[nilai]}>{LABEL_STATUS_AKHIR[nilai]}</StatusBadge>
      {sudahDiproses && <CheckCircle2 size={14} className="text-success" aria-label="Sudah diproses" />}
    </span>
  )
}
