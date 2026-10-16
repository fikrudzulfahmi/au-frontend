import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, TriangleAlert, UserCheck } from 'lucide-react'

import { BidangPilihan, BidangTeks } from '@/components/ui/Bidang'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError } from '@/lib/api'
import { bersihkanParams, master, pesanPerBidang } from '@/lib/crud'
import { NAMA_HARI, OPSI_HARI } from './types'
import type { GuruPilihan, PenugasanPiket, PenugasanPiketMeta } from './types'
import { useSemester } from './useSemester'

/** Hari yang lazim ada kegiatan belajar; Minggu tidak diwajibkan punya piket. */
const HARI_SEKOLAH = [1, 2, 3, 4, 5, 6]

const KOSONG = { pegawai_id: '', hari: '', catatan: '', is_active: '1' }

/**
 * Menu admin — penugasan guru piket: siapa piket pada hari apa.
 *
 * Penetapan ini menentukan siapa yang boleh mengisi jurnal kelas lain pada hari
 * tugasnya (menggantikan pengampu yang berhalangan), karena itu halaman ini
 * hanya untuk admin dan wajib menampilkan hari yang masih kosong — hari tanpa
 * petugas berarti jurnal kelas yang gurunya berhalangan tidak akan terisi.
 */
export function PenugasanPiketPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { semesterAktif, semuaSemester, memuat } = useSemester()

  const [semesterId, setSemesterId] = useState('')
  const [hari, setHari] = useState('')
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({
    terbuka: false,
    nilai: KOSONG,
  })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<PenugasanPiket | null>(null)

  // Semester aktif dari server dipakai sampai admin memilih semester lain.
  const semesterTerpilih = semesterId || (semesterAktif ? String(semesterAktif.id) : '')

  const daftar = useQuery({
    queryKey: ['penugasan-piket', { semesterTerpilih, hari }],
    enabled: semesterTerpilih !== '',
    queryFn: () =>
      get<{ data: PenugasanPiket[]; meta: PenugasanPiketMeta }>(
        '/penugasan-piket',
        bersihkanParams({ semester_id: semesterTerpilih, hari }),
      ),
  })

  const guru = useQuery({
    queryKey: ['penugasan-piket', 'pegawai'],
    queryFn: () => get<{ data: GuruPilihan[] }>('/penugasan-piket/pegawai'),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const body = {
        semester_id: Number(semesterTerpilih),
        pegawai_id: Number(v.nilai.pegawai_id),
        hari: Number(v.nilai.hari),
        catatan: v.nilai.catatan.trim() === '' ? null : v.nilai.catatan.trim(),
        is_active: v.nilai.is_active === '1',
      }

      return v.id
        ? master.ubah<PenugasanPiket>('/penugasan-piket', v.id, body)
        : master.buat<PenugasanPiket>('/penugasan-piket', body)
    },
    onSuccess: () => {
      toast.sukses('Penugasan piket disimpan.')
      setForm({ terbuka: false, nilai: KOSONG })
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['penugasan-piket'] })
    },
    onError: (e) => {
      setGalat(pesanPerBidang(e))
      toast.gagal(pesanError(e))
    },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/penugasan-piket', id),
    onSuccess: () => {
      toast.sukses('Penugasan piket dihapus.')
      setDihapus(null)
      void qc.invalidateQueries({ queryKey: ['penugasan-piket'] })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data?.data ?? []
  const opsiSemester = semuaSemester.map((s) => ({ nilai: s.id, label: s.label }))
  const opsiGuru = (guru.data?.data ?? []).map((g) => ({ nilai: g.id, label: `${g.nama} — ${g.nip}` }))

  // Rekap per hari: hari tanpa petugas harus terlihat, bukan hanya absen dari tabel.
  const perHari = new Map<number, PenugasanPiket[]>()
  HARI_SEKOLAH.forEach((h) => perHari.set(h, []))
  data.filter((p) => p.is_active).forEach((p) => perHari.set(p.hari, [...(perHari.get(p.hari) ?? []), p]))
  const hariKosong = HARI_SEKOLAH.filter((h) => (perHari.get(h) ?? []).length === 0)

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Penugasan Guru Piket"
        keterangan="Tetapkan siapa yang bertugas piket pada tiap hari dalam semester ini. Guru piket berhak mengisi jurnal kelas lain pada hari tugasnya, menggantikan pengampu yang berhalangan."
        aksi={
          <Button
            onClick={() => {
              setGalat({})
              setForm({ terbuka: true, nilai: KOSONG })
            }}
          >
            <Plus size={17} /> Tambah Penugasan
          </Button>
        }
      />

      <Toolbar>
        <select
          aria-label="Filter semester"
          value={semesterTerpilih}
          onChange={(e) => setSemesterId(e.target.value)}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong"
        >
          {opsiSemester.length === 0 && <option value="">Memuat semester…</option>}
          {opsiSemester.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter hari"
          value={hari}
          onChange={(e) => setHari(e.target.value)}
          className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong"
        >
          <option value="">Semua hari</option>
          {OPSI_HARI.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
      </Toolbar>

      {hariKosong.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-warn-bg px-3 py-2">
          <TriangleAlert size={16} className="shrink-0 text-warn-text" aria-hidden />
          <span className="text-sm font-semibold text-warn-text">Belum ada petugas piket pada:</span>
          <span className="text-sm text-strong">
            {hariKosong.map((h) => NAMA_HARI[h - 1]).join(', ')}
          </span>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {HARI_SEKOLAH.map((h) => {
          const petugas = perHari.get(h) ?? []
          return (
            <div key={h} className="card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-strong">{NAMA_HARI[h - 1]}</span>
                <span className="text-xs text-muted">
                  {petugas.length > 0 ? `${petugas.length} guru` : '—'}
                </span>
              </div>
              {petugas.length === 0 ? (
                <p className="mt-1 text-xs text-warn-text">Belum ada petugas piket</p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {petugas.map((p) => (
                    <li key={p.id} className="text-xs text-strong">
                      {p.nama ?? `Pegawai #${p.pegawai_id}`}
                      {p.catatan ? <span className="text-muted"> — {p.catatan}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {data.length === 0 && !daftar.isLoading ? (
        <div className="card overflow-hidden">
          <EmptyState
            judul="Belum ada penugasan piket"
            keterangan="Tambahkan guru piket untuk tiap hari agar jurnal kelas yang gurunya berhalangan tetap terisi."
          />
        </div>
      ) : (
        <DataTable
          data={data}
          kunciBaris={(p) => p.id}
          kosong={memuat ? 'Memuat…' : 'Belum ada penugasan pada semester ini.'}
          kolom={[
            { kunci: 'hari', judul: 'Hari', render: (p) => <span className="font-bold">{p.nama_hari}</span> },
            {
              kunci: 'guru',
              judul: 'Guru Piket',
              render: (p) => (
                <span className="flex items-center gap-2">
                  <UserCheck size={15} className="text-muted" aria-hidden />
                  {p.nama ?? '—'}
                </span>
              ),
            },
            { kunci: 'nip', judul: 'NIP', sembunyiMobile: true, render: (p) => <span className="tnum">{p.nip ?? '—'}</span> },
            {
              kunci: 'catatan',
              judul: 'Catatan',
              sembunyiMobile: true,
              render: (p) => p.catatan ?? <span className="text-muted">—</span>,
            },
            {
              kunci: 'status',
              judul: 'Status',
              render: (p) => (
                <StatusBadge varian={p.is_active ? 'hadir' : 'cuti'}>
                  {p.is_active ? 'Aktif' : 'Nonaktif'}
                </StatusBadge>
              ),
            },
            {
              kunci: 'aksi',
              judul: 'Aksi',
              className: 'w-24',
              render: (p: PenugasanPiket) => (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Ubah penugasan ${p.nama ?? ''} hari ${p.nama_hari}`}
                    onClick={() => {
                      setGalat({})
                      setForm({
                        terbuka: true,
                        id: p.id,
                        nilai: {
                          pegawai_id: String(p.pegawai_id),
                          hari: String(p.hari),
                          catatan: p.catatan ?? '',
                          is_active: p.is_active ? '1' : '0',
                        },
                      })
                    }}
                    className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus penugasan ${p.nama ?? ''} hari ${p.nama_hari}`}
                    onClick={() => setDihapus(p)}
                    className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        terbuka={form.terbuka}
        judul={form.id ? 'Ubah Penugasan Piket' : 'Tambah Penugasan Piket'}
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>
              Batal
            </Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <BidangPilihan
            label="Hari"
            id="hari"
            wajib
            nilai={form.nilai.hari}
            opsi={OPSI_HARI.map((o) => ({ nilai: o.nilai, label: o.label }))}
            pesanError={galat.hari}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, hari: v } }))}
          />
          <BidangPilihan
            label="Guru Piket"
            id="pegawai_id"
            wajib
            nilai={form.nilai.pegawai_id}
            opsi={opsiGuru}
            petunjuk="Hanya guru aktif yang dapat ditugaskan. Satu guru tidak boleh ditugaskan dua kali pada hari yang sama."
            pesanError={galat.pegawai_id}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, pegawai_id: v } }))}
          />
          <BidangTeks
            label="Catatan"
            id="catatan"
            nilai={form.nilai.catatan}
            pesanError={galat.catatan}
            petunjuk="Opsional, mis. ruang piket atau tugas tambahan."
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, catatan: v } }))}
          />
          <BidangPilihan
            label="Status"
            id="is_active"
            nilai={form.nilai.is_active}
            opsi={[
              { nilai: '1', label: 'Aktif' },
              { nilai: '0', label: 'Nonaktif' },
            ]}
            kosongLabel="Aktif"
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, is_active: v === '' ? '1' : v } }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        terbuka={dihapus !== null}
        judul="Hapus penugasan piket?"
        keterangan={
          dihapus
            ? `Penugasan ${dihapus.nama ?? ''} pada hari ${dihapus.nama_hari} akan dihapus. Guru tersebut tidak lagi berhak mengisi jurnal kelas lain pada hari itu.`
            : ''
        }
        labelKonfirmasi="Hapus"
        memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)}
        onTutup={() => setDihapus(null)}
      />
    </div>
  )
}
