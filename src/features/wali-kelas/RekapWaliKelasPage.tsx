import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'

import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { ambilKelasWali, ambilRekapSiswa } from '@/features/mengajar/jurnal/api'

/**
 * FR-JRN-10 — rekap presensi siswa kelas wali.
 *
 * Daftar kelas dibatasi pada kelas yang benar-benar diampu pengguna sebagai wali;
 * server tetap memeriksa ulang, jadi menyembunyikan pilihan di sini bukan pengganti
 * otorisasi (prinsip 4: server adalah sumber kebenaran otorisasi).
 */
export function RekapWaliKelasPage() {
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [kelasId, setKelasId] = useState('')

  const kelas = useQuery({
    queryKey: ['jurnal', 'kelas-wali'],
    queryFn: () => ambilKelasWali(),
  })

  const kelasWali = useMemo(() => kelas.data?.data ?? [], [kelas.data])

  const terpilih = kelasId === '' ? (kelasWali[0]?.id ?? null) : Number(kelasId)

  const rekap = useQuery({
    queryKey: ['jurnal', 'rekap', terpilih, dari, sampai],
    queryFn: () => ambilRekapSiswa({ kelas_id: terpilih, dari, sampai }),
    enabled: terpilih !== null,
  })

  const data = rekap.data?.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Rekap Presensi Siswa"
        keterangan="Rekapitulasi kehadiran siswa kelas yang Anda ampu sebagai wali kelas."
      />

      {kelas.isLoading && <p className="card p-5 text-sm text-muted">Memuat kelas…</p>}

      {kelas.isError && (
        <p className="card p-5 text-sm text-danger">Daftar kelas tidak dapat dimuat.</p>
      )}

      {kelas.isSuccess && kelasWali.length === 0 && (
        <EmptyState
          judul="Anda belum menjadi wali kelas"
          keterangan="Rekap ini hanya untuk guru yang tercatat sebagai wali kelas pada tahun pelajaran aktif."
          icon={Users}
        />
      )}

      {kelasWali.length > 0 && (
        <>
          <div className="card grid gap-3 p-4 sm:grid-cols-3">
            <BidangPilihan
              label="Kelas"
              id="r-kelas"
              nilai={String(terpilih ?? '')}
              onUbah={setKelasId}
              opsi={kelasWali.map((k) => ({ nilai: String(k.id), label: k.nama }))}
            />
            <BidangTeks
              label="Dari tanggal"
              id="r-dari"
              tipe="date"
              nilai={dari}
              onUbah={setDari}
            />
            <BidangTeks
              label="Sampai tanggal"
              id="r-sampai"
              tipe="date"
              nilai={sampai}
              onUbah={setSampai}
            />
          </div>

          {rekap.isError && (
            <p className="card p-5 text-sm text-danger">Rekap tidak dapat dimuat.</p>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: 'Sesi jurnal', nilai: data.sesi },
                  { label: 'Hadir', nilai: data.ringkasan.H },
                  { label: 'Sakit', nilai: data.ringkasan.S },
                  { label: 'Izin', nilai: data.ringkasan.I },
                  { label: 'Alpa', nilai: data.ringkasan.A },
                ].map((s) => (
                  <div key={s.label} className="card p-3 text-center">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">{s.label}</p>
                    <p className="mt-1 text-xl font-extrabold text-strong tabular-nums">{s.nilai}</p>
                  </div>
                ))}
              </div>

              <div className="card p-4">
                <DataTable
                  data={data.siswa}
                  kunciBaris={(s) => s.siswa_id}
                  kosong="Belum ada siswa terplot di kelas ini."
                  kolom={[
                    { kunci: 'nis', judul: 'NIS', render: (s) => s.nis ?? '-' },
                    { kunci: 'nama', judul: 'Nama', render: (s) => s.nama ?? '-' },
                    { kunci: 'h', judul: 'H', render: (s) => s.hadir },
                    { kunci: 's', judul: 'S', render: (s) => s.sakit },
                    { kunci: 'i', judul: 'I', render: (s) => s.izin },
                    { kunci: 'a', judul: 'A', render: (s) => s.alpa },
                    { kunci: 'total', judul: 'Total', render: (s) => s.total },
                    {
                      kunci: 'persen',
                      judul: '% Hadir',
                      render: (s) =>
                        s.persen_hadir === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span className="font-semibold text-strong tabular-nums">
                            {s.persen_hadir}%
                          </span>
                        ),
                    },
                  ]}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
