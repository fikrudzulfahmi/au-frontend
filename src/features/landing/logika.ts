/** 5.21 / FR-LND-05,07 — aturan tampil bagian landing (BR-34). */

export interface PengaturanLanding {
  aktif: boolean
  judul_hero: string | null
  tampilkan_peta: boolean
  tampilkan_pengumuman: boolean
}

export function landingAktif(cfg: PengaturanLanding | undefined | null): boolean {
  return cfg?.aktif !== false
}

/** FR-LND-05 — bagian pengumuman hanya tampil bila diizinkan dan ada isinya. */
export function tampilkanPengumumanLanding(
  cfg: PengaturanLanding | undefined | null,
  jumlah: number,
): boolean {
  return landingAktif(cfg) && cfg?.tampilkan_pengumuman === true && jumlah > 0
}

/** FR-LND-07 — peta hanya tampil bila diizinkan dan koordinat sekolah tersedia. */
export function tampilkanPetaLanding(
  cfg: PengaturanLanding | undefined | null,
  adaKoordinat: boolean,
): boolean {
  return landingAktif(cfg) && cfg?.tampilkan_peta === true && adaKoordinat
}
