/**
 * FR-PRS-08 / BR-29 — foto presensi dikompres di sisi klien sebelum dikirim.
 *
 * Server tetap mengompres dan memberi watermark; kompresi di sini hanya agar
 * pengiriman hemat kuota (jaringan sekolah sering lambat).
 */

export interface HasilKompres {
  berkas: File
  lebar: number
  tinggi: number
  byte: number
}

/** Menggambar sumber ke kanvas, diperkecil agar sisi terpanjang <= sisiMaks. */
async function keKanvas(sumber: CanvasImageSource, lebarAsal: number, tinggiAsal: number, sisiMaks: number, mutar = 0) {
  const skala = Math.min(1, sisiMaks / Math.max(lebarAsal, tinggiAsal))
  const lebar = Math.round(lebarAsal * skala)
  const tinggi = Math.round(tinggiAsal * skala)

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
 * Mengompres foto hingga di bawah `targetKb`, lalu mengembalikannya sebagai File
 * agar dapat dikirim sebagai multipart.
 */
export async function kompresFoto(
  sumber: Blob,
  opsi: { sisiMaks?: number; targetKb?: number; nama?: string } = {},
): Promise<HasilKompres> {
  const sisiMaks = opsi.sisiMaks ?? 800
  const targetByte = (opsi.targetKb ?? 150) * 1024

  const bitmap = await createImageBitmap(sumber)

  let kualitas = 0.75
  let hasil = await keKanvas(bitmap, bitmap.width, bitmap.height, sisiMaks)
  let blob = await keBlob(hasil.kanvas, kualitas)

  // Turunkan kualitas dulu, lalu perkecil dimensi bila masih melebihi target.
  let skala = 0.85
  while (blob.size > targetByte && skala > 0.4) {
    const calon = await keKanvas(bitmap, bitmap.width, bitmap.height, Math.round(sisiMaks * skala))
    const calonBlob = await keBlob(calon.kanvas, 0.6)

    if (calonBlob.size < blob.size) {
      hasil = calon
      blob = calonBlob
      kualitas = 0.6
    }

    skala -= 0.15
  }

  const nama = opsi.nama ?? `presensi-${Date.now()}.jpg`

  return {
    berkas: new File([blob], nama, { type: 'image/jpeg' }),
    lebar: hasil.lebar,
    tinggi: hasil.tinggi,
    byte: blob.size,
  }
}
