import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, KeyRound, MonitorPlay, RefreshCw, Trash2 } from 'lucide-react'

import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import type { KolomTabel } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { del, get, post, put } from '@/lib/api'
import { pesanPerBidang } from '@/lib/crud'
import { formatTanggalPanjang } from '@/lib/format'
import { bagiKolomTv } from '@/features/tv/logika'
import type { RekapTv } from '@/features/tv/types'

interface PengaturanTv {
  tv_aktif: boolean
  tv_izinkan_npsn: boolean
  tv_interval_detik: number
  tv_masa_berlaku_hari: number
  tv_tema: string
  tv_skala_font: string
  tv_tampilkan_alasan_izin: boolean
  tv_tampilkan_ulang_tahun: boolean
  tv_rotasi_panel_detik: number
  tv_kecepatan_scroll: string
  kode: string
}

interface SesiTv {
  id: number
  nama_perangkat: string | null
  ip: string | null
  terakhir_aktif_at: string | null
  kedaluwarsa_at: string | null
}

const OPSI_TEMA = [
  { nilai: 'gelap', label: 'Gelap (disarankan untuk TV)' },
  { nilai: 'terang', label: 'Terang' },
]

const OPSI_SKALA = [
  { nilai: 'normal', label: 'Normal' },
  { nilai: 'besar', label: 'Besar' },
  { nilai: 'ekstra_besar', label: 'Ekstra Besar' },
]

const OPSI_SCROLL = [
  { nilai: 'lambat', label: 'Lambat' },
  { nilai: 'normal', label: 'Normal' },
  { nilai: 'cepat', label: 'Cepat' },
]

