import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  FileSignature,
  ImageOff,
  PenLine,
  Plus,
  Save,
  ScrollText,
  Stamp,
  Trash2,
} from 'lucide-react'

import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { kelasInput } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { api, del, get, pesanError, post, put } from '@/lib/api'
import { pesanPerBidang } from '@/lib/crud'
import { cn } from '@/lib/cn'
import type { ProfilSekolah } from '@/features/sekolah/useSekolah'

/** FR-SCH — sebagian bidang Info Sekolah yang wajib ada saat menyimpan kop. */
interface SekolahUntukKop {
  nama_sekolah: string
  npsn: string
  nama_kepala_sekolah: string
}

interface KopPengaturan {
  baris1: string | null
  baris2: string | null
  baris3: string | null
  alamat: string | null
  kontak: string | null
  tampilkan_logo_kiri: boolean
  tampilkan_logo_kanan: boolean
  ada_logo_kiri: boolean
  ada_logo_kanan: boolean
}

interface TataLetakTtd {
  kota_penetapan: string | null
  mode_tanggal: 'otomatis' | 'manual'
  tanggal_manual: string | null
  posisi: 'kanan' | 'kiri' | 'dua_kolom'
  tampilkan_mengetahui: boolean
}

interface Penandatangan {
  id: number
  jabatan: string
  nama: string
  nip: string | null
  urutan: number
  is_default: boolean
  is_active: boolean
  ada_ttd: boolean
  ada_stempel: boolean
}

interface ResponsPengaturan {
  data: {
    kop: KopPengaturan
    tanda_tangan: TataLetakTtd
    penandatangan: Penandatangan[]
  }
}

type Tab = 'kop' | 'penandatangan' | 'tata-letak'

const OPSI_POSISI = [
  { nilai: 'kanan', label: 'Kanan' },
  { nilai: 'kiri', label: 'Kiri' },
  { nilai: 'dua_kolom', label: 'Dua Kolom' },
]

const OPSI_MODE_TANGGAL = [
  { nilai: 'otomatis', label: 'Otomatis (tanggal cetak)' },
  { nilai: 'manual', label: 'Manual' },
]

/**
 * 5.15 — kop surat & tanda tangan (FR-KOP-02..05).
 *
 * Satu halaman dengan tiga tab karena ketiganya bekerja pada satu dokumen yang
 * sama: teks kop, daftar penandatangan, lalu tata letak + pratinjau. Rute
 * `/pengaturan/kop-surat` dan `/pengaturan/penandatangan` masuk ke tab yang
 * sesuai agar tautan menu lama tetap bekerja.
 */
