import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock, MapPin, Wrench, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { get, pesanError, urlFotoBerpelindung } from '@/lib/api'
import { aksi } from '@/lib/crud'
import { formatJarak } from '@/lib/geolokasi'
import { formatTanggalDari } from '@/lib/format'
import { ROLE, punyaPeran } from '@/lib/roles'
import { useAuth } from '@/features/auth/AuthContext'
import type { BarisMonitoring, KategoriMonitoring, MonitoringHarian } from '@/features/presensi/types'
import { PetaLokasiAbsen } from './PetaLokasiAbsen'
import { VARIAN_KATEGORI } from '@/features/presensi/types'

/** FR-PRS-10/11/13 — monitoring presensi harian, persetujuan luar radius, dan koreksi. */
export function MonitoringPresensiPage() {
  const { user } = useAuth()
  const bolehPutuskan = punyaPeran(user, ROLE.admin, ROLE.kepalaSekolah)
  const toast = useToast()
  const qc = useQueryClient()

  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState('')
  const [jenis, setJenis] = useState('')
  const [pilih, setPilih] = useState<BarisMonitoring | null>(null)
  const [koreksiUntuk, setKoreksiUntuk] = useState<BarisMonitoring | null>(null)
  const [catatan, setCatatan] = useState('')
  const [koreksi, setKoreksi] = useState({ pulang_waktu: '', pulang_status: 'normal', alasan: '' })

  const monitoring = useQuery({
    queryKey: ['monitoring', 'harian', { tanggal, status, jenis }],
    queryFn: () => get<{ data: MonitoringHarian; meta: { kategori: Record<string, string> } }>(
      '/monitoring/presensi-harian',
      { tanggal, status, jenis_pegawai: jenis },
    ),
  })

  const segarkan = () => void qc.invalidateQueries({ queryKey: ['monitoring'] })

  const putuskan = useMutation({
    mutationFn: (v: { id: number; keputusan: 'disetujui' | 'ditolak'; sisi: 'masuk' | 'pulang' }) =>
      aksi(
        `/monitoring/presensi-harian/${v.id}/putuskan`,
        { keputusan: v.keputusan, sisi: v.sisi, catatan_penyetuju: catatan || null },
        'patch',
      ),
    onSuccess: () => { toast.sukses('Keputusan tersimpan.'); setPilih(null); setCatatan(''); segarkan() },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const simpanKoreksi = useMutation({
    mutationFn: () => aksi(
      `/monitoring/presensi-harian/${koreksiUntuk?.presensi_id}/koreksi`,
      {
        pulang_waktu: koreksi.pulang_waktu || null,
        pulang_status: koreksi.pulang_status || null,
        alasan: koreksi.alasan,
      },
      'patch',
    ),
    onSuccess: () => {
      toast.sukses('Koreksi tersimpan dan tercatat di audit log.')
      setKoreksiUntuk(null)
      setKoreksi({ pulang_waktu: '', pulang_status: 'normal', alasan: '' })
      segarkan()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const data = monitoring.data?.data
  const ringkasan = data?.ringkasan

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Monitoring Presensi Harian"
        keterangan="Status seluruh pegawai aktif pada tanggal terpilih. Klik baris untuk melihat foto dan memutuskan presensi luar radius."
      />

      <div className="flex flex-wrap items-end gap-2">
        <BidangTeks label="Tanggal" id="tanggal-monitoring" tipe="date" nilai={tanggal}
          className="w-44" onUbah={setTanggal} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-strong">Jenis pegawai</span>
          <select value={jenis} onChange={(e) => setJenis(e.target.value)}
            className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
            <option value="">Semua</option>
            <option value="guru">Guru</option>
            <option value="struktural">Struktural</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-strong">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="min-h-[44px] rounded-control border border-line bg-surface px-3 text-sm text-strong">
            <option value="">Semua</option>
            {Object.entries(monitoring.data?.meta.kategori ?? {}).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {ringkasan && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ringkasan) as KategoriMonitoring[])
            .filter((k) => ringkasan[k] > 0)
            .map((k) => (
              <button key={k} type="button" onClick={() => setStatus(status === k ? '' : k)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  status === k ? 'bg-primary text-white' : 'bg-surface text-strong shadow-card hover:bg-app-soft'
                }`}>
                {monitoring.data?.meta.kategori[k] ?? k}: <span className="tnum">{ringkasan[k]}</span>
              </button>
            ))}
        </div>
      )}

      {data?.hari_libur && (
        <p className="rounded-control bg-info-soft px-3 py-2 text-sm text-strong">{data.hari_libur}</p>
      )}

      <DataTable
        data={data?.baris ?? []}
        kunciBaris={(b) => b.pegawai_id}
        kosong="Tidak ada pegawai yang cocok dengan penyaring ini."
        kolom={[
          {
            kunci: 'nama', judul: 'Pegawai',
            render: (b) => (
              <span className="block">
                <span className="font-bold text-strong">{b.nama}</span>
                <span className="tnum block text-xs text-muted">{b.nip} · {b.jenis_pegawai}</span>
              </span>
            ),
          },
          {
            kunci: 'status', judul: 'Status',
            render: (b) => {
              if (b.status === 'berhalangan' && b.pengajuan_label) {
                return <StatusBadge varian="cuti">{b.pengajuan_label}</StatusBadge>
              }
              return <StatusBadge varian={VARIAN_KATEGORI[b.status]}>{b.label_status}</StatusBadge>
            },
          },
          {
            kunci: 'jam', judul: 'Masuk / Pulang',
            render: (b) => (
              <span className="tnum text-sm">
                {b.masuk_jam ?? '—'} / {b.pulang_jam ?? '—'}
                {b.status === 'terlambat' && <span className="ml-1 text-xs text-warn-text">+{b.menit_terlambat}′</span>}
              </span>
            ),
          },
          { kunci: 'jarak', judul: 'Jarak', render: (b) => <span className="tnum text-xs">{formatJarak(b.jarak_m)}</span>, sembunyiMobile: true },
          { kunci: 'lokasi', judul: 'Lokasi', render: (b) => <span className="text-xs text-muted">{b.lokasi ?? '—'}</span>, sembunyiMobile: true },
          {
            kunci: 'aksi', judul: 'Aksi', className: 'w-28',
            render: (b) => (
              <span className="flex items-center gap-1.5">
                <button type="button" onClick={() => { setPilih(b); setCatatan('') }}
                  className="flex items-center gap-1 text-sm font-semibold text-link">
                  <MapPin size={14} /> Detail
                </button>
                {bolehPutuskan && b.presensi_id !== null && (
                  <button type="button" title="Koreksi manual"
                    onClick={() => { setKoreksiUntuk(b); setKoreksi({ pulang_waktu: '', pulang_status: 'normal', alasan: '' }) }}
                    className="flex items-center text-muted hover:text-strong">
                    <Wrench size={14} />
                  </button>
                )}
              </span>
            ),
          },
        ]}
      />

      <p className="px-1 text-xs text-muted">
        Tanggal {data ? formatTanggalDari(data.tanggal) : '—'} · {data?.baris.length ?? 0} pegawai ditampilkan.
      </p>

      {/* ---------- Detail & keputusan ---------- */}
      <DetailPresensi baris={pilih} onTutup={() => setPilih(null)}
        bolehPutuskan={bolehPutuskan} catatan={catatan} onCatatan={setCatatan}
        onPutuskan={(keputusan, sisi) => pilih?.presensi_id !== null && putuskan.mutate({ id: pilih!.presensi_id as number, keputusan, sisi })}
        memuat={putuskan.isPending} />

      {/* ---------- Koreksi manual (FR-PRS-13) ---------- */}
      <Modal terbuka={koreksiUntuk !== null} lebar="sm" judul="Koreksi Presensi"
        // `tanggal` diambil dari penyaring halaman: BarisMonitoring hanya memuat data hari itu.
        keterangan={koreksiUntuk ? `${koreksiUntuk.nama} — ${formatTanggalDari(tanggal)}` : ''}
        onTutup={() => setKoreksiUntuk(null)}
        footer={
          <>
            <Button varian="ghost" onClick={() => setKoreksiUntuk(null)}>Batal</Button>
            <Button memuat={simpanKoreksi.isPending} disabled={koreksi.alasan.trim().length < 5}
              onClick={() => simpanKoreksi.mutate()}>Simpan Koreksi</Button>
          </>
        }>
        <div className="space-y-4">
          <p className="rounded-control bg-app-soft px-3 py-2 text-xs text-muted">
            Koreksi wajib beralasan dan akan ditandai sebagai data yang dikoreksi admin, tercatat di audit log (FR-PRS-13).
          </p>
          <BidangTeks label="Jam pulang" id="koreksi-pulang" tipe="time" nilai={koreksi.pulang_waktu}
            onUbah={(v) => setKoreksi((s) => ({ ...s, pulang_waktu: v }))} />
          <BidangTeks label="Alasan koreksi" id="koreksi-alasan" wajib nilai={koreksi.alasan}
            petunjuk="Contoh: lupa presensi pulang, sudah dikonfirmasi ke wali kelas."
            onUbah={(v) => setKoreksi((s) => ({ ...s, alasan: v }))} />
        </div>
      </Modal>
    </div>
  )
}

/** DETAIL: foto, koordinat, dan tombol keputusan untuk presensi luar radius. */
function DetailPresensi({
  baris, onTutup, bolehPutuskan, catatan, onCatatan, onPutuskan, memuat,
}: {
  baris: BarisMonitoring | null
  onTutup: () => void
  bolehPutuskan: boolean
  catatan: string
  onCatatan: (v: string) => void
  onPutuskan: (keputusan: 'disetujui' | 'ditolak', sisi: 'masuk' | 'pulang') => void
  memuat: boolean
}) {
  const foto = useQuery({
    queryKey: ['monitoring', 'foto', baris?.presensi_id],
    queryFn: () => urlFotoBerpelindung(`/presensi/${baris?.presensi_id}/foto/masuk`),
    enabled: (baris?.presensi_id ?? null) !== null && baris?.ada_foto === true,
    staleTime: 5 * 60 * 1000,
  })

  const menungguMasuk = baris?.masuk_validasi === 'menunggu'
  const menungguPulang = baris?.pulang_validasi === 'menunggu'

  return (
    <Modal terbuka={baris !== null} judul={baris?.nama ?? ''}
      keterangan={baris ? `${baris.nip} · ${baris.label_status}` : ''} onTutup={onTutup}
      footer={
        bolehPutuskan && (menungguMasuk || menungguPulang) ? (
          <>
            <Button varian="secondary" memuat={memuat}
              onClick={() => onPutuskan('ditolak', menungguMasuk ? 'masuk' : 'pulang')}>
              <XCircle size={17} /> Tolak
            </Button>
            <Button memuat={memuat}
              onClick={() => onPutuskan('disetujui', menungguMasuk ? 'masuk' : 'pulang')}>
              <CheckCircle2 size={17} /> Setujui
            </Button>
          </>
        ) : (
          <Button onClick={onTutup}>Tutup</Button>
        )
      }>
      {baris && (
        <div className="space-y-4">
          {baris.ada_foto && baris.presensi_id !== null ? (
            foto.data === undefined
              ? <p className="text-sm text-muted">Memuat foto…</p>
              : <img src={foto.data} alt={`Foto presensi ${baris.nama}`} className="mx-auto max-h-[320px] w-full object-contain" />
          ) : (
            <p className="rounded-control bg-app-soft px-3 py-2 text-sm text-muted">Tidak ada foto presensi hari ini.</p>
          )}

          {baris.masuk_lat !== null && baris.masuk_lng !== null && (
            <PetaLokasiAbsen
              lat={baris.masuk_lat}
              lng={baris.masuk_lng}
              lokasiLat={baris.lokasi_lat ?? null}
              lokasiLng={baris.lokasi_lng ?? null}
              radiusM={baris.lokasi_radius_m ?? null}
              nama={baris.lokasi ?? 'Presensi'}
            />
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs font-semibold text-muted">Masuk</dt><dd className="tnum font-bold text-strong">{baris.masuk_jam ?? '—'} {baris.masuk_status ? `(${baris.masuk_status})` : ''}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Pulang</dt><dd className="tnum font-bold text-strong">{baris.pulang_jam ?? '—'} {baris.pulang_status ? `(${baris.pulang_status})` : ''}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Jarak</dt><dd className="tnum font-bold text-strong">{formatJarak(baris.jarak_m)}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Lokasi</dt><dd className="font-bold text-strong">{baris.lokasi ?? 'Luar semua radius'}</dd></div>
          </dl>

          {baris.alasan_luar_radius && (
            <p className="rounded-control bg-warn-bg px-3 py-2 text-sm text-strong">
              <strong>Alasan pegawai:</strong> {baris.alasan_luar_radius}
            </p>
          )}

          {(menungguMasuk || menungguPulang) && bolehPutuskan && (
            <div className="space-y-3 rounded-control border border-line p-3">
              <p className="flex items-center gap-2 text-sm font-bold text-strong">
                <Clock size={15} /> Menunggu keputusan Anda
              </p>
              <p className="text-xs text-muted">
                Status hadir/terlambat tetap dihitung dari waktu presensi dikirim, bukan waktu keputusan (BR-18).
              </p>
              <BidangTeks label="Catatan penyetuju" id="catatan-presetujuan" nilai={catatan}
                petunjuk="Wajib diisi bila menolak."
                onUbah={onCatatan} />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
