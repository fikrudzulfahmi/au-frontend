import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Star, Trash2, Users } from 'lucide-react'
import { Circle, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError } from '@/lib/api'
import { aksi, master, pesanPerBidang } from '@/lib/crud'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import type { LokasiPresensi } from '@/lib/geolokasi'

const KOSONG = { nama: '', latitude: '-7.8654000', longitude: '111.4650000', radius_m: '150', is_default: false, is_active: true }

interface PegawaiLokasi {
  pegawai_id: number
  nip: string
  nama: string
  jenis_pegawai: string
  lokasi_ids: number[]
  lokasi_nama: string[]
}

/**
 * FR-LOK-01..03 — master lokasi presensi dengan pemilih titik pada peta,
 * penanda default (BR-12), dan penetapan lokasi ke pegawai secara massal.
 */
export function PengaturanLokasiPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const qc = useQueryClient()

  const [form, setForm] = useState<{ buka: boolean; id?: number; nilai: typeof KOSONG }>({ buka: false, nilai: KOSONG })
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [hapus, setHapus] = useState<LokasiPresensi | null>(null)
  const [tetapkan, setTetapkan] = useState(false)
  const [pilihPegawai, setPilihPegawai] = useState<number[]>([])
  const [pilihLokasi, setPilihLokasi] = useState<number[]>([])

  const lokasi = useQuery({
    queryKey: ['lokasi-presensi'],
    queryFn: () => get<{ data: LokasiPresensi[] }>('/pengaturan/lokasi'),
  })

  const pegawai = useQuery({
    queryKey: ['lokasi-presensi', 'pegawai'],
    queryFn: () => get<{ data: PegawaiLokasi[] }>('/pengaturan/lokasi/pegawai'),
    enabled: tetapkan,
  })

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['lokasi-presensi'] })

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG }) => {
      const isi = {
        nama: v.nilai.nama,
        latitude: Number(v.nilai.latitude),
        longitude: Number(v.nilai.longitude),
        radius_m: Number(v.nilai.radius_m),
        is_default: v.nilai.is_default,
        is_active: v.nilai.is_active,
      }
      return v.id ? master.ubah('/pengaturan/lokasi', v.id, isi) : master.buat('/pengaturan/lokasi', isi)
    },
    onSuccess: () => { toast.sukses('Lokasi disimpan.'); setForm({ buka: false, nilai: KOSONG }); setGalat({}); segarkan() },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const jadikanDefault = useMutation({
    mutationFn: (id: number) => aksi(`/pengaturan/lokasi/${id}/default`, {}),
    onSuccess: () => { toast.sukses('Lokasi default diperbarui (BR-12).'); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const hapusLokasi = useMutation({
    mutationFn: (id: number) => master.hapus('/pengaturan/lokasi', id),
    onSuccess: () => { toast.sukses('Lokasi dihapus.'); setHapus(null); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const simpanTetapkan = useMutation({
    mutationFn: () => aksi<{ message: string }>('/pengaturan/lokasi/tetapkan', {
      pegawai_ids: pilihPegawai, lokasi_ids: pilihLokasi,
    }),
    onSuccess: (hasil) => { toast.sukses(hasil.message); setTetapkan(false); setPilihPegawai([]); setPilihLokasi([]); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const daftar = lokasi.data?.data ?? []
  const pusat: [number, number] = [Number(form.nilai.latitude), Number(form.nilai.longitude)]

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Lokasi Presensi"
        keterangan="Radius sah ditegakkan server dengan rumus Haversine. Pegawai tanpa penetapan khusus memakai lokasi default (BR-12)."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary" onClick={() => { setTetapkan(true); setPilihPegawai([]); setPilihLokasi([]) }}>
                <Users size={17} /> Tetapkan ke Pegawai
              </Button>
              <Button onClick={() => { setGalat({}); setForm({ buka: true, nilai: KOSONG }) }}>
                <Plus size={17} /> Tambah Lokasi
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {daftar.map((l) => (
          <div key={l.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-strong">{l.nama}</h2>
              {l.is_default && <StatusBadge varian="hadir">Default</StatusBadge>}
            </div>

            <p className="tnum mt-1 text-xs text-muted">
              {l.latitude.toFixed(6)}, {l.longitude.toFixed(6)}
            </p>
            <p className="mt-1 text-sm text-strong">Radius <span className="tnum font-bold">{l.radius_m} m</span></p>
            {!l.is_active && <p className="mt-1 text-xs text-danger">Nonaktif</p>}

            {bolehKelola && (
              <div className="mt-3 flex items-center gap-1">
                {!l.is_default && (
                  <button type="button" onClick={() => jadikanDefault.mutate(l.id)}
                    className="flex items-center gap-1 rounded-control px-2 py-1 text-xs font-semibold text-link hover:bg-info-soft">
                    <Star size={13} /> Jadikan default
                  </button>
                )}
                <button type="button" aria-label={`Ubah ${l.nama}`}
                  onClick={() => { setGalat({}); setForm({ buka: true, id: l.id, nilai: { nama: l.nama, latitude: String(l.latitude), longitude: String(l.longitude), radius_m: String(l.radius_m), is_default: l.is_default, is_active: l.is_active ?? true } }) }}
                  className="touch-target flex items-center justify-center rounded-control text-muted hover:bg-app-soft">
                  <Pencil size={15} />
                </button>
                <button type="button" aria-label={`Hapus ${l.nama}`} onClick={() => setHapus(l)}
                  className="touch-target flex items-center justify-center rounded-control text-danger hover:bg-danger-soft">
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {daftar.length === 0 && (
        <p className="card p-5 text-sm text-muted">
          Belum ada lokasi presensi. Tambahkan minimal satu lokasi agar pegawai dapat presensi.
        </p>
      )}

      {/* ---------- Form lokasi + peta ---------- */}
      <Modal terbuka={form.buka} judul={form.id ? 'Ubah Lokasi' : 'Tambah Lokasi'}
        keterangan="Klik pada peta atau ubah koordinat untuk memindahkan titik. Lingkaran menunjukkan radius sah."
        onTutup={() => setForm({ buka: false, nilai: KOSONG })}
        footer={
          <>
            <Button varian="ghost" onClick={() => setForm({ buka: false, nilai: KOSONG })}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={() => simpan.mutate(form)}>Simpan</Button>
          </>
        }>
        <div className="space-y-4">
          <BidangTeks label="Nama lokasi" id="lokasi-nama" wajib nilai={form.nilai.nama}
            pesanError={galat.nama} placeholder="SMK Islam Anharul Ulum"
            onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, nama: v } }))} />

          <div className="overflow-hidden rounded-card border border-line">
            <MapContainer center={pusat} zoom={16} style={{ height: 260, width: '100%' }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PenangkapKlik onPilih={(lat, lng) => setForm((s) => ({ ...s, nilai: { ...s.nilai, latitude: lat.toFixed(7), longitude: lng.toFixed(7) } }))} />
              <Circle center={pusat} radius={Number(form.nilai.radius_m) || 0} pathOptions={{ color: '#1e2a8a' }} />
            </MapContainer>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <BidangTeks label="Latitude" id="lokasi-lat" wajib nilai={form.nilai.latitude}
              pesanError={galat.latitude}
              onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, latitude: v } }))} />
            <BidangTeks label="Longitude" id="lokasi-lng" wajib nilai={form.nilai.longitude}
              pesanError={galat.longitude}
              onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, longitude: v } }))} />
            <BidangTeks label="Radius (meter)" id="lokasi-radius" tipe="number" wajib nilai={form.nilai.radius_m}
              pesanError={galat.radius_m}
              onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, radius_m: v } }))} />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-strong">
              <input type="checkbox" checked={form.nilai.is_default}
                onChange={(e) => setForm((s) => ({ ...s, nilai: { ...s.nilai, is_default: e.target.checked } }))} />
              Jadikan lokasi default
            </label>
            <label className="flex items-center gap-2 text-sm text-strong">
              <input type="checkbox" checked={form.nilai.is_active}
                onChange={(e) => setForm((s) => ({ ...s, nilai: { ...s.nilai, is_active: e.target.checked } }))} />
              Aktif
            </label>
          </div>
        </div>
      </Modal>

      {/* ---------- Penetapan massal (FR-LOK-03) ---------- */}
      <Modal terbuka={tetapkan} judul="Tetapkan Lokasi ke Pegawai"
        keterangan="Centang pegawai dan lokasi yang berlaku. Mengosongkan centang lokasi mengembalikan pegawai ke lokasi default (BR-12)."
        onTutup={() => setTetapkan(false)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setTetapkan(false)}>Batal</Button>
            <Button memuat={simpanTetapkan.isPending} disabled={pilihPegawai.length === 0}
              onClick={() => simpanTetapkan.mutate()}>
              <Check size={17} /> Simpan Penetapan
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-strong">Lokasi yang ditetapkan</p>
            <div className="flex flex-wrap gap-2">
              {daftar.map((l) => (
                <label key={l.id} className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-sm text-strong">
                  <input type="checkbox" checked={pilihLokasi.includes(l.id)}
                    onChange={(e) => setPilihLokasi((s) => (e.target.checked ? [...s, l.id] : s.filter((x) => x !== l.id)))} />
                  {l.nama}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-strong">Pegawai ({pilihPegawai.length} dipilih)</p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {(pegawai.data?.data ?? []).map((p) => (
                <label key={p.pegawai_id} className="flex items-center gap-3 rounded-control border border-line px-3 py-2">
                  <input type="checkbox" checked={pilihPegawai.includes(p.pegawai_id)}
                    onChange={(e) => setPilihPegawai((s) => (e.target.checked ? [...s, p.pegawai_id] : s.filter((x) => x !== p.pegawai_id)))} />
                  <span className="flex-1 text-sm font-semibold text-strong">{p.nama}</span>
                  <span className="text-xs text-muted">{p.lokasi_nama.length > 0 ? p.lokasi_nama.join(', ') : 'default'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog terbuka={hapus !== null} judul="Hapus lokasi?"
        keterangan={hapus ? `${hapus.nama} akan dihapus. Pegawai yang memakainya akan kembali ke lokasi default.` : ''}
        labelKonfirmasi="Hapus" memuat={hapusLokasi.isPending}
        onKonfirmasi={() => hapus && hapusLokasi.mutate(hapus.id)} onTutup={() => setHapus(null)} />
    </div>
  )
}

/** Menangkap klik peta untuk memindahkan titik lokasi. */
function PenangkapKlik({ onPilih }: { onPilih: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPilih(e.latlng.lat, e.latlng.lng) })
  return null
}
