import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { get } from '@/lib/api'
import { useSemester } from '@/features/akademik/useSemester'
import type { HariJadwalGuru, JadwalGuru } from '@/features/akademik/types'

/** FR-JDW-06 — guru melihat jadwal hari ini dan jadwal mingguan miliknya. */
export function JadwalGuruPage() {
  const { semesterAktif } = useSemester()

  const hariIni = useQuery({
    queryKey: ['jadwal', 'hari-ini', semesterAktif?.id],
    queryFn: () => get<{ data: { hari: number; nama_hari: string; jadwal: JadwalGuru[] } }>('/jadwal/hari-ini', { semester_id: semesterAktif?.id }),
    enabled: semesterAktif !== undefined && semesterAktif !== null,
  })

  const mingguan = useQuery({
    queryKey: ['jadwal', 'mingguan', semesterAktif?.id],
    queryFn: () => get<{ data: { hari: HariJadwalGuru[] } }>('/jadwal/mingguan', { semester_id: semesterAktif?.id }),
    enabled: semesterAktif !== undefined && semesterAktif !== null,
  })

  const dataHariIni = hariIni.data?.data
  const minggu = mingguan.data?.data.hari ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jadwal Mengajar Saya"
        keterangan="Jadwal hari ini dan jadwal mingguan milik Anda pada semester aktif."
      />

      <section className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-strong">Hari ini</h2>
          {dataHariIni && <StatusBadge varian="izin">{dataHariIni.nama_hari}</StatusBadge>}
          {dataHariIni && <span className="tnum text-xs text-muted">{dataHariIni.jadwal.length} sesi</span>}
        </div>

        {dataHariIni && dataHariIni.jadwal.length === 0 && (
          <p className="mt-3 text-sm text-muted">Tidak ada jadwal mengajar hari ini.</p>
        )}

        {dataHariIni && dataHariIni.jadwal.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {dataHariIni.jadwal.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="tnum w-24 text-sm font-bold text-primary">{j.jam_mulai}–{j.jam_selesai}</span>
                <span className="flex-1 text-sm font-semibold text-strong">{j.mapel}</span>
                <span className="text-sm text-muted">{j.kelas}</span>
                {j.jam_ke !== null && <StatusBadge varian="cuti">Jam ke-{j.jam_ke}</StatusBadge>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-strong">Minggu ini</h2>

        {minggu.length === 0 && (
          <p className="card p-5 text-sm text-muted">
            Belum ada jadwal mengajar pada semester ini. Hubungi wakasek kurikulum bila seharusnya ada.
          </p>
        )}

        {minggu.map((h) => (
          <div key={h.hari} className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-strong">{h.nama_hari}</h3>
              <StatusBadge varian="izin">{h.jumlah_jp} JP</StatusBadge>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {h.jadwal.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="tnum w-24 font-semibold text-primary">{j.jam_mulai}</span>
                  <span className="flex-1 text-strong">{j.mapel}</span>
                  <span className="text-muted">{j.kelas}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
