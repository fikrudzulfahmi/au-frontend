import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { Toolbar } from '@/components/ui/Toolbar'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { pesanError } from '@/lib/api'
import { master, pesanPerBidang } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import type { Jurusan } from './types'

const KOSONG = { kode: '', nama: '' }

/** FR-KLS-01 — master jurusan / kompetensi keahlian. */
export function JurusanPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const qc = useQueryClient()
  const toast = useToast()

  const [cari, setCari] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [form, setForm] = useState<{ terbuka: boolean; id?: number; nilai: typeof KOSONG }>({
    terbuka: false,
    nilai: KOSONG,
  })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [dihapus, setDihapus] = useState<Jurusan | null>(null)

  const daftar = useQuery({
    queryKey: ['jurusan', { cari, halaman }],
    queryFn: () => master.daftar<Jurusan>('/jurusan', { cari, page: halaman }),
  })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) =>
      v.id ? master.ubah<Jurusan>('/jurusan', v.id, v.nilai) : master.buat<Jurusan>('/jurusan', v.nilai),
    onSuccess: () => {
      toast.sukses('Jurusan disimpan.')
      setForm({ terbuka: false, nilai: KOSONG })
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['jurusan'] })
    },
    onError: (e) => {
      setGalat(pesanPerBidang(e))
      toast.gagal(pesanError(e))
    },
  })

  const hapus = useMutation({
    mutationFn: (id: number) => master.hapus('/jurusan', id),
    onSuccess: () => {
      toast.sukses('Jurusan dihapus.')
      setDihapus(null)
      void qc.invalidateQueries({ queryKey: ['jurusan'] })
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Jurusan"
        keterangan="Kompetensi keahlian pada sekolah."
        aksi={
          bolehKelola && (
            <Button onClick={() => setForm({ terbuka: true, nilai: KOSONG })}>
              <Plus size={17} /> Tambah Jurusan
            </Button>
          )
        }
      />

      <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari kode atau nama jurusan…" />

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(j) => j.id}
        kosong="Belum ada jurusan. Tambahkan kompetensi keahlian terlebih dahulu."
        kolom={[
          { kunci: 'kode', judul: 'Kode', render: (j) => <span className="font-bold">{j.kode}</span> },
          { kunci: 'nama', judul: 'Nama Jurusan', render: (j) => j.nama },
          ...(bolehKelola
            ? [
                {
                  kunci: 'aksi',
                  judul: 'Aksi',
                  className: 'w-24',
                  render: (j: Jurusan) => (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Ubah ${j.nama}`}
                        onClick={() => { setGalat({}); setForm({ terbuka: true, id: j.id, nilai: { kode: j.kode, nama: j.nama } }) }}
                        className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus ${j.nama}`}
                        onClick={() => setDihapus(j)}
                        className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />

      <Pagination
        halaman={data?.meta.page ?? 1}
        perHalaman={data?.meta.per_page ?? 20}
        total={data?.meta.total ?? 0}
        onUbah={setHalaman}
      />

      <Modal
        terbuka={form.terbuka}
        judul={form.id ? 'Ubah Jurusan' : 'Tambah Jurusan'}
        onTutup={() => setForm({ terbuka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ terbuka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <BidangTeks label="Kode" id="kode" wajib nilai={form.nilai.kode} pesanError={galat.kode}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, kode: v.toUpperCase() } }))} />
          <BidangTeks label="Nama Jurusan" id="nama" wajib nilai={form.nilai.nama} pesanError={galat.nama}
            onUbah={(v) => setForm((f) => ({ ...f, nilai: { ...f.nilai, nama: v } }))} />
        </div>
      </Modal>

      <ConfirmDialog
        terbuka={dihapus !== null}
        judul="Hapus jurusan?"
        keterangan={dihapus ? `Jurusan "${dihapus.nama}" akan dihapus. Jurusan yang masih dipakai kelas tidak dapat dihapus.` : ''}
        labelKonfirmasi="Hapus"
        memuat={hapus.isPending}
        onKonfirmasi={() => dihapus && hapus.mutate(dihapus.id)}
        onTutup={() => setDihapus(null)}
      />
    </div>
  )
}
