import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, FileSpreadsheet, FileText, Filter, Info, Loader2, Lock } from 'lucide-react'

import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { KolomTabel } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { formatTanggalDari } from '@/lib/format'
import {
  OPSI_PERIODE,
  labelPeriode,
  paramsPeriode,
  periodeAwal,
  rentangSiap,
  tanggalHariIni,
} from '@/lib/periode'
import type { PilihanPeriode } from '@/lib/periode'
import { useAuth } from '@/features/auth/AuthContext'
import { ambilLaporan, unduhLaporan } from './api'
import type { FormatEkspor } from './api'
import { penggunaMemantau } from '@/lib/roles'
import type { JenisFilter, KonfigurasiLaporan } from './config'
import { keBarisLaporan, teksSel } from './types'
import type { BarisLaporan, HasilLaporan } from './types'
import { DetailJurnalDialog } from './DetailJurnalDialog'
import { RingkasanKelasHarian } from './RingkasanKelasHarian'
import { useDataLaporan, usePengaturanDokumen } from './useDataLaporan'

const OPSI_JENIS_PEGAWAI = [
  { nilai: 'guru', label: 'Guru' },
  { nilai: 'struktural', label: 'Struktural' },
]

const OPSI_STATUS_LUAR_RADIUS = [
  { nilai: 'menunggu', label: 'Menunggu' },
  { nilai: 'disetujui', label: 'Disetujui' },
  { nilai: 'ditolak', label: 'Ditolak' },
  { nilai: 'dibatalkan', label: 'Dibatalkan' },
]

const OPSI_JENIS_PENGAJUAN = [
  { nilai: 'izin', label: 'Izin' },
  { nilai: 'sakit', label: 'Sakit' },
  { nilai: 'dinas', label: 'Dinas' },
  { nilai: 'cuti', label: 'Cuti' },
]

/**
 * Nama bidang ringkasan yang lebih gamblang untuk laporan tertentu.
 *
 * Backend memakai label ringkas ("Terisi", "Belum", "Sesi") yang sama untuk semua
 * laporan. Pada FR-LAP-13 angka itu dihitung per jam pelajaran, sehingga diberi
 * satuan agar tidak terbaca sebagai jumlah kelas.
 */
const LABEL_RINGKASAN: Record<string, Record<string, string>> = {
  'FR-LAP-13': {
    Kelas: 'Kelas terdaftar',
    Sesi: 'Jam terjadwal',
    Terisi: 'Jam sudah diisi',
    Belum: 'Jam belum diisi',
    Berhalangan: 'Jam berhalangan (izin)',
  },
}

function labelRingkasan(kode: string, label: string): string {
  return LABEL_RINGKASAN[kode]?.[label] ?? label
}

const LABEL_FILTER: Record<JenisFilter, string> = {
  tanggal: 'Tanggal',
  pegawai: 'Pegawai',
  jenis_pegawai: 'Jenis Pegawai',
  kelas: 'Kelas',
  mapel: 'Mata Pelajaran',
  guru: 'Guru',
  status: 'Status',
  jenis: 'Jenis Pengajuan',
}

/**
 * 5.14 — halaman satu laporan (FR-LAP-01..09).
 *
 * Seluruh laporan memakai bentuk respons yang sama (`kolom` + `baris`), maka
 * satu halaman generik ini menyajikan kesembilannya: filter periode, filter
 * spesifik laporan, ringkasan, tabel, dan ekspor PDF/Excel (KP-5.1).
 */