/** FR-TV-16 — pengaturan Layar TV dan daftar sesi TV aktif. */
export function PengaturanTvPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [form, setForm] = useState<PengaturanTv | null>(null)
  const [galatBidang, setGalatBidang] = useState<Record<string, string>>({})
  const [konfirmasiUlang, setKonfirmasiUlang] = useState(false)
  const [sesiDicabut, setSesiDicabut] = useState<SesiTv | null>(null)
  const [pratinjauTerbuka, setPratinjauTerbuka] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pengaturan', 'tv'],
    queryFn: () => get<{ data: PengaturanTv }>('/pengaturan/tv'),
  })

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  const sesi = useQuery({
    queryKey: ['pengaturan', 'tv', 'sesi'],
    queryFn: () => get<{ data: SesiTv[] }>('/pengaturan/tv/sesi'),
  })

  const pratinjau = useQuery({
    queryKey: ['pengaturan', 'tv', 'pratinjau'],
    queryFn: () => get<{ data: RekapTv }>('/pengaturan/tv/pratinjau'),
    enabled: pratinjauTerbuka,
  })

  const simpan = useMutation({
    mutationFn: (isi: PengaturanTv) =>
      put<{ data: PengaturanTv }>('/pengaturan/tv', {
        tv_aktif: isi.tv_aktif,
        tv_izinkan_npsn: isi.tv_izinkan_npsn,
        tv_interval_detik: isi.tv_interval_detik,
        tv_masa_berlaku_hari: isi.tv_masa_berlaku_hari,
        tv_tema: isi.tv_tema,
        tv_skala_font: isi.tv_skala_font,
        tv_tampilkan_alasan_izin: isi.tv_tampilkan_alasan_izin,
        tv_tampilkan_ulang_tahun: isi.tv_tampilkan_ulang_tahun,
        tv_rotasi_panel_detik: isi.tv_rotasi_panel_detik,
        tv_kecepatan_scroll: isi.tv_kecepatan_scroll,
      }),
    onSuccess: (res) => {
      setGalatBidang({})
      setForm(res.data)
      toast.sukses('Pengaturan Layar TV disimpan.')
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'tv'] })
    },
    onError: (e) => {
      setGalatBidang(pesanPerBidang(e))
      toast.gagal('Pengaturan gagal disimpan.')
    },
  })

  const buatUlang = useMutation({
    mutationFn: () => post<{ data: { kode: string; sesi_dicabut: number; sisa_sesi: number } }>('/pengaturan/tv/kode/buat-ulang'),
    onSuccess: (res) => {
      setKonfirmasiUlang(false)
      toast.sukses(
        `Kode TV baru dibuat. ${res.data.sesi_dicabut} sesi TV dicabut (sisa ${res.data.sisa_sesi}).`,
      )
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'tv'] })
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'tv', 'sesi'] })
    },
    onError: () => toast.gagal('Kode TV gagal dibuat ulang.'),
  })

  const cabut = useMutation({
    mutationFn: (id: number) => del(`/pengaturan/tv/sesi/${id}`),
    onSuccess: () => {
      setSesiDicabut(null)
      toast.sukses('Sesi TV dicabut.')
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'tv', 'sesi'] })
    },
    onError: () => toast.gagal('Sesi TV gagal dicabut.'),
  })

  const kolomSesi: KolomTabel<SesiTv>[] = [
    {
      kunci: 'nama_perangkat',
      judul: 'Nama Perangkat',
      render: (s) => <span className="font-semibold text-strong">{s.nama_perangkat ?? 'Tanpa nama'}</span>,
    },
    {
      kunci: 'ip',
      judul: 'IP',
      render: (s) => <span className="tnum text-muted">{s.ip ?? '-'}</span>,
      sembunyiMobile: true,
    },
    {
      kunci: 'terakhir_aktif_at',
      judul: 'Terakhir Aktif',
      render: (s) => (
        <span className="text-muted">
          {s.terakhir_aktif_at ? formatTanggalPanjang(new Date(s.terakhir_aktif_at)) : '-'}
        </span>
      ),
    },
    {
      kunci: 'kedaluwarsa_at',
      judul: 'Berlaku Sampai',
      render: (s) => (
        <span className="text-muted">
          {s.kedaluwarsa_at ? formatTanggalPanjang(new Date(s.kedaluwarsa_at)) : '-'}
        </span>
      ),
      sembunyiMobile: true,
    },
    {
      kunci: 'aksi',
      judul: 'Aksi',
      render: (s) => (
        <Button varian="danger" ukuran="sm" onClick={() => setSesiDicabut(s)}>
          <Trash2 size={14} /> Cabut
        </Button>
      ),
    },
  ]

  if (isLoading || form === null) {
    return (
      <div className="space-y-4">
        <PageHeader judul="Pengaturan Layar TV" keterangan="Memuat pengaturan…" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader judul="Pengaturan Layar TV" />
        <p className="card p-6 text-sm text-muted">
          Pengaturan Layar TV gagal dimuat. Periksa koneksi lalu muat ulang halaman.
        </p>
      </div>
    )
  }

  const ubah = <K extends keyof PengaturanTv>(kunci: K, nilai: PengaturanTv[K]): void =>
    setForm((f) => (f === null ? f : { ...f, [kunci]: nilai }))

  return (
    <div className="space-y-5">
      <PageHeader
        judul="Pengaturan Layar TV"
        keterangan="Atur tampilan rekap harian pada layar TV sekolah (5.19)."
        aksi={
          <Button varian="secondary" onClick={() => setPratinjauTerbuka(true)}>
            <Eye size={16} /> Pratinjau
          </Button>
        }
      />

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-strong">Kode TV</h2>
            <p className="mt-0.5 text-xs text-muted">
              Masukkan kode ini pada perangkat TV di halaman <code>/tv</code>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="tnum rounded-control bg-app-soft px-4 py-2 text-lg font-extrabold tracking-[0.3em] text-strong">
              {form.kode}
            </span>
            <Button varian="danger" onClick={() => setKonfirmasiUlang(true)}>
              <RefreshCw size={16} /> Buat Ulang
            </Button>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-bold text-strong">Tampilan &amp; Perilaku</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <BidangPilihan
            label="Status Layar TV"
            id="tv-aktif"
            nilai={form.tv_aktif ? 'aktif' : 'nonaktif'}
            onUbah={(v) => ubah('tv_aktif', v === 'aktif')}
            opsi={[
              { nilai: 'aktif', label: 'Aktif' },
              { nilai: 'nonaktif', label: 'Nonaktif' },
            ]}
            kosongLabel="— Pilih —"
            pesanError={galatBidang.tv_aktif}
          />

          <BidangPilihan
            label="Izinkan masuk dengan NPSN"
            id="tv-npsn"
            nilai={form.tv_izinkan_npsn ? 'ya' : 'tidak'}
            onUbah={(v) => ubah('tv_izinkan_npsn', v === 'ya')}
            opsi={[
              { nilai: 'ya', label: 'Ya' },
              { nilai: 'tidak', label: 'Tidak' },
            ]}
            pesanError={galatBidang.tv_izinkan_npsn}
          />

          <BidangTeks
            label="Interval Refresh (detik)"
            id="tv-interval"
            tipe="number"
            nilai={form.tv_interval_detik}
            onUbah={(v) => ubah('tv_interval_detik', Number(v))}
            petunjuk="10–120 detik."
            pesanError={galatBidang.tv_interval_detik}
          />

          <BidangTeks
            label="Masa Berlaku Token (hari)"
            id="tv-masa"
            tipe="number"
            nilai={form.tv_masa_berlaku_hari}
            onUbah={(v) => ubah('tv_masa_berlaku_hari', Number(v))}
            petunjuk="1–365 hari."
            pesanError={galatBidang.tv_masa_berlaku_hari}
          />

          <BidangPilihan
            label="Tema"
            id="tv-tema"
            nilai={form.tv_tema}
            onUbah={(v) => ubah('tv_tema', v)}
            opsi={OPSI_TEMA}
            pesanError={galatBidang.tv_tema}
          />

          <BidangPilihan
            label="Skala Font"
            id="tv-skala"
            nilai={form.tv_skala_font}
            onUbah={(v) => ubah('tv_skala_font', v)}
            opsi={OPSI_SKALA}
            pesanError={galatBidang.tv_skala_font}
          />

          <BidangTeks
            label="Durasi Rotasi Panel (detik)"
            id="tv-rotasi"
            tipe="number"
            nilai={form.tv_rotasi_panel_detik}
            onUbah={(v) => ubah('tv_rotasi_panel_detik', Number(v))}
            petunjuk="3–60 detik."
            pesanError={galatBidang.tv_rotasi_panel_detik}
          />

          <BidangPilihan
            label="Kecepatan Teks Berjalan"
            id="tv-scroll"
            nilai={form.tv_kecepatan_scroll}
            onUbah={(v) => ubah('tv_kecepatan_scroll', v)}
            opsi={OPSI_SCROLL}
            pesanError={galatBidang.tv_kecepatan_scroll}
          />

          <BidangPilihan
            label="Tampilkan Alasan Izin"
            id="tv-alasan"
            nilai={form.tv_tampilkan_alasan_izin ? 'ya' : 'tidak'}
            onUbah={(v) => ubah('tv_tampilkan_alasan_izin', v === 'ya')}
            opsi={[
              { nilai: 'ya', label: 'Ya' },
              { nilai: 'tidak', label: 'Tidak' },
            ]}
            petunjuk="BR-33 — alasan izin disembunyikan secara bawaan."
            pesanError={galatBidang.tv_tampilkan_alasan_izin}
          />

          <BidangPilihan
            label="Tampilkan Ulang Tahun"
            id="tv-ultah"
            nilai={form.tv_tampilkan_ulang_tahun ? 'ya' : 'tidak'}
            onUbah={(v) => ubah('tv_tampilkan_ulang_tahun', v === 'ya')}
            opsi={[
              { nilai: 'ya', label: 'Ya' },
              { nilai: 'tidak', label: 'Tidak' },
            ]}
            pesanError={galatBidang.tv_tampilkan_ulang_tahun}
          />
        </div>

        <div className="flex justify-end">
          <Button memuat={simpan.isPending} onClick={() => form && simpan.mutate(form)}>
            Simpan Pengaturan
          </Button>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-strong">Sesi TV Aktif</h2>
            <p className="mt-0.5 text-xs text-muted">
              Perangkat TV yang sedang terhubung. Cabut sesi bila perangkat tidak lagi dipakai.
            </p>
          </div>
          <StatusBadge varian="netral">
            <MonitorPlay size={13} className="mr-1" /> {sesi.data?.data.length ?? 0} sesi
          </StatusBadge>
        </div>

        <div className="mt-4">
          <DataTable
            kolom={kolomSesi}
            data={sesi.data?.data ?? []}
            kunciBaris={(s) => s.id}
            kosong="Belum ada perangkat TV yang terhubung."
          />
        </div>
      </section>

      <ConfirmDialog
        terbuka={konfirmasiUlang}
        judul="Buat ulang kode TV?"
        keterangan="PERINGATAN: membuat ulang kode akan MENCABUT SEMUA sesi TV yang sedang aktif. Setiap layar TV harus memasukkan kode baru (BR-35)."
        labelKonfirmasi="Ya, buat ulang kode"
        memuat={buatUlang.isPending}
        onKonfirmasi={() => buatUlang.mutate()}
        onTutup={() => setKonfirmasiUlang(false)}
      />

      <ConfirmDialog
        terbuka={sesiDicabut !== null}
        judul="Cabut sesi TV ini?"
        keterangan={`Perangkat "${sesiDicabut?.nama_perangkat ?? 'Tanpa nama'}" akan langsung kehilangan akses dan harus memasukkan kode TV kembali.`}
        labelKonfirmasi="Cabut sesi"
        memuat={cabut.isPending}
        onKonfirmasi={() => sesiDicabut && cabut.mutate(sesiDicabut.id)}
        onTutup={() => setSesiDicabut(null)}
      />

      <Modal
        terbuka={pratinjauTerbuka}
        judul="Pratinjau Rekap Layar TV"
        keterangan="Angka diambil dari layanan yang sama dengan layar TV (BR-37)."
        lebar="lg"
        onTutup={() => setPratinjauTerbuka(false)}
      >
        {pratinjau.isLoading && <p className="text-sm text-muted">Memuat pratinjau…</p>}
        {pratinjau.isError && (
          <p className="text-sm text-danger">Pratinjau gagal dimuat. Coba lagi sebentar lagi.</p>
        )}
        {pratinjau.data && <IsiPratinjau rekap={pratinjau.data.data} />}
      </Modal>
    </div>
  )
}

function IsiPratinjau({ rekap }: { rekap: RekapTv }) {
  const kolom = bagiKolomTv(rekap)

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted">
        <KeyRound size={14} />
        {rekap.server.nama_hari}, {rekap.server.tanggal} · zona {rekap.server.zona}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {kolom.map((k) => (
          <div key={k.kunci} className="rounded-control bg-app-soft p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{k.judul}</p>
            <dl className="mt-2 space-y-1">
              {k.ringkasan.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">{r.label}</dt>
                  <dd className="tnum font-bold text-strong">{r.nilai}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        {rekap.pengumuman.teks_berjalan.length} teks berjalan · {rekap.pengumuman.kartu.length} kartu
        pengumuman · {rekap.ulang_tahun.daftar.length} ulang tahun hari ini.
      </p>
    </div>
  )
}
