import { useQuery } from '@tanstack/react-query'

import { master } from '@/lib/crud'
import type { TahunPelajaran } from '@/features/master/types'
import type { Semester } from './types'

interface TahunDenganSemester extends TahunPelajaran {
  semester?: Semester[]
}

/**
 * Semester aktif beserta daftar tahun pelajaran.
 * Seluruh halaman Fase 2 berkutat pada satu semester, sehingga pemilihannya
 * dipusatkan di sini agar konsisten.
 */
export function useSemester() {
  const tahun = useQuery({
    queryKey: ['tahun-pelajaran', 'semester'],
    queryFn: () => master.daftar<TahunDenganSemester>('/tahun-pelajaran', { per_page: 100 }),
  })

  const daftarTahun = tahun.data?.data ?? []
  const tahunAktif = daftarTahun.find((t) => t.status === 'aktif') ?? daftarTahun[0] ?? null

  const semuaSemester: Semester[] = daftarTahun.flatMap((t) => t.semester ?? [])
  const semesterAktif = semuaSemester.find((s) => s.is_active) ?? semuaSemester[0] ?? null

  return {
    memuat: tahun.isLoading,
    daftarTahun,
    tahunAktif,
    semesterAktif,
    semuaSemester,
    semesterDari: (tahunId: number | null) =>
      semuaSemester.filter((s) => s.tahun_pelajaran_id === tahunId),
  }
}