export function PengaturanDokumenPage({ tabAwal = 'kop' }: { tabAwal?: Tab }) {
  const [tab, setTab] = useState<Tab>(tabAwal)

  const pengaturan = useQuery({
    queryKey: ['pengaturan', 'ttd'],
    queryFn: () => get<ResponsPengaturan>('/pengaturan/ttd'),
  })

  const d = pengaturan.data?.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Kop Surat & Tanda Tangan"
        keterangan="Dipakai konsisten pada semua laporan PDF dan dokumen cetak (FR-KOP-06). Perubahan langsung berlaku pada dokumen berikutnya."
      />

      <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card" role="tablist">
        {(
          [
            ['kop', 'Kop Surat'],
            ['penandatangan', 'Penandatangan'],
            ['tata-letak', 'Tata Letak & Pratinjau'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              'flex-1 rounded-[13px] px-3 py-2.5 text-sm font-bold transition-colors',
              tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {pengaturan.isLoading && (
        <div className="card p-10 text-center text-sm text-muted">Memuat pengaturan dokumen…</div>
      )}

      {pengaturan.isError && (
        <div className="card space-y-3 p-6 text-center">
          <p className="text-sm font-semibold text-strong">{pesanError(pengaturan.error)}</p>
          <Button varian="secondary" ukuran="sm" onClick={() => void pengaturan.refetch()}>
            Coba lagi
          </Button>
        </div>
      )}

      {d && (
        <>
          {tab === 'kop' && <BagianKop kop={d.kop} />}
          {tab === 'penandatangan' && <BagianPenandatangan daftar={d.penandatangan} />}
          {tab === 'tata-letak' && (
            <BagianTataLetak tata={d.tanda_tangan} daftarPenandatangan={d.penandatangan} />
          )}
        </>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Kop surat */

function BagianKop({ kop }: { kop: KopPengaturan }) {
  const qc = useQueryClient()
  const toast = useToast()

  const [nilai, setNilai] = useState({
    baris1: kop.baris1 ?? '',
    baris2: kop.baris2 ?? '',
    baris3: kop.baris3 ?? '',
    tampilkan_logo_kiri: kop.tampilkan_logo_kiri,
    tampilkan_logo_kanan: kop.tampilkan_logo_kanan,
  })
  const [galat, setGalat] = useState<Record<string, string>>({})

  // Identitas sekolah wajib ikut terkirim karena endpoint Info Sekolah
  // menyimpan seluruh profil sebagai satu kesatuan (FR-SCH-01).
  const sekolah = useQuery({
    queryKey: ['pengaturan', 'sekolah'],
    queryFn: () => get<{ data: ProfilSekolah & SekolahUntukKop }>('/pengaturan/sekolah'),
  })

  useEffect(() => {
    setNilai({
      baris1: kop.baris1 ?? '',
      baris2: kop.baris2 ?? '',
      baris3: kop.baris3 ?? '',
      tampilkan_logo_kiri: kop.tampilkan_logo_kiri,
      tampilkan_logo_kanan: kop.tampilkan_logo_kanan,
    })
  }, [kop])

  const simpan = useMutation({
    mutationFn: async () => {
      const s = sekolah.data?.data
      if (!s) throw new Error('Info Sekolah belum termuat. Coba lagi sebentar lagi.')

      const form = new FormData()
      form.append('nama_sekolah', s.nama_sekolah)
      form.append('npsn', s.npsn)
      form.append('nama_kepala_sekolah', s.nama_kepala_sekolah)
      form.append('kop_baris1', nilai.baris1)
      form.append('kop_baris2', nilai.baris2)
      form.append('kop_baris3', nilai.baris3)
      form.append('kop_tampilkan_logo_kiri', nilai.tampilkan_logo_kiri ? '1' : '0')
      form.append('kop_tampilkan_logo_kanan', nilai.tampilkan_logo_kanan ? '1' : '0')

      return post('/pengaturan/sekolah', form)
    },
    onSuccess: () => {
      toast.sukses('Kop surat berhasil disimpan.')
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'ttd'] })
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'sekolah'] })
      void qc.invalidateQueries({ queryKey: ['laporan', 'pengaturan-dokumen'] })
    },
    onError: (e) => {
      setGalat(pesanPerBidang(e))
      toast.gagal(pesanError(e))
    },
  })

  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-strong">
          <ScrollText size={18} /> Baris Teks Kop (FR-KOP-02)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Baris 1–3 tampil paling atas dokumen (mis. nama pemerintah provinsi, dinas pendidikan,
          lalu nama sekolah). Alamat dan kontak diambil otomatis dari Info Sekolah.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BidangTeks
          label="Baris 1"
          id="kop_baris1"
          nilai={nilai.baris1}
          pesanError={galat.kop_baris1}
          placeholder="PEMERINTAH PROVINSI JAWA TIMUR"
          onUbah={(v) => setNilai((n) => ({ ...n, baris1: v }))}
          className="sm:col-span-2"
        />
        <BidangTeks
          label="Baris 2"
          id="kop_baris2"
          nilai={nilai.baris2}
          pesanError={galat.kop_baris2}
          placeholder="DINAS PENDIDIKAN"
          onUbah={(v) => setNilai((n) => ({ ...n, baris2: v }))}
          className="sm:col-span-2"
        />
        <BidangTeks
          label="Baris 3"
          id="kop_baris3"
          nilai={nilai.baris3}
          pesanError={galat.kop_baris3}
          placeholder="SMK ISLAM ANHARUL ULUM"
          onUbah={(v) => setNilai((n) => ({ ...n, baris3: v }))}
          className="sm:col-span-2"
        />
      </div>

      <div className="rounded-control bg-app-soft p-3 text-xs text-strong">
        <p className="font-bold uppercase tracking-wide text-muted">Alamat & kontak (dari Info Sekolah)</p>
        <p className="mt-1">{kop.alamat || '—'}</p>
        <p className="mt-0.5">{kop.kontak || '—'}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-strong">Posisi Logo</p>
        {(
          [
            ['tampilkan_logo_kiri', 'Logo kiri', kop.ada_logo_kiri],
            ['tampilkan_logo_kanan', 'Logo kanan', kop.ada_logo_kanan],
          ] as const
        ).map(([kunci, label, ada]) => (
          <label key={kunci} className="flex items-center gap-2 text-sm text-strong">
            <input
              type="checkbox"
              checked={nilai[kunci]}
              onChange={(e) => setNilai((n) => ({ ...n, [kunci]: e.target.checked }))}
            />
            {label}
            {!ada && <span className="text-xs text-muted">(belum ada berkas — unggah di Info Sekolah)</span>}
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          memuat={simpan.isPending}
          disabled={!sekolah.data}
          onClick={() => simpan.mutate()}
        >
          <Save size={17} /> Simpan Kop
        </Button>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- Penandatangan */

interface FormPenandatangan {
  id: number | null
  jabatan: string
  nama: string
  nip: string
  urutan: string
  is_default: boolean
  is_active: boolean
  ttd: File | null
  stempel: File | null
  /** Bedakan "sudah ada gambar" dari "gambar baru dipilih" (dikirim server). */
  ada_ttd: boolean
  ada_stempel: boolean
  hapus_ttd: boolean
  hapus_stempel: boolean
}

const FORM_PENANDATANGAN_KOSONG: FormPenandatangan = {
  id: null,
  jabatan: '',
  nama: '',
  nip: '',
  urutan: '1',
  is_default: false,
  is_active: true,
  ttd: null,
  stempel: null,
  ada_ttd: false,
  ada_stempel: false,
  hapus_ttd: false,
  hapus_stempel: false,
}

function BagianPenandatangan({ daftar }: { daftar: Penandatangan[] }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState<FormPenandatangan | null>(null)
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [hapus, setHapus] = useState<Penandatangan | null>(null)

  const segarkan = () => {
    void qc.invalidateQueries({ queryKey: ['pengaturan', 'ttd'] })
    void qc.invalidateQueries({ queryKey: ['laporan', 'pengaturan-dokumen'] })
  }

  const simpan = useMutation({
    mutationFn: async (data: FormPenandatangan) => {
      const body = new FormData()
      body.append('jabatan', data.jabatan)
      body.append('nama', data.nama)
      if (data.nip) body.append('nip', data.nip)
      body.append('urutan', data.urutan || '1')
      body.append('is_default', data.is_default ? '1' : '0')
      body.append('is_active', data.is_active ? '1' : '0')
      if (data.ttd) body.append('ttd', data.ttd)
      if (data.stempel) body.append('stempel', data.stempel)
      if (data.hapus_ttd) body.append('hapus_ttd', '1')
      if (data.hapus_stempel) body.append('hapus_stempel', '1')

      return data.id === null
        ? post('/pengaturan/penandatangan', body)
        : put(`/pengaturan/penandatangan/${data.id}`, body)
    },
    onSuccess: () => {
      toast.sukses('Penandatangan berhasil disimpan.')
      setForm(null)
      setGalat({})
      segarkan()
    },
    onError: (e) => {
      setGalat(pesanPerBidang(e))
      toast.gagal(pesanError(e))
    },
  })

  const hapusMutasi = useMutation({
    mutationFn: (p: Penandatangan) => del(`/pengaturan/penandatangan/${p.id}`),
    onSuccess: () => {
      toast.sukses('Penandatangan berhasil dihapus.')
      setHapus(null)
      segarkan()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const ubah = (k: keyof FormPenandatangan, v: unknown) =>
    setForm((f) => (f ? { ...f, [k]: v } : f))

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-strong">
            <FileSignature size={18} /> Penandatangan (FR-KOP-03)
          </h2>
          <p className="mt-1 text-xs text-muted">
            Maksimal dua penandatangan dipakai per dokumen. Gambar tanda tangan & stempel berupa PNG
            transparan (opsional) dan akan diubah ke PNG walau sumbernya format lain.
          </p>
        </div>
        <Button
          onClick={() => {
            setGalat({})
            setForm({ ...FORM_PENANDATANGAN_KOSONG })
          }}
        >
          <Plus size={17} /> Tambah
        </Button>
      </div>

      {daftar.length === 0 ? (
        <EmptyState
          judul="Belum ada penandatangan"
          keterangan="Tambahkan jabatan, nama, dan NIP penandatangan dokumen resmi."
          icon={FileSignature}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {daftar.map((p) => (
            <div key={p.id} className="rounded-control border border-line p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-strong">{p.jabatan}</p>
                  <p className="truncate text-sm text-muted">{p.nama || '—'}</p>
                  <p className="mt-0.5 text-xs text-muted">NIP: {p.nip || '—'}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">#{p.urutan}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {p.is_default && <StatusBadge varian="sukses">Default</StatusBadge>}
                {!p.is_active && <StatusBadge varian="cuti">Nonaktif</StatusBadge>}
                <StatusBadge varian={p.ada_ttd ? 'sukses' : 'netral'}>
                  {p.ada_ttd ? 'Ada TTD' : 'Tanpa TTD'}
                </StatusBadge>
                <StatusBadge varian={p.ada_stempel ? 'sukses' : 'netral'}>
                  {p.ada_stempel ? 'Ada Stempel' : 'Tanpa Stempel'}
                </StatusBadge>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  varian="secondary"
                  ukuran="sm"
                  onClick={() => {
                    setGalat({})
                    setForm({
                      id: p.id,
                      jabatan: p.jabatan,
                      nama: p.nama,
                      nip: p.nip ?? '',
                      urutan: String(p.urutan),
                      is_default: p.is_default,
                      is_active: p.is_active,
                      ttd: null,
                      stempel: null,
                      ada_ttd: p.ada_ttd,
                      ada_stempel: p.ada_stempel,
                      hapus_ttd: false,
                      hapus_stempel: false,
                    })
                  }}
                >
                  <PenLine size={15} /> Ubah
                </Button>
                <Button varian="danger" ukuran="sm" onClick={() => setHapus(p)}>
                  <Trash2 size={15} /> Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        terbuka={form !== null}
        judul={form?.id === null ? 'Tambah Penandatangan' : 'Ubah Penandatangan'}
        onTutup={() => setForm(null)}
      >
        {form && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <BidangTeks
                label="Jabatan"
                id="jabatan"
                wajib
                nilai={form.jabatan}
                pesanError={galat.jabatan}
                placeholder="Kepala Sekolah"
                onUbah={(v) => ubah('jabatan', v)}
              />
              <BidangTeks
                label="Nama"
                id="nama"
                wajib
                nilai={form.nama}
                pesanError={galat.nama}
                onUbah={(v) => ubah('nama', v)}
              />
              <BidangTeks
                label="NIP"
                id="nip"
                nilai={form.nip}
                pesanError={galat.nip}
                onUbah={(v) => ubah('nip', v)}
              />
              <BidangTeks
                label="Urutan"
                id="urutan"
                tipe="number"
                nilai={form.urutan}
                pesanError={galat.urutan}
                petunjuk="Urutan tampil pada blok tanda tangan."
                onUbah={(v) => ubah('urutan', v)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-strong">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => ubah('is_default', e.target.checked)}
                />
                Jadikan penandatangan default
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-strong">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => ubah('is_active', e.target.checked)}
                />
                Aktif (muncul pada pilihan laporan)
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['ttd', 'Gambar Tanda Tangan (PNG)', form.ada_ttd, form.hapus_ttd, PenLine],
                  ['stempel', 'Gambar Stempel (PNG)', form.ada_stempel, form.hapus_stempel, Stamp],
                ] as const
              ).map(([kunci, label, ada, hapusFlag, Icon]) => (
                <div key={kunci}>
                  <span className="mb-1.5 block text-sm font-semibold text-strong">{label}</span>
                  <input
                    type="file"
                    accept="image/png,image/*"
                    onChange={(e) => ubah(kunci, e.target.files?.[0] ?? null)}
                    className={kelasInput}
                  />
                  {form.id !== null && ada && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={hapusFlag}
                        onChange={(e) => ubah(kunci === 'ttd' ? 'hapus_ttd' : 'hapus_stempel', e.target.checked)}
                      />
                      Hapus gambar yang tersimpan
                    </label>
                  )}
                  {form.id !== null && !ada && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <ImageOff size={12} /> Belum ada gambar tersimpan.
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <Icon size={12} /> Maksimal 1 MB sebelum dikompres.
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button varian="ghost" onClick={() => setForm(null)}>
                Batal
              </Button>
              <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>
                <Save size={17} /> Simpan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        terbuka={hapus !== null}
        judul="Hapus penandatangan?"
        keterangan={
          hapus
            ? `${hapus.jabatan}${hapus.nama ? ` — ${hapus.nama}` : ''} beserta gambar tanda tangan dan stempelnya akan dihapus.`
            : ''
        }
        varian="danger"
        memuat={hapusMutasi.isPending}
        onKonfirmasi={() => hapus && hapusMutasi.mutate(hapus)}
        onTutup={() => setHapus(null)}
      />
    </section>
  )
}

/* ------------------------------------------------- Tata letak & pratinjau */

function BagianTataLetak({
  tata,
  daftarPenandatangan,
}: {
  tata: TataLetakTtd
  daftarPenandatangan: Penandatangan[]
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const [nilai, setNilai] = useState({
    kota_penetapan: tata.kota_penetapan ?? '',
    mode_tanggal: tata.mode_tanggal,
    tanggal_manual: tata.tanggal_manual ?? '',
    posisi: tata.posisi,
    tampilkan_mengetahui: tata.tampilkan_mengetahui,
  })
  const [terpilih, setTerpilih] = useState<number[]>(() =>
    daftarPenandatangan.filter((p) => p.is_default).slice(0, 2).map((p) => p.id),
  )
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [pratinjauUrl, setPratinjauUrl] = useState<string | null>(null)

  useEffect(() => {
    setNilai({
      kota_penetapan: tata.kota_penetapan ?? '',
      mode_tanggal: tata.mode_tanggal,
      tanggal_manual: tata.tanggal_manual ?? '',
      posisi: tata.posisi,
      tampilkan_mengetahui: tata.tampilkan_mengetahui,
    })
  }, [tata])

  // Object URL pratinjau dibebaskan saat diganti maupun saat halaman ditutup.
  useEffect(() => {
    return () => {
      if (pratinjauUrl) URL.revokeObjectURL(pratinjauUrl)
    }
  }, [pratinjauUrl])

  const simpan = useMutation({
    mutationFn: () =>
      put('/pengaturan/ttd', {
        kota_penetapan: nilai.kota_penetapan || null,
        mode_tanggal: nilai.mode_tanggal,
        tanggal_manual: nilai.mode_tanggal === 'manual' ? nilai.tanggal_manual || null : null,
        posisi: nilai.posisi,
        tampilkan_mengetahui: nilai.tampilkan_mengetahui,
      }),
    onSuccess: () => {
      toast.sukses('Tata letak tanda tangan berhasil disimpan.')
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'ttd'] })
      void qc.invalidateQueries({ queryKey: ['laporan', 'pengaturan-dokumen'] })
    },
    onError: (e) => {
      setGalat(pesanPerBidang(e))
      toast.gagal(pesanError(e))
    },
  })

  const pratinjau = useMutation({
    mutationFn: async () => {
      const respons = await api.post<Blob>(
        '/pengaturan/kop/pratinjau',
        {
          kota_penetapan: nilai.kota_penetapan || null,
          mode_tanggal: nilai.mode_tanggal,
          tanggal_manual: nilai.mode_tanggal === 'manual' ? nilai.tanggal_manual || null : null,
          posisi: nilai.posisi,
          tampilkan_mengetahui: nilai.tampilkan_mengetahui,
          penandatangan_ids: terpilih,
        },
        { responseType: 'blob' },
      )

      return URL.createObjectURL(respons.data)
    },
    onSuccess: (url) => {
      setPratinjauUrl(url)
      toast.tampilkan('Pratinjau diperbarui.', 'info')
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-base font-bold text-strong">Tata Letak Tanda Tangan (FR-KOP-04)</h2>
          <p className="mt-1 text-xs text-muted">
            Kota & tanggal penetapan, posisi blok, dan opsi "Mengetahui".
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <BidangTeks
            label="Kota Penetapan"
            id="kota_penetapan"
            nilai={nilai.kota_penetapan}
            pesanError={galat.kota_penetapan}
            placeholder="Blitar"
            onUbah={(v) => setNilai((n) => ({ ...n, kota_penetapan: v }))}
          />
          <BidangPilihan
            label="Mode Tanggal"
            id="mode_tanggal"
            nilai={nilai.mode_tanggal}
            opsi={OPSI_MODE_TANGGAL}
            onUbah={(v) => setNilai((n) => ({ ...n, mode_tanggal: v as TataLetakTtd['mode_tanggal'] }))}
          />
          {nilai.mode_tanggal === 'manual' && (
            <BidangTeks
              label="Tanggal Manual"
              id="tanggal_manual"
              tipe="date"
              wajib
              nilai={nilai.tanggal_manual}
              pesanError={galat.tanggal_manual}
              petunjuk="Dipakai pada dokumen, bukan dihitung dari tanggal cetak."
              onUbah={(v) => setNilai((n) => ({ ...n, tanggal_manual: v }))}
            />
          )}
          <BidangPilihan
            label="Posisi Blok"
            id="posisi"
            nilai={nilai.posisi}
            opsi={OPSI_POSISI}
            onUbah={(v) => setNilai((n) => ({ ...n, posisi: v as TataLetakTtd['posisi'] }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-strong">
          <input
            type="checkbox"
            checked={nilai.tampilkan_mengetahui}
            onChange={(e) => setNilai((n) => ({ ...n, tampilkan_mengetahui: e.target.checked }))}
          />
          Tampilkan "Mengetahui" (mis. Kepala Sekolah)
        </label>

        <div className="border-t border-line pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Penandatangan pada pratinjau (maks. 2)
          </p>
          {daftarPenandatangan.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              Belum ada penandatangan. Tambahkan dulu pada tab Penandatangan.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              {daftarPenandatangan.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-strong">
                  <input
                    type="checkbox"
                    checked={terpilih.includes(p.id)}
                    onChange={(e) =>
                      setTerpilih((ids) =>
                        e.target.checked ? [...ids, p.id].slice(0, 2) : ids.filter((i) => i !== p.id),
                      )
                    }
                  />
                  {p.jabatan}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            varian="secondary"
            memuat={pratinjau.isPending}
            onClick={() => pratinjau.mutate()}
          >
            <Eye size={17} /> Pratinjau
          </Button>
          <Button memuat={simpan.isPending} onClick={() => simpan.mutate()}>
            <Save size={17} /> Simpan Tata Letak
          </Button>
        </div>
      </section>

      <PratinjauDokumen url={pratinjauUrl} sedangMemuat={pratinjau.isPending} />
    </div>
  )
}

function PratinjauDokumen({ url, sedangMemuat }: { url: string | null; sedangMemuat: boolean }) {
  return (
    <section className="card space-y-3 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-strong">
          <Eye size={18} /> Pratinjau Kop & Tanda Tangan (FR-KOP-05)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Pratinjau memakai nilai yang sedang Anda isi, jadi dapat dilihat sebelum disimpan.
        </p>
      </div>

      {url ? (
        <iframe
          src={url}
          title="Pratinjau dokumen"
          className="h-[540px] w-full rounded-control border border-line bg-app-soft"
        />
      ) : (
        <div className="rounded-control border border-dashed border-line p-8 text-center text-sm text-muted">
          {sedangMemuat ? 'Menyiapkan pratinjau…' : 'Tekan "Pratinjau" untuk melihat hasilnya.'}
        </div>
      )}
    </section>
  )
}
