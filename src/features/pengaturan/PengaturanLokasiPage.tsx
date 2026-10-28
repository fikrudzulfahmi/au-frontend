import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Star, Trash2, Users } from 'lucide-react'
import {
  Circle,
  CircleMarker,
  LayersControl,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
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
 * editor zona poligon batas sekolah, penanda default (BR-12),
 * dan penetapan lokasi ke pegawai secara massal.
 */
export function PengaturanLokasiPage() {
  const { user } = useAuth()
  const bolehKelola = punyaPeran(user, ROLE.admin)
  const toast = useToast()
  const qc = useQueryClient()

  const [form, setForm] = useState<{ buka: boolean; id?: number; nilai: typeof KOSONG }>({ buka: false, nilai: KOSONG })
  const [modeZona, setModeZona] = useState<'radius' | 'poligon'>('radius')
  const [poligon, setPoligon] = useState<[number, number][]>([])
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

  const tutupForm = () => {
    setForm({ buka: false, nilai: KOSONG })
    setPoligon([])
    setModeZona('radius')
    setGalat({})
  }

  const simpan = useMutation({
    mutationFn: (v: { id?: number; nilai: typeof KOSONG; poligonPayload: [number, number][] | null }) => {
      const isi = {
        nama: v.nilai.nama,
        latitude: Number(v.nilai.latitude),
        longitude: Number(v.nilai.longitude),
        radius_m: Number(v.nilai.radius_m),
        is_default: v.nilai.is_default,
        is_active: v.nilai.is_active,
        // Kirim array [lat, lng] jika mode poligon dipilih, atau null bila mode radius
        poligon: v.poligonPayload,
      }
      return v.id ? master.ubah('/pengaturan/lokasi', v.id, isi) : master.buat('/pengaturan/lokasi', isi)
    },
    onSuccess: () => {
      toast.sukses('Lokasi disimpan.')
      tutupForm()
      segarkan()
    },
    onError: (e) => {
      setGalat(pesanPerBidang(e))
      toast.gagal(pesanError(e))
    },
  })

  const tanganiSimpan = () => {
    // Validasi minimal 3 titik bila mode poligon dipilih sebelum boleh disimpan
    if (modeZona === 'poligon' && poligon.length < 3) {
      setGalat((g) => ({ ...g, poligon: 'Zona poligon membutuhkan minimal 3 titik sudut.' }))
      toast.gagal('Zona poligon membutuhkan minimal 3 titik sudut.')
      return
    }

    setGalat((g) => {
      const salin = { ...g }
      delete salin.poligon
      return salin
    })

    simpan.mutate({
      id: form.id,
      nilai: form.nilai,
      poligonPayload: modeZona === 'poligon' ? poligon : null,
    })
  }

  const jadikanDefault = useMutation({
    mutationFn: (id: number) => aksi(`/pengaturan/lokasi/${id}/default`, {}, 'patch'),
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
  const latNum = Number(form.nilai.latitude)
  const lngNum = Number(form.nilai.longitude)
  const pusat: [number, number] = [
    Number.isFinite(latNum) ? latNum : -7.8654,
    Number.isFinite(lngNum) ? lngNum : 111.465,
  ]

  const tanganiBukaUbah = (l: LokasiPresensi) => {
    setGalat({})
    const poligonAwal: [number, number][] = Array.isArray(l.poligon)
      ? l.poligon
      : typeof l.poligon === 'string'
        ? (() => {
            try {
              const p = JSON.parse(l.poligon) as unknown
              return Array.isArray(p) ? (p as [number, number][]) : []
            } catch {
              return []
            }
          })()
        : []
    const adaPoligon = poligonAwal.length >= 3
    setModeZona(adaPoligon ? 'poligon' : 'radius')
    setPoligon(poligonAwal)
    setForm({
      buka: true,
      id: l.id,
      nilai: {
        nama: l.nama,
        latitude: String(l.latitude),
        longitude: String(l.longitude),
        radius_m: String(l.radius_m),
        is_default: l.is_default,
        is_active: l.is_active ?? true,
      },
    })
  }

  const tanganiTambahTitik = (lat: number, lng: number) => {
    setPoligon((prev) => [...prev, [Number(lat.toFixed(7)), Number(lng.toFixed(7))]])
    setGalat((g) => {
      if (!g.poligon) return g
      const salin = { ...g }
      delete salin.poligon
      return salin
    })
  }

  const hapusTitikTerakhir = () => {
    setPoligon((prev) => prev.slice(0, -1))
  }

  const kosongkanPoligon = () => {
    setPoligon([])
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Lokasi Presensi"
        keterangan="Radius sah ditegakkan server dengan rumus Haversine atau zona poligon. Pegawai tanpa penetapan khusus memakai lokasi default (BR-12)."
        aksi={
          bolehKelola && (
            <>
              <Button varian="secondary" onClick={() => { setTetapkan(true); setPilihPegawai([]); setPilihLokasi([]) }}>
                <Users size={17} /> Tetapkan ke Pegawai
              </Button>
              <Button onClick={() => {
                setGalat({})
                setModeZona('radius')
                setPoligon([])
                setForm({ buka: true, nilai: KOSONG })
              }}>
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
            <p className="mt-1 text-sm text-strong">
              Radius <span className="tnum font-bold">{l.radius_m} m</span>
              {Array.isArray(l.poligon) && l.poligon.length >= 3 && (
                <span className="ml-2 inline-flex items-center rounded bg-info-soft px-1.5 py-0.5 text-xs font-semibold text-link">
                  Poligon ({l.poligon.length} titik)
                </span>
              )}
            </p>
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
                  onClick={() => tanganiBukaUbah(l)}
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
        keterangan="Pilih mode Radius atau Poligon. Peta menampilkan citra satelit untuk memudahkan pemetaan batas area sekolah."
        onTutup={tutupForm}
        footer={
          <>
            <Button varian="ghost" onClick={tutupForm}>Batal</Button>
            <Button memuat={simpan.isPending} onClick={tanganiSimpan}>Simpan</Button>
          </>
        }>
        <div className="space-y-4">
          <BidangTeks label="Nama lokasi" id="lokasi-nama" wajib nilai={form.nilai.nama}
            pesanError={galat.nama} placeholder="SMK Islam Anharul Ulum"
            onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, nama: v } }))} />

          {/* Sakelar mode dan aksi poligon */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">Bentuk Area:</span>
              <div className="inline-flex rounded-control border border-line bg-app-soft p-0.5">
                <button
                  type="button"
                  onClick={() => setModeZona('radius')}
                  className={`rounded-control px-2.5 py-1 text-xs font-semibold transition-colors ${
                    modeZona === 'radius'
                      ? 'bg-card text-strong shadow-xs'
                      : 'text-muted hover:text-strong'
                  }`}
                >
                  Radius
                </button>
                <button
                  type="button"
                  onClick={() => setModeZona('poligon')}
                  className={`rounded-control px-2.5 py-1 text-xs font-semibold transition-colors ${
                    modeZona === 'poligon'
                      ? 'bg-card text-strong shadow-xs'
                      : 'text-muted hover:text-strong'
                  }`}
                >
                  Poligon {poligon.length > 0 && `(${poligon.length} titik)`}
                </button>
              </div>
            </div>

            {modeZona === 'poligon' && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  varian="secondary"
                  ukuran="sm"
                  disabled={poligon.length === 0}
                  onClick={hapusTitikTerakhir}
                >
                  Hapus titik terakhir
                </Button>
                <Button
                  type="button"
                  varian="secondary"
                  ukuran="sm"
                  disabled={poligon.length === 0}
                  onClick={kosongkanPoligon}
                >
                  Kosongkan
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-card border border-line">
            <MapContainer
              key={`${form.id ?? 'baru'}-${form.buka ? 'buka' : 'tutup'}`}
              center={pusat}
              zoom={16}
              style={{ height: 280, width: '100%' }}
              scrollWheelZoom
            >
              <PenyesuaiUkuranPeta />
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Citra">
                  <TileLayer
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Jalan">
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <PenangkapKlik
                mode={modeZona}
                onKlikRadius={(lat, lng) =>
                  setForm((s) => ({
                    ...s,
                    nilai: { ...s.nilai, latitude: lat.toFixed(7), longitude: lng.toFixed(7) },
                  }))
                }
                onTambahTitik={tanganiTambahTitik}
              />

              {/* Lingkaran radius (tetap tampil sebagai acuan bila poligon belum aktif) */}
              <Circle
                center={pusat}
                radius={Number(form.nilai.radius_m) || 0}
                pathOptions={{
                  color: '#1e2a8a',
                  weight: modeZona === 'poligon' ? 1 : 2,
                  dashArray: modeZona === 'poligon' ? '4 4' : undefined,
                  fillOpacity: modeZona === 'poligon' ? 0.03 : 0.08,
                  interactive: false,
                }}
              />

              {/* Titik koordinat pusat */}
              <CircleMarker
                center={pusat}
                radius={5}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#1e2a8a',
                  fillOpacity: 1,
                  weight: 2,
                  interactive: false,
                }}
              />

              {/* Area poligon jika ada minimal 3 titik sudut */}
              {poligon.length >= 3 && (
                <Polygon
                  positions={poligon}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.25,
                    weight: 2,
                    interactive: false,
                  }}
                />
              )}

              {/* Garis penghubung sementara jika baru 2 titik */}
              {poligon.length === 2 && (
                <Polyline
                  positions={poligon}
                  pathOptions={{
                    color: '#2563eb',
                    weight: 2,
                    dashArray: '4 4',
                    interactive: false,
                  }}
                />
              )}

              {/* Penanda setiap titik sudut poligon */}
              {poligon.map((titik, idx) => (
                <CircleMarker
                  key={`${idx}-${titik[0]}-${titik[1]}`}
                  center={titik}
                  radius={5}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    weight: 2,
                    interactive: false,
                  }}
                />
              ))}
            </MapContainer>
          </div>

          {/* Petunjuk singkat penggunaan editor */}
          {modeZona === 'poligon' ? (
            <div className="rounded-control bg-info-soft/40 p-2.5 text-xs text-muted">
              <span className="font-semibold text-strong">Petunjuk Mode Poligon:</span> Klik pada peta
              untuk menambahkan titik-titik sudut batas area presensi sekolah (minimal 3 titik). Garis biru
              akan menghubungkan setiap sudut. Gunakan tombol &quot;Hapus titik terakhir&quot; bila keliru.
            </div>
          ) : (
            <p className="text-xs text-muted">
              Petunjuk Mode Radius: Klik pada peta atau ubah angka koordinat di bawah untuk memindahkan titik pusat.
              Lingkaran biru menunjukkan radius presensi yang sah.
            </p>
          )}

          {galat.poligon && (
            <p className="text-xs font-semibold text-danger">{galat.poligon}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <BidangTeks label="Latitude" id="lokasi-lat" wajib nilai={form.nilai.latitude}
              pesanError={galat.latitude}
              onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, latitude: v } }))} />
            <BidangTeks label="Longitude" id="lokasi-lng" wajib nilai={form.nilai.longitude}
              pesanError={galat.longitude}
              onUbah={(v) => setForm((s) => ({ ...s, nilai: { ...s.nilai, longitude: v } }))} />
            <BidangTeks
              label={modeZona === 'poligon'
                ? 'Radius cadangan (meter) — boleh 0 bila poligon dipakai'
                : 'Radius (meter)'}
              id="lokasi-radius" tipe="number" wajib={modeZona === 'radius'} nilai={form.nilai.radius_m}
              petunjuk={modeZona === 'poligon' ? 'Zona sah ditentukan poligon; radius hanya cadangan bila poligon dikosongkan.' : undefined}
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

/** Menangkap klik peta untuk memindahkan titik lokasi (mode radius) atau menambah titik sudut (mode poligon). */
function PenangkapKlik({
  mode,
  onKlikRadius,
  onTambahTitik,
}: {
  mode: 'radius' | 'poligon'
  onKlikRadius: (lat: number, lng: number) => void
  onTambahTitik: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      if (mode === 'poligon') {
        onTambahTitik(e.latlng.lat, e.latlng.lng)
      } else {
        onKlikRadius(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

/** Memastikan peta menyesuaikan ukuran kanvas saat modal selesai dibuka. */
function PenyesuaiUkuranPeta() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 120)
    return () => clearTimeout(timer)
  }, [map])
  return null
}
