import { cn } from '@/lib/cn'

/** Warna status (5.22): hadir hijau, terlambat oranye, izin biru, sakit ungu,
 *  dinas toska, cuti abu, alpa merah, menunggu kuning. */
export type StatusVarian =
  | 'hadir'
  | 'terlambat'
  | 'izin'
  | 'sakit'
  | 'dinas'
  | 'cuti'
  | 'alpa'
  | 'menunggu'
  | 'netral'
  | 'sukses'
  | 'bahaya'

const gaya: Record<StatusVarian, string> = {
  hadir: 'bg-success-soft text-success',
  terlambat: 'bg-warn-bg text-warn-text',
  izin: 'bg-info-soft text-info',
  sakit: 'bg-purple-soft text-purple',
  dinas: 'bg-teal-soft text-teal',
  cuti: 'bg-gray-soft text-gray',
  alpa: 'bg-danger-soft text-danger',
  menunggu: 'bg-pending-soft text-pending',
  netral: 'bg-gray-soft text-gray',
  sukses: 'bg-success-soft text-success',
  bahaya: 'bg-danger-soft text-danger',
}

interface StatusBadgeProps {
  varian?: StatusVarian
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ varian = 'netral', children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold',
        gaya[varian],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Pemetaan status presensi pegawai -> varian lencana. */
export function varianStatusPresensi(status?: string | null): StatusVarian {
  switch (status) {
    case 'hadir':
      return 'hadir'
    case 'terlambat':
      return 'terlambat'
    case 'normal':
      return 'hadir'
    case 'pulang_cepat':
      return 'terlambat'
    case 'menunggu':
      return 'menunggu'
    case 'disetujui':
      return 'hadir'
    case 'ditolak':
      return 'alpa'
    default:
      return 'netral'
  }
}

export const labelStatus: Record<string, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  normal: 'Normal',
  pulang_cepat: 'Pulang Cepat',
  valid: 'Valid',
  menunggu: 'Menunggu',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  izin: 'Izin',
  sakit: 'Sakit',
  dinas: 'Dinas',
  cuti: 'Cuti',
  dibatalkan: 'Dibatalkan',
}
