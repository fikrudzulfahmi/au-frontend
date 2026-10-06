import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import type { KolomTabel } from '@/components/ui/DataTable'
import { kelasInput, FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusVarian } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { del, get, post, put } from '@/lib/api'
import type { DaftarResponse } from '@/lib/api'
import { bersihkanParams, pesanPerBidang } from '@/lib/crud'
import { formatTanggalDari, tanggalLokal } from '@/lib/format'
import type { StatusTayang } from './logika'
import { LABEL_STATUS_TAYANG, statusTayang } from './logika'

interface Pengumuman {
  id: number
  judul: string
  isi: string | null
  isi_panjang: string | null
  tipe: string
  prioritas: string
  tanggal_mulai: string
  tanggal_selesai: string | null
  jam_mulai: string | null
  jam_selesai: string | null
  tampil_app: boolean
  tampil_tv: boolean
  tampil_landing: boolean
  is_active: boolean
}

interface FormPengumuman {
  judul: string
  isi: string
  isi_panjang: string
  tipe: string
  prioritas: string
  tanggal_mulai: string
  tanggal_selesai: string
  jam_mulai: string
  jam_selesai: string
  tampil_app: boolean
  tampil_tv: boolean
  tampil_landing: boolean
  is_active: boolean
}

const PER_HALAMAN = 15

const OPSI_TIPE = [
  { nilai: 'pengumuman', label: 'Pengumuman' },
  { nilai: 'pengingat', label: 'Pengingat' },
  { nilai: 'teks_berjalan', label: 'Teks Berjalan (TV)' },
]

const OPSI_PRIORITAS = [
  { nilai: 'normal', label: 'Normal' },
  { nilai: 'penting', label: 'Penting' },
]

const VARIAN_STATUS: Record<StatusTayang, StatusVarian> = {
  tayang: 'sukses',
  belum_mulai: 'menunggu',
  kedaluwarsa: 'bahaya',
  nonaktif: 'netral',
  target_tidak_sesuai: 'netral',
}

function formKosong(): FormPengumuman {
  return {
    judul: '',
    isi: '',
    isi_panjang: '',
    tipe: 'pengumuman',
    prioritas: 'normal',
    tanggal_mulai: tanggalLokal(new Date()),
    tanggal_selesai: '',
    jam_mulai: '',
    jam_selesai: '',
    tampil_app: true,
    tampil_tv: true,
    tampil_landing: false,
    is_active: true,
  }
}

function formDari(p: Pengumuman): FormPengumuman {
  return {
    judul: p.judul,
    isi: p.isi ?? '',
    isi_panjang: p.isi_panjang ?? '',
    tipe: p.tipe,
    prioritas: p.prioritas,
    tanggal_mulai: p.tanggal_mulai,
    tanggal_selesai: p.tanggal_selesai ?? '',
    jam_mulai: p.jam_mulai ?? '',
    jam_selesai: p.jam_selesai ?? '',
    tampil_app: p.tampil_app,
    tampil_tv: p.tampil_tv,
    tampil_landing: p.tampil_landing,
    is_active: p.is_active,
  }
}