export function LaporanPage({ konfigurasi }: { konfigurasi: KonfigurasiLaporan }) {
  const { user } = useAuth()
  const toast = useToast()
  const data = useDataLaporan()
  const dokumen = usePengaturanDokumen()

  const [pilihanPeriode, setPilihanPeriode] = useState<PilihanPeriode>(periodeAwal())
  const [tanggal, setTanggal] = useState(tanggalHariIni())
  const [filter, setFilter] = useState<Record<string, string>>({})
  const [semesterId, setSemesterId] = useState('')
  const [penandatanganIds, setPenandatanganIds] = useState<number[]>([])
  const [sedangEkspor, setSedangEkspor] = useState<FormatEkspor | null>(null)

  const pemantau = penggunaMemantau(user)
  /** Peran L(S) hanya boleh membuka datanya sendiri; pemilih orang disembunyikan. */
  const terbatasKeSendiri = !pemantau && user?.pegawai_id != null

  const wajib = useMemo(() => {
    const dasar = konfigurasi.wajib ?? []
    const tambahan = pemantau ? (konfigurasi.wajibPemantau ?? []) : []

    return [...dasar, ...tambahan]
  }, [konfigurasi.wajib, konfigurasi.wajibPemantau, pemantau])

  const belumLengkap = wajib.filter((f) => !filter[f])
  const waktuSiap = konfigurasi.modeWaktu === 'tanggal' ? tanggal !== '' : rentangSiap(pilihanPeriode)
  const siapDiminta = waktuSiap && belumLengkap.length === 0

  const params = useMemo(() => {
    const dasar: Record<string, unknown> =
      konfigurasi.modeWaktu === 'tanggal' ? { tanggal } : { ...paramsPeriode(pilihanPeriode) }

    if (konfigurasi.pakaiSemester && semesterId) dasar.semester_id = Number(semesterId)

    // Filter orang: peran L(S) selalu diarahkan ke dirinya sendiri, bukan
    // dikirim sebagai pilihan (server akan menolak id orang lain dengan 403).
    if (konfigurasi.filter.includes('pegawai')) {
      if (terbatasKeSendiri) dasar.pegawai_id = user?.pegawai_id ?? undefined
      else if (filter.pegawai) dasar.pegawai_id = Number(filter.pegawai)
    }

    if (konfigurasi.filter.includes('guru')) {
      if (terbatasKeSendiri) dasar.guru_id = user?.pegawai_id ?? undefined
      else if (filter.guru) dasar.guru_id = Number(filter.guru)
    }

    ;(['jenis_pegawai', 'status', 'jenis'] as const).forEach((k) => {
      if (konfigurasi.filter.includes(k) && filter[k]) dasar[k] = filter[k]
    })

    if (konfigurasi.filter.includes('kelas') && filter.kelas) dasar.kelas_id = Number(filter.kelas)
    if (konfigurasi.filter.includes('mapel') && filter.mapel) dasar.mapel_id = Number(filter.mapel)

    return dasar
  }, [konfigurasi, pilihanPeriode, tanggal, semesterId, filter, terbatasKeSendiri, user?.pegawai_id])

  const hasil = useQuery({
    queryKey: ['laporan', konfigurasi.endpoint, params],
    queryFn: () => ambilLaporan(konfigurasi.endpoint, params),
    enabled: siapDiminta,
  })

  async function ekspor(format: FormatEkspor) {
    setSedangEkspor(format)

    try {
      const kirim: Record<string, unknown> = { ...params }
      if (penandatanganIds.length > 0) kirim.penandatangan_ids = penandatanganIds

      const nama = await unduhLaporan(
        konfigurasi.endpoint,
        kirim,
        format,
        konfigurasi.namaBerkas,
      )
      toast.sukses(`Berkas ${nama} sedang diunduh.`)
    } catch (error) {
      toast.gagal(pesanError(error))
    } finally {
      setSedangEkspor(null)
    }
  }

  const daftarPenandatangan = dokumen.data?.data.penandatangan ?? []
  const maksPenandatangan = dokumen.data?.data.maks_penandatangan ?? 2

  return (
    <div className="space-y-4">
      <PageHeader
        judul={konfigurasi.judul}
        keterangan={konfigurasi.keterangan}
        aksi={
          <>
            <Button
              varian="secondary"
              memuat={sedangEkspor === 'excel'}
              onClick={() => void ekspor('excel')}
              disabled={!siapDiminta || sedangEkspor !== null}
            >
              <FileSpreadsheet size={17} /> Excel
            </Button>
            <Button
              memuat={sedangEkspor === 'pdf'}
              onClick={() => void ekspor('pdf')}
              disabled={!siapDiminta || sedangEkspor !== null}
            >
              <FileText size={17} /> PDF
            </Button>
          </>
        }
      />

      <section className="card p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-strong">
          <Filter size={16} /> Filter Laporan
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {konfigurasi.modeWaktu === 'periode' ? (
            <>
              <BidangPilihan
                label="Periode"
                id="periode"
                nilai={pilihanPeriode.periode}
                opsi={OPSI_PERIODE}
                kosongLabel="Pilih periode"
                onUbah={(v) =>
                  setPilihanPeriode((p) => ({ ...p, periode: v as PilihanPeriode['periode'] }))
                }
              />
              {pilihanPeriode.periode === 'rentang' && (
                <>
                  <BidangTeks
                    label="Dari Tanggal"
                    id="dari"
                    tipe="date"
                    nilai={pilihanPeriode.dari}
                    onUbah={(v) => setPilihanPeriode((p) => ({ ...p, dari: v }))}
                  />
                  <BidangTeks
                    label="Sampai Tanggal"
                    id="sampai"
                    tipe="date"
                    nilai={pilihanPeriode.sampai}
                    onUbah={(v) => setPilihanPeriode((p) => ({ ...p, sampai: v }))}
                  />
                </>
              )}
            </>
          ) : (
            <BidangTeks
              label="Tanggal"
              id="tanggal"
              tipe="date"
              wajib
              nilai={tanggal}
              onUbah={setTanggal}
            />
          )}

          {konfigurasi.pakaiSemester && (
            <BidangPilihan
              label="Semester"
              id="semester"
              nilai={semesterId}
              kosongLabel="Semester aktif"
              opsi={data.daftarSemester.map((s) => ({ nilai: s.id, label: s.label }))}
              onUbah={setSemesterId}
              petunjuk="Kosong = semester aktif (FR-LAP-11)."
            />
          )}

          {konfigurasi.filter.includes('pegawai') && !terbatasKeSendiri && (
            <BidangPilihan
              label="Pegawai"
              id="pegawai"
              nilai={filter.pegawai ?? ''}
              kosongLabel="Semua Pegawai"
              opsi={data.pegawai.map((p) => ({ nilai: p.id, label: p.nama }))}
              onUbah={(v) => setFilter((f) => ({ ...f, pegawai: v }))}
            />
          )}

          {konfigurasi.filter.includes('jenis_pegawai') && (
            <BidangPilihan
              label="Jenis Pegawai"
              id="jenis_pegawai"
              nilai={filter.jenis_pegawai ?? ''}
              kosongLabel="Semua Jenis"
              opsi={OPSI_JENIS_PEGAWAI}
              onUbah={(v) => setFilter((f) => ({ ...f, jenis_pegawai: v }))}
            />
          )}

          {konfigurasi.filter.includes('kelas') && (
            <BidangPilihan
              label="Kelas"
              id="kelas"
              nilai={filter.kelas ?? ''}
              kosongLabel={pemantau ? 'Pilih Kelas' : 'Kelas Wali Saya'}
              opsi={data.kelas.map((k) => ({ nilai: k.id, label: k.nama }))}
              onUbah={(v) => setFilter((f) => ({ ...f, kelas: v }))}
            />
          )}

          {konfigurasi.filter.includes('mapel') && (
            <BidangPilihan
              label="Mata Pelajaran"
              id="mapel"
              nilai={filter.mapel ?? ''}
              kosongLabel="Semua Mapel"
              opsi={data.mapel.map((m) => ({ nilai: m.id, label: `${m.kode} — ${m.nama}` }))}
              onUbah={(v) => setFilter((f) => ({ ...f, mapel: v }))}
            />
          )}

          {konfigurasi.filter.includes('guru') && !terbatasKeSendiri && (
            <BidangPilihan
              label="Guru"
              id="guru"
              nilai={filter.guru ?? ''}
              kosongLabel="Semua Guru"
              opsi={data.pegawai
                .filter((p) => p.jenis_pegawai === 'guru')
                .map((p) => ({ nilai: p.id, label: p.nama }))}
              onUbah={(v) => setFilter((f) => ({ ...f, guru: v }))}
            />
          )}

          {konfigurasi.filter.includes('status') && (
            <BidangPilihan
              label="Status"
              id="status"
              nilai={filter.status ?? ''}
              kosongLabel="Semua Status"
              opsi={OPSI_STATUS_LUAR_RADIUS}
              onUbah={(v) => setFilter((f) => ({ ...f, status: v }))}
            />
          )}

          {konfigurasi.filter.includes('jenis') && (
            <BidangPilihan
              label="Jenis Pengajuan"
              id="jenis"
              nilai={filter.jenis ?? ''}
              kosongLabel="Semua Jenis"
              opsi={OPSI_JENIS_PENGAJUAN}
              onUbah={(v) => setFilter((f) => ({ ...f, jenis: v }))}
            />
          )}
        </div>

        {belumLengkap.length > 0 && (
          <p className="mt-3 rounded-control bg-warn-bg px-3 py-2 text-xs font-semibold text-warn-text">
            Pilih dulu: {belumLengkap.map((f) => LABEL_FILTER[f]).join(', ')}.
          </p>
        )}
        {!waktuSiap && (
          <p className="mt-3 rounded-control bg-warn-bg px-3 py-2 text-xs font-semibold text-warn-text">
            Isi tanggal <em>dari</em> dan <em>sampai</em> agar rentangnya sesuai pilihan Anda.
          </p>
        )}

        {terbatasKeSendiri && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Lock size={13} /> Anda hanya dapat membuka laporan data Anda sendiri (L(S)).
          </p>
        )}

        {daftarPenandatangan.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Penandatangan (maks. {maksPenandatangan})
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {daftarPenandatangan
                .filter((p) => p.is_active !== false)
                .map((p) => {
                  const dipilih = penandatanganIds.includes(p.id)
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-strong">
                      <input
                        type="checkbox"
                        checked={dipilih}
                        onChange={(e) =>
                          setPenandatanganIds((ids) =>
                            e.target.checked
                              ? [...ids, p.id].slice(0, maksPenandatangan)
                              : ids.filter((i) => i !== p.id),
                          )
                        }
                      />
                      {p.jabatan}
                      {p.nama ? ` — ${p.nama}` : ''}
                    </label>
                  )
                })}
            </div>
            <p className="mt-1 text-xs text-muted">
              Dipakai pada PDF/Excel yang diekspor sekarang; kop & tata letaknya mengikuti
              pengaturan dokumen terkini (KP-5.2).
            </p>
          </div>
        )}
      </section>

      <IsiLaporan
        hasil={hasil.data}
        memuat={hasil.isLoading}
        galat={hasil.error}
        siapDiminta={siapDiminta}
        keteranganPeriode={labelPeriode(pilihanPeriode)}
        onCobaLagi={() => void hasil.refetch()}
      />
    </div>
  )
}

