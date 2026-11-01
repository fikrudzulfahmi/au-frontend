import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, Camera, CheckCircle2, Clock, Loader2, MapPin, RefreshCw, RotateCcw, Send,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { pesanError } from '@/lib/api'
import { kompresFoto } from '@/lib/kompresFoto'
import { GeolokasiError, bacaPosisi, formatJarak, terdekatLokasi, type Posisi } from '@/lib/geolokasi'
import { ambilStatusHariIni, kirimPresensi } from './api'
import { PetaPresensi } from './PetaPresensi'

type Mode = 'masuk' | 'pulang'

/**
 * FR-PRS — presensi masuk/pulang dari kamera dengan GPS.
 *
 * Alur: izin kamera & lokasi → pratinjau → ambil foto → periksa jarak & akurasi →
 * kirim. Seluruh keputusan sah/tidak ada di server (BR-11/BR-17); indikator di sini
 * hanya memberi tahu pegawai sebelum mengirim.
 */
export function PresensiPage() {
  const toast = useToast()
  const qc = useQueryClient()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const aliranRef = useRef<MediaStream | null>(null)

  const [siapKamera, setSiapKamera] = useState(false)
  const [galatKamera, setGalatKamera] = useState<string | null>(null)
  const [foto, setFoto] = useState<{ berkas: File; url: string; byte: number } | null>(null)
  const [sedangKompres, setSedangKompres] = useState(false)
  const [posisi, setPosisi] = useState<Posisi | null>(null)
  const [galatPosisi, setGalatPosisi] = useState<string | null>(null)
  const [membacaPosisi, setMembacaPosisi] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [mode, setMode] = useState<Mode>('masuk')

  const status = useQuery({
    queryKey: ['presensi', 'hari-ini'],
    queryFn: ambilStatusHariIni,
    refetchOnWindowFocus: true,
  })

  const data = status.data?.data

  // Tombol masuk/pulang mengikuti status dari server.
  useEffect(() => {
    if (data === undefined) return
    setMode(data.boleh_pulang ? 'pulang' : 'masuk')
  }, [data?.boleh_pulang, data])

  const mulaiKamera = useCallback(async () => {
    setGalatKamera(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setGalatKamera('Peramban ini tidak mendukung akses kamera. Gunakan peramban terbaru atau ponsel.')
      return
    }

    try {
      // FR-PRS-08 / BR-29 — hanya kamera depan, bukan berkas dari galeri.
      const aliran = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })

      aliranRef.current = aliran

      if (videoRef.current !== null) {
        videoRef.current.srcObject = aliran
        await videoRef.current.play()
      }

      setSiapKamera(true)
    } catch {
      setGalatKamera(
        'Kamera tidak dapat diakses. Izinkan akses kamera pada peramban, lalu muat ulang halaman.',
      )
    }
  }, [])

  const hentikanKamera = useCallback(() => {
    aliranRef.current?.getTracks().forEach((jalur) => jalur.stop())
    aliranRef.current = null
    setSiapKamera(false)
  }, [])

  useEffect(() => () => hentikanKamera(), [hentikanKamera])

  const perbaruiPosisi = useCallback(async () => {
    setMembacaPosisi(true)
    setGalatPosisi(null)

    try {
      setPosisi(await bacaPosisi())
    } catch (e) {
      setGalatPosisi(e instanceof GeolokasiError ? e.message : 'Lokasi tidak dapat dibaca.')
    } finally {
      setMembacaPosisi(false)
    }
  }, [])

  // Baca lokasi otomatis saat halaman presensi dibuka (FR-PRS-06).
  useEffect(() => {
    void perbaruiPosisi()
  }, [perbaruiPosisi])

  async function ambilFoto() {
    const video = videoRef.current
    if (video === null || posisi === null) return

    setSedangKompres(true)

    try {
      const kanvas = document.createElement('canvas')
      kanvas.width = video.videoWidth
      kanvas.height = video.videoHeight

      const konteks = kanvas.getContext('2d')
      if (konteks === null) throw new Error('Kanvas tidak tersedia.')

      konteks.drawImage(video, 0, 0)

      const mentah = await new Promise<Blob>((selesai, gagal) =>
        kanvas.toBlob((b) => (b === null ? gagal(new Error('Gagal mengambil gambar.')) : selesai(b)), 'image/jpeg', 0.9),
      )

      const hasil = await kompresFoto(mentah, { sisiMaks: 800, targetKb: 150 })

      setFoto((lama) => {
        if (lama !== null) URL.revokeObjectURL(lama.url)
        return { berkas: hasil.berkas, url: URL.createObjectURL(hasil.berkas), byte: hasil.byte }
      })

      hentikanKamera()
    } catch (e) {
      toast.gagal(e instanceof Error ? e.message : 'Foto gagal diproses.')
    } finally {
      setSedangKompres(false)
    }
  }

  const kirim = useMutation({
    mutationFn: () => {
      if (foto === null || posisi === null) throw new Error('Foto dan lokasi wajib ada.')

      return kirimPresensi(mode, {
        foto: foto.berkas,
        lat: posisi.lat,
        lng: posisi.lng,
        akurasi_m: posisi.akurasi_m,
        alasan: alasan.trim() === '' ? undefined : alasan.trim(),
      })
    },
    onSuccess: (hasil) => {
      toast.sukses(hasil.message)
      setFoto(null)
      setAlasan('')
      void qc.invalidateQueries({ queryKey: ['presensi'] })
      void status.refetch()
    },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jarak = posisi !== null && data !== undefined ? terdekatLokasi(posisi, data.lokasi) : null
  const diLuarRadius = jarak !== null && !jarak.diDalamRadius

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Presensi"
        keterangan="Ambil foto langsung dari kamera dan pastikan lokasi terbaca. Waktu dicatat oleh server."
      />

      {/* ---------- Ringkasan hari ini ---------- */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-strong">
              {data?.nama_hari ?? '—'}, {data?.tanggal ?? ''}
            </h2>
            <p className="text-xs text-muted">
              Jam kerja {data?.jam_masuk?.slice(0, 5) ?? '—'}–{data?.jam_pulang?.slice(0, 5) ?? '—'}
              {data?.buka_presensi && ` · presensi dibuka ${data.buka_presensi.slice(0, 5)}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Penanda hari hanya ditampilkan bila data benar-benar ada; tanpa penjagaan
                `data !== undefined`, permintaan yang gagal akan tampil seolah-olah
                hari ini bukan hari kerja — menyesatkan. */}
            {data !== undefined && data.hari_libur && <StatusBadge varian="cuti">Libur: {data.hari_libur}</StatusBadge>}
            {data !== undefined && !data.is_hari_kerja && <StatusBadge varian="cuti">Bukan hari kerja</StatusBadge>}
            {data?.presensi?.masuk.validasi === 'menunggu' && <StatusBadge varian="izin">Menunggu persetujuan</StatusBadge>}
            {data?.presensi?.masuk.status === 'terlambat' && (
              <StatusBadge varian="menunggu">Terlambat {data.presensi.masuk.menit_terlambat} menit</StatusBadge>
            )}
            {data?.presensi?.masuk.status === 'hadir' && <StatusBadge varian="hadir">Sudah presensi masuk</StatusBadge>}
          </div>
        </div>

        {data?.presensi && (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold text-muted">Masuk</dt>
              <dd className="tnum text-lg font-bold text-strong">{data.presensi.masuk.jam ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Pulang</dt>
              <dd className="tnum text-lg font-bold text-strong">{data.presensi.pulang.jam ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Jarak saat masuk</dt>
              <dd className="tnum text-lg font-bold text-strong">{formatJarak(data.presensi.masuk.jarak_m)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Lokasi</dt>
              <dd className="text-sm font-bold text-strong">{data.presensi.masuk.lokasi ?? 'Luar radius'}</dd>
            </div>
          </dl>
        )}

        {data?.alasan_tidak_boleh_masuk && data.presensi === null && (
          <p className="mt-4 flex items-start gap-2 rounded-control bg-info-soft px-3 py-2.5 text-sm text-strong">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn-text" />
            {data.alasan_tidak_boleh_masuk}
          </p>
        )}
      </section>

      {status.isError ? (
        <p className="card p-5 text-sm text-strong">
          Status presensi tidak dapat dimuat. Bila akun ini bukan akun pegawai, halaman presensi memang tidak berlaku.
        </p>
      ) : data?.boleh_masuk === false && data?.boleh_pulang === false ? (
        <p className="card p-5 text-sm text-muted">
          Tidak ada presensi yang perlu dilakukan saat ini.
        </p>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {/* ---------- Kamera ---------- */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-strong">
              <Camera size={18} className="text-primary" /> Foto {mode === 'masuk' ? 'Masuk' : 'Pulang'}
            </h2>

            <div className="mt-3 overflow-hidden rounded-card bg-strong/90">
              {foto !== null ? (
                <img src={foto.url} alt="Pratinjau foto presensi" className="aspect-video w-full object-cover" />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={cn('aspect-video w-full object-cover', !siapKamera && 'hidden')}
                />
              )}

              {foto === null && !siapKamera && (
                <div className="flex aspect-video w-full items-center justify-center px-4 text-center">
                  <p className="text-sm text-white/80">
                    {galatKamera ?? 'Kamera belum aktif. Tekan tombol di bawah untuk menyalakan.'}
                  </p>
                </div>
              )}

              {foto === null && siapKamera && (
                <p className="bg-strong px-3 py-2 text-center text-xs text-white/80">
                  Posisikan wajah di dalam bingkai, lalu ambil foto.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {foto === null && !siapKamera && (
                <Button onClick={() => void mulaiKamera()}>
                  <Camera size={17} /> Nyalakan kamera
                </Button>
              )}

              {foto === null && siapKamera && (
                <Button memuat={sedangKompres} onClick={() => void ambilFoto()}>
                  <Camera size={17} /> Ambil foto
                </Button>
              )}

              {foto !== null && (
                <>
                  <Button varian="secondary" onClick={() => { setFoto(null); void mulaiKamera() }}>
                    <RotateCcw size={17} /> Ambil ulang
                  </Button>
                  <span className="self-center text-xs text-muted">
                    {(foto.byte / 1024).toFixed(0)} KB setelah dikompres
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-xs text-muted">
              Foto hanya dapat diambil langsung dari kamera, tidak dari galeri (BR-29).
            </p>
          </div>

          {/* ---------- Lokasi ---------- */}
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-strong">
                <MapPin size={18} className="text-primary" /> Lokasi
              </h2>
              {jarak !== null && (
                <StatusBadge varian={jarak.diDalamRadius ? 'hadir' : 'alpa'}>
                  {jarak.diDalamRadius ? 'Di dalam radius' : 'Di luar radius'}
                </StatusBadge>
              )}
            </div>

            <div className="mt-3 space-y-3">
              {posisi === null ? (
                <p className="text-sm text-muted">
                  {galatPosisi ?? 'Lokasi belum terbaca. Aktifkan izin lokasi lalu baca ulang.'}
                </p>
              ) : (
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs font-semibold text-muted">Akurasi GPS</dt>
                    <dd className="tnum text-lg font-bold text-strong">± {posisi.akurasi_m} m</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted">Jarak ke lokasi terdekat</dt>
                    <dd className="tnum text-lg font-bold text-strong">{formatJarak(jarak?.jarak_m)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold text-muted">Lokasi terdekat</dt>
                    <dd className="text-sm font-bold text-strong">
                      {jarak === null ? 'Tidak ada lokasi presensi terdaftar.' : jarak.lokasi.nama}
                      {jarak !== null && ` · radius ${jarak.lokasi.radius_m} m`}
                    </dd>
                  </div>
                </dl>
              )}

              {data !== undefined && data.lokasi.length > 0 && (
                <PetaPresensi daftarLokasi={data.lokasi} posisi={posisi} />
              )}

              <Button varian="secondary" memuat={membacaPosisi} onClick={() => void perbaruiPosisi()}>
                {membacaPosisi ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                Baca ulang lokasi
              </Button>

              {diLuarRadius && (
                <div className="rounded-control bg-warn-bg px-3 py-2.5">
                  <p className="flex items-center gap-2 text-sm font-bold text-warn-text">
                    <AlertTriangle size={15} /> Anda di luar radius semua lokasi
                  </p>
                  <p className="mt-1 text-xs text-strong">
                    Presensi tetap dapat dikirim, lalu menunggu persetujuan admin (BR-17). Isi alasan di bawah.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Kirim ---------- */}
      {data?.boleh_masuk !== false || data?.boleh_pulang === true ? (
        <section className="card space-y-3 p-5">
          {diLuarRadius && (
            <BidangTeks
              label="Alasan di luar radius"
              id="alasan-presensi"
              wajib
              nilai={alasan}
              petunjuk="Contoh: mendampingi siswa lomba di luar kota (BR-17)."
              onUbah={setAlasan}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              memuat={kirim.isPending}
              disabled={foto === null || posisi === null || (diLuarRadius && alasan.trim().length < 5)}
              onClick={() => kirim.mutate()}
            >
              <Send size={17} /> Kirim presensi {mode}
            </Button>

            {foto === null && <span className="text-sm text-muted">Ambil foto terlebih dahulu.</span>}
            {foto !== null && posisi === null && <span className="text-sm text-muted">Baca lokasi terlebih dahulu.</span>}
            {mode === 'pulang' && (
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Clock size={15} /> Pulang sebelum jam pulang akan ditandai pulang cepat (BR-16).
              </span>
            )}
          </div>

          {kirim.isSuccess && (
            <p className="flex items-center gap-2 rounded-control bg-success-soft px-3 py-2 text-sm text-strong">
              <CheckCircle2 size={16} className="text-success" /> {kirim.data?.message}
            </p>
          )}
        </section>
      ) : null}
    </div>
  )
}
