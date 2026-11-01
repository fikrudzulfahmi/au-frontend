import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Building2, Image as ImageIcon, Megaphone, Save } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { BidangTeks } from '@/components/ui/Bidang'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { get, pesanError, post, put } from '@/lib/api'
import { pesanPerBidang } from '@/lib/crud'
import type { ProfilSekolah } from '@/features/sekolah/useSekolah'

interface FormSekolah {
  nama_sekolah: string
  npsn: string
  status_sekolah: string
  akreditasi: string
  tagline: string
  tentang: string
  visi: string
  misi: string
  nama_kepala_sekolah: string
  nip_kepala_sekolah: string
  alamat_jalan: string
  dusun: string
  desa_kelurahan: string
  kecamatan: string
  kabupaten_kota: string
  provinsi: string
  kode_pos: string
  telepon: string
  email: string
  website: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  x: string
  whatsapp: string
  latitude: string
  longitude: string
}

const KOSONG: FormSekolah = {
  nama_sekolah: '', npsn: '', status_sekolah: '', akreditasi: '', tagline: '', tentang: '', visi: '', misi: '',
  nama_kepala_sekolah: '', nip_kepala_sekolah: '', alamat_jalan: '', dusun: '', desa_kelurahan: '',
  kecamatan: '', kabupaten_kota: '', provinsi: '', kode_pos: '', telepon: '', email: '', website: '',
  instagram: '', facebook: '', youtube: '', tiktok: '', x: '', whatsapp: '', latitude: '', longitude: '',
}