interface IsiLaporanProps {
  hasil: HasilLaporan | undefined
  memuat: boolean
  galat: unknown
  siapDiminta: boolean
  keteranganPeriode: string
  onCobaLagi: () => void
}

/**
 * Tabel laporan dengan kolom "Aksi" untuk membuka detail jurnal (FR-LAP-07).
 *
 * Dipisah menjadi komponen sendiri karena `IsiLaporan` memakai early return;
 * keadaan dialog tidak boleh dideklarasikan setelah return agar urutan hook tetap.
 */
function TabelBerdetail({
  baris,
  kolom,
}: {
  baris: BarisLaporan[]
  kolom: KolomTabel<BarisLaporan>[]
}) {
  const [idDetail, setIdDetail] = useState<number | null>(null)

  const kolomAksi: KolomTabel<BarisLaporan>[] = [
    ...kolom,
    {
      kunci: 'aksi',
      judul: '',
      className: 'w-20',
      render: (b) =>
        typeof b.id === 'number' ? (
          <Button
            type="button"
            varian="secondary"
            ukuran="sm"
            onClick={() => setIdDetail(b.id as number)}
            aria-label={`Lihat detail jurnal baris ${b.kunci + 1}`}
          >
            Lihat
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <DataTable
        data={baris}
        kunciBaris={(b) => b.kunci}
        kolom={kolomAksi}
        kosong="Tidak ada data pada periode/filter ini."
      />
      <DetailJurnalDialog id={idDetail} onTutup={() => setIdDetail(null)} />
    </>
  )
}

/**
 * Cabang tampilan laporan. Ketiganya (memuat, gagal, kosong) sengaja punya
 * tampilan sendiri: halaman yang hanya merender keadaan sukses akan menjadi
 * layar kosong tanpa jejak saat satu permintaan gagal.
 */
function IsiLaporan({
  hasil,
  memuat,
  galat,
  siapDiminta,
  keteranganPeriode,
  onCobaLagi,
}: IsiLaporanProps) {
  if (!siapDiminta) {
    return (
      <div className="card overflow-hidden">
        <EmptyState
          judul="Lengkapi filter"
          keterangan="Laporan akan dimuat setelah filter wajib diisi."
          icon={Filter}
        />
      </div>
    )
  }

  if (memuat) {
    return (
      <div className="card flex items-center justify-center gap-2 p-10 text-sm text-muted">
        <Loader2 size={18} className="animate-spin" /> Memuat laporan…
      </div>
    )
  }

  if (galat !== null && galat !== undefined) {
    return (
      <div className="card space-y-3 p-6 text-center">
        <AlertCircle className="mx-auto text-danger" size={28} />
        <p className="text-sm font-semibold text-strong">{pesanError(galat)}</p>
        <Button varian="secondary" ukuran="sm" onClick={onCobaLagi}>
          Coba lagi
        </Button>
      </div>
    )
  }

  if (!hasil) return null

  // FR-LAP-07 mengirim `jurnal[]` sejajar baris agar admin/kepala sekolah dapat
  // membuka detail read-only satu jurnal dari tabel laporan.
  const baris = keBarisLaporan(hasil.baris, hasil.jurnal)
  const bolehDetail = baris.some((b) => typeof b.id === 'number')
  const kolom: KolomTabel<BarisLaporan>[] = hasil.kolom.map((judul, i) => ({
    kunci: String(i),
    judul,
    // Tabel laporan bisa berkolom banyak; pada layar kecil hanya tiga kolom
    // pertama yang ditampilkan agar tidak menjadi gulir horizontal panjang.
    sembunyiMobile: i >= 3,
    render: (b) => {
      const nilai = b.sel[i]
      const teks = teksSel(nilai)
      if (i === 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(nilai))) {
        return <span className="tnum">{formatTanggalDari(teks)}</span>
      }

      return <span className={typeof nilai === 'number' ? 'tnum' : undefined}>{teks}</span>
    },
  }))

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-muted">
        <span className="font-semibold text-strong">{hasil.judul}</span>
        <span>
          Kode {hasil.kode} · Periode: {hasil.periode || keteranganPeriode}
        </span>
      </div>

      {(hasil.ringkasan ?? []).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(hasil.ringkasan ?? []).map((r) => (
            <StatCard
              key={r.label}
              label={labelRingkasan(hasil.kode, r.label)}
              nilai={r.nilai}
            />
          ))}
        </div>
      )}

      {/* FR-LAP-13 menyajikan ringkasan status jurnal per kelas di atas detail sesi */}
      {hasil.kode === 'FR-LAP-13' && (
        <RingkasanKelasHarian data={hasil.kelas} periode={hasil.periode} libur={hasil.libur} />
      )}

      {/* Hari libur tidak punya sesi, jadi tabel detail dikosongkan dengan alasan
          yang jelas — bukan "tidak ada data" yang terbaca seperti kegagalan. */}
      {hasil.libur?.ada === true ? (
        <div className="card flex items-start gap-3 border-l-4 border-l-pending p-5">
          <Info size={18} className="mt-0.5 shrink-0 text-pending" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-strong">
              Hari libur{hasil.libur.keterangan ? `: ${hasil.libur.keterangan}` : ''}
            </p>
            <p className="text-xs text-muted">
              Tidak ada sesi yang dihitung dan tidak ada jurnal yang wajib diisi pada hari ini.
            </p>
          </div>
        </div>
      ) : bolehDetail ? (
        <TabelBerdetail baris={baris} kolom={kolom} />
      ) : (
        <DataTable
          data={baris}
          kunciBaris={(b) => b.kunci}
          kolom={kolom}
          kosong="Tidak ada data pada periode/filter ini."
        />
      )}

      {baris.length > 0 && (
        <p className="text-xs text-muted">{baris.length} baris ditampilkan.</p>
      )}
    </div>
  )
}
