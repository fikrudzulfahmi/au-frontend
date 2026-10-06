import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError, put } from '@/lib/api'
import { aksi, master } from '@/lib/crud'
import { LABEL_PERAN, type KodePeran } from '@/lib/roles'
import type { PenggunaAdmin } from '@/features/master/types'

interface Peran {
  id: number
  kode: string
  nama: string
}

/** 5.16 / Bagian 2 — akun dan peran (A-11: satu akun boleh berperan ganda). */
export function PenggunaPage() {
  const qc = useQueryClient()
  const toast = useToast()

  const [cari, setCari] = useState('')
  const [halaman, setHalaman] = useState(1)
  const [ubah, setUbah] = useState<{ pengguna: PenggunaAdmin; peran: string[]; is_active: boolean } | null>(null)

  const daftar = useQuery({
    queryKey: ['pengguna', { cari, halaman }],
    queryFn: () => master.daftar<PenggunaAdmin>('/pengaturan/pengguna', { cari, page: halaman }),
  })

  const daftarPeran = useQuery({
    queryKey: ['pengguna', 'peran'],
    queryFn: () => get<{ data: Peran[] }>('/pengaturan/pengguna/peran'),
  })

  const simpan = useMutation({
    mutationFn: (v: { pengguna: PenggunaAdmin; peran: string[]; is_active: boolean }) =>
      put(`/pengaturan/pengguna/${v.pengguna.id}`, { peran: v.peran, is_active: v.is_active }),
    onSuccess: () => { toast.sukses('Akun diperbarui.'); setUbah(null); void qc.invalidateQueries({ queryKey: ['pengguna'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const resetPerangkat = useMutation({
    mutationFn: (id: number) => aksi(`/pengaturan/pengguna/${id}/reset-perangkat`),
    onSuccess: () => { toast.sukses('Perangkat terdaftar dikosongkan.'); void qc.invalidateQueries({ queryKey: ['pengguna'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = daftar.data
  const opsiPeran = daftarPeran.data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengguna & Peran"
        keterangan="Akun pegawai dibuat lewat menu Guru & Pegawai; di sini peran dan statusnya diatur."
      />

      <Toolbar cari={cari} onCari={(v) => { setCari(v); setHalaman(1) }} placeholderCari="Cari username atau nama…" />

      <DataTable
        data={data?.data ?? []}
        kunciBaris={(p) => p.id}
        kosong="Belum ada akun."
        kolom={[
          { kunci: 'username', judul: 'Username', render: (p) => <span className="font-bold">{p.username}</span> },
          { kunci: 'nama', judul: 'Nama', render: (p) => p.nama },
          {
            kunci: 'peran', judul: 'Peran',
            render: (p) => (
              <div className="flex flex-wrap gap-1">
                {p.peran.map((k) => (
                  <StatusBadge key={k} varian="izin">{LABEL_PERAN[k as KodePeran] ?? k}</StatusBadge>
                ))}
              </div>
            ),
          },
          {
            kunci: 'status', judul: 'Status',
            render: (p) => (
              <div className="flex flex-wrap gap-1">
                <StatusBadge varian={p.wajib_ganti_password ? 'menunggu' : 'hadir'}>
                  {p.wajib_ganti_password ? 'Wajib ganti password' : 'Aktif'}
                </StatusBadge>
              </div>
            ),
          },
          {
            kunci: 'aksi', judul: 'Aksi', className: 'w-24',
            render: (p: PenggunaAdmin) => (
              <div className="flex items-center gap-1">
                <button type="button" aria-label={`Ubah peran ${p.username}`}
                  onClick={() => setUbah({ pengguna: p, peran: p.peran, is_active: true })}
                  className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                  <Pencil size={16} />
                </button>
                <button type="button" title="Reset perangkat" aria-label={`Reset perangkat ${p.username}`}
                  onClick={() => resetPerangkat.mutate(p.id)}
                  className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                  <Smartphone size={16} />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Pagination halaman={data?.meta.page ?? 1} perHalaman={data?.meta.per_page ?? 20} total={data?.meta.total ?? 0} onUbah={setHalaman} />

      <Modal terbuka={ubah !== null} lebar="sm" judul="Ubah Peran Akun"
        keterangan={ubah ? `${ubah.pengguna.nama} (@${ubah.pengguna.username})` : ''}
        onTutup={() => setUbah(null)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setUbah(null)}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => ubah && simpan.mutate(ubah)}>Simpan</Button>
          </>
        }
      >
        {ubah && (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-strong">Peran</legend>
              <div className="space-y-2">
                {opsiPeran.map((p) => (
                  <label key={p.kode} className="flex items-center gap-2 text-sm text-strong">
                    <input type="checkbox" checked={ubah.peran.includes(p.kode)}
                      onChange={(e) =>
                        setUbah((s) =>
                          s
                            ? { ...s, peran: e.target.checked ? [...s.peran, p.kode] : s.peran.filter((x) => x !== p.kode) }
                            : s,
                        )
                      } />
                    {p.nama}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm font-semibold text-strong">
              <input type="checkbox" checked={ubah.is_active}
                onChange={(e) => setUbah((s) => (s ? { ...s, is_active: e.target.checked } : s))} />
              Akun aktif
            </label>

            <p className="rounded-control bg-app-soft px-3 py-2 text-xs text-muted">
              Satu akun harus memiliki minimal satu peran.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