/** FR-SCH-01..06 — Info Sekolah + tab Landing Page. Kunci: NPSN wajib 8 digit (KP-1.6). */
export function InfoSekolahPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState<'sekolah' | 'landing'>('sekolah')
  const [nilai, setNilai] = useState<FormSekolah>(KOSONG)
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [logo, setLogo] = useState<{ kiri?: File; kanan?: File; favicon?: File; hero?: File }>({})

  const landing = useQuery({
    queryKey: ['pengaturan', 'landing'],
    queryFn: () => get<{ data: { landing_aktif: boolean; landing_judul_hero: string | null; landing_tampilkan_peta: boolean; landing_tampilkan_pengumuman: boolean } }>('/pengaturan/landing'),
  })

  const [nilaiLanding, setNilaiLanding] = useState({
    landing_aktif: true, landing_judul_hero: '', landing_tampilkan_peta: true, landing_tampilkan_pengumuman: true,
  })

  const sekolah = useQuery({
    queryKey: ['pengaturan', 'sekolah'],
    queryFn: () => get<{ data: ProfilSekolah }>('/pengaturan/sekolah'),
  })

  useEffect(() => {
    const s = sekolah.data?.data
    if (!s) return
    setNilai({
      nama_sekolah: s.nama_sekolah ?? '', npsn: s.npsn ?? '', status_sekolah: s.status_sekolah ?? '',
      akreditasi: s.akreditasi ?? '', tagline: s.tagline ?? '', tentang: s.tentang ?? '', visi: s.visi ?? '',
      misi: s.misi ?? '', nama_kepala_sekolah: s.nama_kepala_sekolah ?? '', nip_kepala_sekolah: s.nip_kepala_sekolah ?? '',
      alamat_jalan: s.alamat_jalan ?? '', dusun: s.dusun ?? '', desa_kelurahan: s.desa_kelurahan ?? '',
      kecamatan: s.kecamatan ?? '', kabupaten_kota: s.kabupaten_kota ?? '', provinsi: s.provinsi ?? '',
      kode_pos: s.kode_pos ?? '', telepon: s.telepon ?? '', email: s.email ?? '', website: s.website ?? '',
      instagram: s.media_sosial?.instagram ?? '', facebook: s.media_sosial?.facebook ?? '',
      youtube: s.media_sosial?.youtube ?? '', tiktok: s.media_sosial?.tiktok ?? '',
      x: s.media_sosial?.x ?? '', whatsapp: s.media_sosial?.whatsapp ?? '',
      latitude: s.koordinat ? String(s.koordinat.latitude) : '',
      longitude: s.koordinat ? String(s.koordinat.longitude) : '',
    })
  }, [sekolah.data])

  useEffect(() => {
    const l = landing.data?.data
    if (!l) return
    setNilaiLanding({
      landing_aktif: l.landing_aktif, landing_judul_hero: l.landing_judul_hero ?? '',
      landing_tampilkan_peta: l.landing_tampilkan_peta, landing_tampilkan_pengumuman: l.landing_tampilkan_pengumuman,
    })
  }, [landing.data])

  const simpan = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.append('nama_sekolah', nilai.nama_sekolah)
      form.append('npsn', nilai.npsn)
      form.append('nama_kepala_sekolah', nilai.nama_kepala_sekolah)
      ;(['status_sekolah', 'akreditasi', 'tagline', 'tentang', 'visi', 'misi', 'nip_kepala_sekolah',
        'alamat_jalan', 'dusun', 'desa_kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi', 'kode_pos',
        'telepon', 'email', 'website', 'latitude', 'longitude'] as const).forEach((k) => {
        if (nilai[k] !== '') form.append(k, nilai[k])
      })
      ;(['instagram', 'facebook', 'youtube', 'tiktok', 'x', 'whatsapp'] as const).forEach((k) => {
        if (nilai[k] !== '') form.append(`media_sosial[${k}]`, nilai[k])
      })
      if (logo.kiri) form.append('logo_kiri', logo.kiri)
      if (logo.kanan) form.append('logo_kanan', logo.kanan)
      if (logo.favicon) form.append('favicon', logo.favicon)
      if (logo.hero) form.append('hero_foto', logo.hero)

      return post('/pengaturan/sekolah', form)
    },
    onSuccess: () => {
      toast.sukses('Info Sekolah disimpan.')
      setGalat({})
      void qc.invalidateQueries({ queryKey: ['pengaturan', 'sekolah'] })
      void qc.invalidateQueries({ queryKey: ['publik', 'sekolah'] })
    },
    onError: (e) => { setGalat(pesanPerBidang(e)); toast.gagal(pesanError(e)) },
  })

  const simpanLanding = useMutation({
    mutationFn: () => put('/pengaturan/landing', nilaiLanding),
    onSuccess: () => { toast.sukses('Pengaturan Landing Page disimpan.'); void qc.invalidateQueries({ queryKey: ['publik', 'sekolah'] }) },
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const jadikanPenandatangan = useMutation({
    mutationFn: () => post<{ message: string }>('/pengaturan/sekolah/penandatangan-default'),
    onSuccess: (h) => toast.sukses(h.message),
    onError: (e) => toast.gagal(pesanError(e)),
  })

  const isi = (k: keyof FormSekolah) => (v: string) => setNilai((s) => ({ ...s, [k]: v }))

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Info Sekolah"
        keterangan="Data ini menjadi sumber kop laporan, landing page, dan layar TV."
        aksi={
          tab === 'sekolah' ? (
            <>
              <Button varian="secondary" memuat={jadikanPenandatangan.isPending}
                onClick={() => jadikanPenandatangan.mutate()}>
                <BadgeCheck size={17} /> Jadikan Penandatangan Default
              </Button>
              <Button memuat={simpan.isPending} onClick={() => simpan.mutate()}>
                <Save size={17} /> Simpan
              </Button>
            </>
          ) : (
            <Button memuat={simpanLanding.isPending} onClick={() => simpanLanding.mutate()}>
              <Save size={17} /> Simpan Landing
            </Button>
          )
        }
      />

      <div className="flex gap-1 rounded-control bg-surface p-1 shadow-card" role="tablist">
        {([['sekolah', 'Info Sekolah'], ['landing', 'Landing Page']] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn('flex-1 rounded-[13px] px-4 py-2.5 text-sm font-bold transition-colors',
              tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-app-soft')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'sekolah' && (
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-strong">
              <Building2 size={18} /> Identitas Sekolah
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <BidangTeks label="Nama Sekolah" id="nama_sekolah" wajib nilai={nilai.nama_sekolah}
                pesanError={galat.nama_sekolah} onUbah={isi('nama_sekolah')} />
              <BidangTeks label="NPSN" id="npsn" wajib nilai={nilai.npsn} pesanError={galat.npsn}
                petunjuk="Tepat 8 digit angka." onUbah={(v) => isi('npsn')(v.replace(/\D/g, ''))} />
              <BidangTeks label="Nama Kepala Sekolah" id="kepsek" wajib nilai={nilai.nama_kepala_sekolah}
                pesanError={galat.nama_kepala_sekolah} onUbah={isi('nama_kepala_sekolah')} />
              <BidangTeks label="NIP Kepala Sekolah" id="nip_kepsek" nilai={nilai.nip_kepala_sekolah}
                pesanError={galat.nip_kepala_sekolah} onUbah={isi('nip_kepala_sekolah')} />
              <BidangTeks label="Status Sekolah" id="status_sekolah" nilai={nilai.status_sekolah}
                pesanError={galat.status_sekolah} placeholder="negeri / swasta" onUbah={isi('status_sekolah')} />
              <BidangTeks label="Akreditasi" id="akreditasi" nilai={nilai.akreditasi}
                pesanError={galat.akreditasi} onUbah={isi('akreditasi')} />
              <BidangTeks label="Tagline" id="tagline" nilai={nilai.tagline} pesanError={galat.tagline}
                className="sm:col-span-2" onUbah={isi('tagline')} />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold text-strong">Alamat</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <BidangTeks label="Jalan & Nomor" id="alamat_jalan" nilai={nilai.alamat_jalan}
                pesanError={galat.alamat_jalan} className="sm:col-span-2" onUbah={isi('alamat_jalan')} />
              <BidangTeks label="Dusun" id="dusun" nilai={nilai.dusun} pesanError={galat.dusun} onUbah={isi('dusun')} />
              <BidangTeks label="Desa / Kelurahan" id="desa" nilai={nilai.desa_kelurahan}
                pesanError={galat.desa_kelurahan} onUbah={isi('desa_kelurahan')} />
              <BidangTeks label="Kecamatan" id="kecamatan" nilai={nilai.kecamatan}
                pesanError={galat.kecamatan} onUbah={isi('kecamatan')} />
              <BidangTeks label="Kabupaten / Kota" id="kabupaten" nilai={nilai.kabupaten_kota}
                pesanError={galat.kabupaten_kota} onUbah={isi('kabupaten_kota')} />
              <BidangTeks label="Provinsi" id="provinsi" nilai={nilai.provinsi}
                pesanError={galat.provinsi} onUbah={isi('provinsi')} />
              <BidangTeks label="Kode Pos" id="kode_pos" nilai={nilai.kode_pos}
                pesanError={galat.kode_pos} onUbah={isi('kode_pos')} />
              <BidangTeks label="Telepon" id="telepon" tipe="tel" nilai={nilai.telepon}
                pesanError={galat.telepon} onUbah={isi('telepon')} />
              <BidangTeks label="Email" id="email" tipe="email" nilai={nilai.email}
                pesanError={galat.email} onUbah={isi('email')} />
              <BidangTeks label="Website" id="website" nilai={nilai.website} pesanError={galat.website}
                placeholder="https://" onUbah={isi('website')} />
              <BidangTeks label="Latitude" id="latitude" nilai={nilai.latitude} pesanError={galat.latitude}
                placeholder="-8.1234567" onUbah={isi('latitude')} />
              <BidangTeks label="Longitude" id="longitude" nilai={nilai.longitude} pesanError={galat.longitude}
                placeholder="112.1234567" onUbah={isi('longitude')} />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold text-strong">Media Sosial</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(['instagram', 'facebook', 'youtube', 'tiktok', 'x', 'whatsapp'] as const).map((k) => (
                <BidangTeks key={k} label={k[0].toUpperCase() + k.slice(1)} id={`sos-${k}`}
                  nilai={nilai[k]} pesanError={galat[`media_sosial.${k}`]} placeholder="https://"
                  onUbah={isi(k)} />
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-strong">
              <ImageIcon size={18} /> Logo & Foto
            </h2>
            <p className="mt-1 text-xs text-muted">Maksimal 1 MB sebelum dikompres; hasil akhir di bawah 300 KB.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {([['kiri', 'Logo Utama (kiri kop)'], ['kanan', 'Logo Kedua (kanan kop)'], ['favicon', 'Favicon'], ['hero', 'Foto Sampul']] as const).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-strong">{label}</span>
                  <input type="file" accept="image/*"
                    onChange={(e) => setLogo((s) => ({ ...s, [k]: e.target.files?.[0] }))}
                    className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-strong" />
                </label>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold text-strong">Tentang, Visi & Misi</h2>
            <div className="mt-4 space-y-4">
              {([['tentang', 'Tentang Sekolah'], ['visi', 'Visi'], ['misi', 'Misi']] as const).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-strong">{label}</span>
                  <textarea rows={3} value={nilai[k]} onChange={(e) => isi(k)(e.target.value)}
                    className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm text-strong" />
                </label>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'landing' && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-strong">
            <Megaphone size={18} /> Pengaturan Landing Page
          </h2>
          <p className="mt-1 text-xs text-muted">
            Halaman publik tanpa login. Landing tidak pernah menampilkan data pegawai, siswa, atau kehadiran (BR-34).
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-strong">
              <input type="checkbox" checked={nilaiLanding.landing_aktif}
                onChange={(e) => setNilaiLanding((s) => ({ ...s, landing_aktif: e.target.checked }))} />
              Aktifkan landing page
            </label>

            <BidangTeks label="Judul Hero" id="judul_hero" nilai={nilaiLanding.landing_judul_hero}
              petunjuk="Bila dikosongkan: “SIPANDU — Presensi & Jurnal Digital {nama sekolah}”."
              onUbah={(v) => setNilaiLanding((s) => ({ ...s, landing_judul_hero: v }))} />

            <label className="flex items-center gap-2 text-sm font-semibold text-strong">
              <input type="checkbox" checked={nilaiLanding.landing_tampilkan_peta}
                onChange={(e) => setNilaiLanding((s) => ({ ...s, landing_tampilkan_peta: e.target.checked }))} />
              Tampilkan peta lokasi sekolah
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-strong">
              <input type="checkbox" checked={nilaiLanding.landing_tampilkan_pengumuman}
                onChange={(e) => setNilaiLanding((s) => ({ ...s, landing_tampilkan_pengumuman: e.target.checked }))} />
              Tampilkan pengumuman terbaru
            </label>
          </div>
        </section>
      )}
    </div>
  )
}