/** FR-PMN-01/03 — kelola pengumuman bertanggal tayang (BR-36). */
export function KelolaPengumumanPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const [halaman, setHalaman] = useState(1)
  const [cari, setCari] = useState('')
  const [filterTarget, setFilterTarget] = useState('')
  const [filterAktif, setFilterAktif] = useState('')
  const [form, setForm] = useState<FormPengumuman | null>(null)
  const [idUbah, setIdUbah] = useState<number | null>(null)
  const [galatBidang, setGalatBidang] = useState<Record<string, string>>({})
  const [hapus, setHapus] = useState<Pengumuman | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pengumuman', halaman, filterTarget, filterAktif],
    queryFn: () =>
      get<DaftarResponse<Pengumuman>>(
        '/pengumuman',
        bersihkanParams({
          page: halaman,
          per_halaman: PER_HALAMAN,
          target: filterTarget,
          aktif: filterAktif,
        }),
      ),
  })

  const simpan = useMutation({
    mutationFn: (isi: FormPengumuman) => {
      const payload = {
        judul: isi.judul,
        isi: isi.isi === '' ? null : isi.isi,
        isi_panjang: isi.isi_panjang === '' ? null : isi.isi_panjang,
        tipe: isi.tipe,
        prioritas: isi.prioritas,
        tanggal_mulai: isi.tanggal_mulai,
        tanggal_selesai: isi.tanggal_selesai === '' ? null : isi.tanggal_selesai,
        jam_mulai: isi.jam_mulai === '' ? null : isi.jam_mulai,
        jam_selesai: isi.jam_selesai === '' ? null : isi.jam_selesai,
        tampil_app: isi.tampil_app,
        tampil_tv: isi.tampil_tv,
        tampil_landing: isi.tampil_landing,
        is_active: isi.is_active,
      }

      return idUbah === null
        ? post<{ data: Pengumuman }>('/pengumuman', payload)
        : put<{ data: Pengumuman }>(`/pengumuman/${idUbah}`, payload)
    },
    onSuccess: () => {
      setGalatBidang({})
      setForm(null)
      setIdUbah(null)
      toast.sukses(idUbah === null ? 'Pengumuman dibuat.' : 'Pengumuman diperbarui.')
      void qc.invalidateQueries({ queryKey: ['pengumuman'] })
    },
    onError: (e) => {
      setGalatBidang(pesanPerBidang(e))
      toast.gagal('Pengumuman gagal disimpan. Periksa bidang yang ditandai.')
    },
  })

  const hapusMutasi = useMutation({
    mutationFn: (id: number) => del(`/pengumuman/${id}`),
    onSuccess: () => {
      setHapus(null)
      toast.sukses('Pengumuman dihapus.')
      void qc.invalidateQueries({ queryKey: ['pengumuman'] })
    },
    onError: () => toast.gagal('Pengumuman gagal dihapus.'),
  })

  const sekarang = new Date()
  const tersaring = useMemo(() => {
    const daftar = data?.data ?? []
    const kunci = cari.trim().toLowerCase()
    if (kunci === '') return daftar
    return daftar.filter(
      (p) =>
        p.judul.toLowerCase().includes(kunci) || (p.isi ?? '').toLowerCase().includes(kunci),
    )
  }, [data, cari])

  const kolom: KolomTabel<Pengumuman>[] = [
    {
      kunci: 'judul',
      judul: 'Pengumuman',
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-strong">{p.judul}</p>
          <p className="truncate text-xs text-muted">{p.isi ?? '—'}</p>
        </div>
      ),
    },
    {
      kunci: 'tipe',
      judul: 'Tipe',
      render: (p) => <span className="text-muted">{labelTipe(p.tipe)}</span>,
      sembunyiMobile: true,
    },
    {
      kunci: 'rentang',
      judul: 'Rentang Tayang',
      render: (p) => (
        <span className="tnum text-muted">
          {formatTanggalDari(p.tanggal_mulai)}
          {p.tanggal_selesai ? ` s.d. ${formatTanggalDari(p.tanggal_selesai)}` : ' —'}
          {p.jam_mulai ? ` · ${p.jam_mulai}${p.jam_selesai ? `–${p.jam_selesai}` : ''}` : ''}
        </span>
      ),
    },
    {
      kunci: 'target',
      judul: 'Target',
      render: (p) => (
        <span className="flex flex-wrap gap-1">
          {p.tampil_app && <StatusBadge varian="netral">App</StatusBadge>}
          {p.tampil_tv && <StatusBadge varian="netral">TV</StatusBadge>}
          {p.tampil_landing && <StatusBadge varian="netral">Landing</StatusBadge>}
        </span>
      ),
      sembunyiMobile: true,
    },
    {
      kunci: 'status',
      judul: 'Status',
      render: (p) => {
        // BR-36 — memoan status per target utama (TV) agar admin tahu yang kedaluwarsa.
        const status = statusTayang(p, sekarang, 'tv')
        return <StatusBadge varian={VARIAN_STATUS[status]}>{LABEL_STATUS_TAYANG[status]}</StatusBadge>
      },
    },
    {
      kunci: 'aksi',
      judul: 'Aksi',
      render: (p) => (
        <div className="flex gap-2">
          <Button
            varian="secondary"
            ukuran="sm"
            onClick={() => {
              setIdUbah(p.id)
              setGalatBidang({})
              setForm(formDari(p))
            }}
          >
            <Pencil size={14} /> Ubah
          </Button>
          <Button varian="danger" ukuran="sm" onClick={() => setHapus(p)}>
            <Trash2 size={14} /> Hapus
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Kelola Pengumuman"
        keterangan="Pengumuman tayang bila aktif dan berada dalam rentang tanggal/jam (BR-36)."
        aksi={
          <Button
            onClick={() => {
              setIdUbah(null)
              setGalatBidang({})
              setForm(formKosong())
            }}
          >
            <Plus size={16} /> Pengumuman Baru
          </Button>
        }
      />

      <Toolbar cari={cari} onCari={setCari} placeholderCari="Cari judul atau isi…">
        <BidangPilihan
          label=""
          id="filter-target"
          nilai={filterTarget}
          onUbah={(v) => {
            setFilterTarget(v)
            setHalaman(1)
          }}
          opsi={[
            { nilai: 'app', label: 'Target: Aplikasi' },
            { nilai: 'tv', label: 'Target: TV' },
            { nilai: 'landing', label: 'Target: Landing' },
          ]}
          kosongLabel="Semua target"
          className="!space-y-0"
        />
        <BidangPilihan
          label=""
          id="filter-aktif"
          nilai={filterAktif}
          onUbah={(v) => {
            setFilterAktif(v)
            setHalaman(1)
          }}
          opsi={[
            { nilai: '1', label: 'Hanya aktif' },
            { nilai: '0', label: 'Hanya nonaktif' },
          ]}
          kosongLabel="Semua status"
          className="!space-y-0"
        />
      </Toolbar>

      {isError && (
        <p className="card p-6 text-sm text-danger">
          Daftar pengumuman gagal dimuat. Periksa koneksi lalu muat ulang.
        </p>
      )}

      <DataTable
        kolom={kolom}
        data={tersaring}
        kunciBaris={(p) => p.id}
        kosong={isLoading ? 'Memuat pengumuman…' : 'Belum ada pengumuman.'}
      />

      <Pagination
        halaman={halaman}
        perHalaman={data?.meta.per_page ?? PER_HALAMAN}
        total={data?.meta.total ?? 0}
        onUbah={setHalaman}
      />

      <Modal
        terbuka={form !== null}
        judul={idUbah === null ? 'Pengumuman Baru' : 'Ubah Pengumuman'}
        keterangan="Tentukan isi, rentang tayang, dan target tampil."
        lebar="lg"
        onTutup={() => setForm(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button varian="ghost" onClick={() => setForm(null)}>
              Batal
            </Button>
            <Button memuat={simpan.isPending} onClick={() => form && simpan.mutate(form)}>
              Simpan
            </Button>
          </div>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <BidangTeks
              label="Judul"
              id="pmn-judul"
              nilai={form.judul}
              onUbah={(v) => setForm({ ...form, judul: v })}
              wajib
              pesanError={galatBidang.judul}
              className="sm:col-span-2"
            />

            <FormField
              label="Isi Ringkas (maks. 280 karakter)"
              htmlFor="pmn-isi"
              pesanError={galatBidang.isi}
              className="sm:col-span-2"
            >
              <textarea
                id="pmn-isi"
                value={form.isi}
                onChange={(e) => setForm({ ...form, isi: e.target.value })}
                maxLength={280}
                rows={3}
                className={kelasInput}
              />
            </FormField>

            <FormField
              label="Isi Panjang (opsional)"
              htmlFor="pmn-isi-panjang"
              className="sm:col-span-2"
            >
              <textarea
                id="pmn-isi-panjang"
                value={form.isi_panjang}
                onChange={(e) => setForm({ ...form, isi_panjang: e.target.value })}
                rows={4}
                className={kelasInput}
              />
            </FormField>

            <BidangPilihan
              label="Tipe"
              id="pmn-tipe"
              nilai={form.tipe}
              onUbah={(v) => setForm({ ...form, tipe: v })}
              opsi={OPSI_TIPE}
              wajib
              pesanError={galatBidang.tipe}
            />

            <BidangPilihan
              label="Prioritas"
              id="pmn-prioritas"
              nilai={form.prioritas}
              onUbah={(v) => setForm({ ...form, prioritas: v })}
              opsi={OPSI_PRIORITAS}
              wajib
              pesanError={galatBidang.prioritas}
            />

            <BidangTeks
              label="Tanggal Mulai"
              id="pmn-mulai"
              tipe="date"
              nilai={form.tanggal_mulai}
              onUbah={(v) => setForm({ ...form, tanggal_mulai: v })}
              wajib
              pesanError={galatBidang.tanggal_mulai}
            />

            <BidangTeks
              label="Tanggal Selesai (opsional)"
              id="pmn-selesai"
              tipe="date"
              nilai={form.tanggal_selesai}
              onUbah={(v) => setForm({ ...form, tanggal_selesai: v })}
              petunjuk="Kosongkan bila tidak ada batas akhir."
              pesanError={galatBidang.tanggal_selesai}
            />

            <BidangTeks
              label="Jam Mulai (opsional)"
              id="pmn-jam-mulai"
              tipe="time"
              nilai={form.jam_mulai}
              onUbah={(v) => setForm({ ...form, jam_mulai: v })}
              pesanError={galatBidang.jam_mulai}
            />

            <BidangTeks
              label="Jam Selesai (opsional)"
              id="pmn-jam-selesai"
              tipe="time"
              nilai={form.jam_selesai}
              onUbah={(v) => setForm({ ...form, jam_selesai: v })}
              pesanError={galatBidang.jam_selesai}
            />

            <BidangPilihan
              label="Tampil di Aplikasi"
              id="pmn-app"
              nilai={form.tampil_app ? 'ya' : 'tidak'}
              onUbah={(v) => setForm({ ...form, tampil_app: v === 'ya' })}
              opsi={OPSI_YA_TIDAK}
            />

            <BidangPilihan
              label="Tampil di Layar TV"
              id="pmn-tv"
              nilai={form.tampil_tv ? 'ya' : 'tidak'}
              onUbah={(v) => setForm({ ...form, tampil_tv: v === 'ya' })}
              opsi={OPSI_YA_TIDAK}
            />

            <BidangPilihan
              label="Tampil di Landing Page"
              id="pmn-landing"
              nilai={form.tampil_landing ? 'ya' : 'tidak'}
              onUbah={(v) => setForm({ ...form, tampil_landing: v === 'ya' })}
              opsi={OPSI_YA_TIDAK}
            />

            <BidangPilihan
              label="Status Aktif"
              id="pmn-aktif"
              nilai={form.is_active ? 'ya' : 'tidak'}
              onUbah={(v) => setForm({ ...form, is_active: v === 'ya' })}
              opsi={OPSI_YA_TIDAK}
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        terbuka={hapus !== null}
        judul="Hapus pengumuman?"
        keterangan={`Pengumuman "${hapus?.judul ?? ''}" akan dihapus permanen. Bila hanya ingin berhenti tayang, ubah status menjadi nonaktif atau atur tanggal selesai.`}
        labelKonfirmasi="Hapus"
        memuat={hapusMutasi.isPending}
        onKonfirmasi={() => hapus && hapusMutasi.mutate(hapus.id)}
        onTutup={() => setHapus(null)}
      />
    </div>
  )
}

const OPSI_YA_TIDAK = [
  { nilai: 'ya', label: 'Ya' },
  { nilai: 'tidak', label: 'Tidak' },
]

function labelTipe(tipe: string): string {
  return OPSI_TIPE.find((t) => t.nilai === tipe)?.label ?? tipe
}
