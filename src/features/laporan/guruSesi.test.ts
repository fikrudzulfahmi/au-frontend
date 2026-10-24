import { describe, expect, it } from 'vitest'
import { keteranganGuru } from './guruSesi'

describe('keteranganGuru', () => {
  it('memakai teks gabungan dari server saat sesi diisi guru piket', () => {
    expect(
      keteranganGuru({
        guru: 'Ahmad Fauzi',
        guru_keterangan: 'Ahmad Fauzi (diisi guru piket: Budi)',
      }),
    ).toBe('Ahmad Fauzi (diisi guru piket: Budi)')
  })

  it('kembali ke nama pengampu bila server tidak mengirim keterangan', () => {
    expect(keteranganGuru({ guru: 'Ahmad Fauzi' })).toBe('Ahmad Fauzi')
    expect(keteranganGuru({ guru: 'Ahmad Fauzi', guru_keterangan: '   ' })).toBe('Ahmad Fauzi')
  })
})
