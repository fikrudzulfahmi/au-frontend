/**
 * FR-PRS-08 / BR-29 — foto dikompres di sisi klien sebelum dikirim.
 *
 * Foto asal boleh berukuran berapa pun (kamera ponsel 3–12 MB, hasil pindai,
 * tangkapan layar besar): semuanya diperkecil dan diturunkan kualitasnya sampai
 * masuk batas dari menu Pengaturan Sistem (`foto_max_sisi_px`,
 * `foto_kualitas_jpeg`, `foto_target_maks_kb`). Setelan itu jadi batas hasil
 * kompresi, bukan alasan menolak unggahan.
 *
 * Server tetap mengompres dan memberi watermark; kompresi di sini menjaga
 * pengiriman hemat kuota (jaringan sekolah sering lambat).
 */

export interface HasilKompres {
  berkas: File
  lebar: number
  tinggi: number
  byte: number
}

export interface OpsiKompres {
  /** Sisi terpanjang hasil kompres (piksel). */
  sisiMaks?: number
  /** Batas ukuran berkas hasil kompres (KB). */
  targetKb?: number
  /** Kualitas JPEG awal 30–95; diturunkan otomatis bila masih terlalu besar. */
  kualitas?: number
  nama?: string
}

/** Dimensi terkecil yang masih layak; di bawah ini foto tak lagi terbaca. */
const SISI_MINIMUM = 240

function batasi(nilai: number, minimal: number, maksimal: number): number {
  return Math.min(maksimal, Math.max(minimal, Math.round(nilai)))
}

/** Menggambar sumber ke kanvas, diperkecil agar sisi terpanjang <= sisiMaks. */
async function keKanvas(sumber: CanvasImageSource, lebarAsal: number, tinggiAsal: number, sisiMaks: number, mutar = 0) {
  const skala = Math.min(1, sisiMaks / Math.max(lebarAsal, tinggiAsal))
  const lebar = Math.max(1, Math.round(lebarAsal * skala))
  const tinggi = Math.max(1, Math.round(tinggiAsal * skala))

  const kanvas = document.createElement('canvas')
  const seperempat = mutar % 180 !== 0
  kanvas.width = seperempat ? tinggi : lebar
  kanvas.height = seperempat ? lebar : tinggi

  const konteks = kanvas.getContext('2d')
  if (konteks === null) throw new Error('Kanvas tidak tersedia pada peramban ini.')

  konteks.translate(kanvas.width / 2, kanvas.height / 2)
  if (mutar !== 0) konteks.rotate((mutar * Math.PI) / 180)
  konteks.drawImage(sumber, -lebar / 2, -tinggi / 2, lebar, tinggi)

  return { kanvas, lebar, tinggi }
}

function keBlob(kanvas: HTMLCanvasElement, kualitas: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    kanvas.toBlob(
      (blob) => (blob === null ? reject(new Error('Gagal mengompres foto.')) : resolve(blob)),
      'image/jpeg',
      kualitas,
    )
  })
}

/**
 * Mendekode berkas menjadi gambar yang bisa digambar ke kanvas.
 *
 * `createImageBitmap` tercepat, tetapi tidak ada di peramban lama dan menolak
 * sebagian format (mis. HEIC). Jalur cadangan memakai `<img>`, sehingga berkas
 * yang bisa ditampilkan peramban tetap bisa dikompres.
 */
async function dekode(sumber: Blob): Promise<{
  gambar: CanvasImageSource
  lebar: number
  tinggi: number
  bersihkan: () => void
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(sumber)

      return { gambar: bitmap, lebar: bitmap.width, tinggi: bitmap.height, bersihkan: () => bitmap.close() }
    } catch {
      // Lanjut ke <img> di bawah.
    }
  }

  const url = URL.createObjectURL(sumber)

  try {
    const gambar = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('FORMAT_TIDAK_DIDUKUNG'))
      el.src = url
    })

    return {
      gambar,
      lebar: gambar.naturalWidth,
      tinggi: gambar.naturalHeight,
      bersihkan: () => URL.revokeObjectURL(url),
    }
  } catch (galat) {
    URL.revokeObjectURL(url)
    throw galat
  }
}

/**
 * Mengompres foto hingga di bawah `targetKb`, lalu mengembalikannya sebagai File
 * agar dapat dikirim sebagai multipart. Ukuran asal tidak dibatasi.
 */
export async function kompresFoto(sumber: Blob, opsi: OpsiKompres = {}): Promise<HasilKompres> {
  const sisiMaks = batasi(opsi.sisiMaks ?? 800, SISI_MINIMUM, 4000)
  const targetByte = batasi(opsi.targetKb ?? 150, 20, 4096) * 1024
  const kualitasAwal = batasi(opsi.kualitas ?? 72, 30, 95) / 100

  const { gambar, lebar, tinggi, bersihkan } = await dekode(sumber)

  try {
    let kualitas = kualitasAwal
    let hasil = await keKanvas(gambar, lebar, tinggi, sisiMaks)
    let blob = await keBlob(hasil.kanvas, kualitas)

    // 1) Turunkan kualitas sedikit demi sedikit.
    while (blob.size > targetByte && kualitas > 0.42) {
      kualitas = Math.max(0.4, Number((kualitas - 0.1).toFixed(2)))
      blob = await keBlob(hasil.kanvas, kualitas)
    }

    // 2) Masih terlalu besar: perkecil dimensi 15% per langkah sampai batas layak.
    let sisi = Math.min(sisiMaks, Math.max(hasil.lebar, hasil.tinggi))

    while (blob.size > targetByte && sisi > SISI_MINIMUM) {
      sisi = Math.max(SISI_MINIMUM, Math.round(sisi * 0.85))
      hasil = await keKanvas(gambar, lebar, tinggi, sisi)
      blob = await keBlob(hasil.kanvas, Math.min(kualitas, 0.6))
    }

    const nama = opsi.nama ?? `foto-${Date.now()}.jpg`

    return {
      berkas: new File([blob], nama, { type: 'image/jpeg' }),
      lebar: hasil.lebar,
      tinggi: hasil.tinggi,
      byte: blob.size,
    }
  } finally {
    bersihkan()
  }
}
