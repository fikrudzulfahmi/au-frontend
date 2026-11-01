import { describe, expect, it } from 'vitest'

import { namaDariContentDisposition, pastikanEkstensi } from './unduhan'

/**
 * KP-5.1 — nama berkas ekspor diambil dari header Content-Disposition,
 * sehingga nama yang diunduh sama dengan yang disiapkan server.
 */
describe('namaDariContentDisposition', () => {
  it('membaca nama di antara tanda kutip', () => {
    expect(
      namaDariContentDisposition('attachment; filename="rekap-presensi-pegawai.pdf"'),
    ).toBe('rekap-presensi-pegawai.pdf')
  })

  it('membaca nama tanpa tanda kutip', () => {
    expect(namaDariContentDisposition('attachment; filename=rekap-presensi-pegawai.xlsx')).toBe(
      'rekap-presensi-pegawai.xlsx',
    )
  })

  it('membaca bentuk RFC 5987 (filename*)', () => {
    expect(
      namaDariContentDisposition("attachment; filename*=UTF-8''rekap%20presensi.pdf"),
    ).toBe('rekap presensi.pdf')
  })

  it('memakai nama cadangan bila header kosong atau tanpa filename', () => {
    expect(namaDariContentDisposition(null, 'laporan.pdf')).toBe('laporan.pdf')
    expect(namaDariContentDisposition('inline', 'laporan.pdf')).toBe('laporan.pdf')
    expect(namaDariContentDisposition('attachment; filename=""', 'laporan.pdf')).toBe('laporan.pdf')
  })

  it('tidak melempar galat pada bentuk yang rusak', () => {
    expect(namaDariContentDisposition('attachment; filename*=', 'laporan.pdf')).toBe('laporan.pdf')
  })
})

describe('pastikanEkstensi', () => {
  it('menambahkan ekstensi bila belum ada', () => {
    expect(pastikanEkstensi('rekap-presensi', 'pdf')).toBe('rekap-presensi.pdf')
    expect(pastikanEkstensi('rekap-presensi', '.xlsx')).toBe('rekap-presensi.xlsx')
  })

  it('tidak menggandakan ekstensi', () => {
    expect(pastikanEkstensi('rekap-presensi.PDF', 'pdf')).toBe('rekap-presensi.PDF')
    expect(pastikanEkstensi('rekap-presensi.xlsx', 'xlsx')).toBe('rekap-presensi.xlsx')
  })
})
