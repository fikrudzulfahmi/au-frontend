import {
  labelPeriode,
  OPSI_PERIODE,
  paramsPeriode,
  periodeAwal,
  rentangSiap,
  tanggalHariIni,
} from './periode'

/**
 * 5.14 — periode laporan: nilai `periode` diserahkan ke server (hitung sendiri),
 * hanya rentang yang mengirim `dari`/`sampai`.
 */
describe('periode laporan', () => {
  it('memakai nilai periode yang dikenal server', () => {
    expect(OPSI_PERIODE.map((o) => o.nilai)).toEqual([
      'bulan_ini',
      'minggu_ini',
      'hari_ini',
      'rentang',
    ])
  })

  it('memulai dari bulan berjalan', () => {
    expect(periodeAwal()).toEqual({ periode: 'bulan_ini', dari: '', sampai: '' })
  })

  it('hanya mengirim periode pada mode non-rentang', () => {
    expect(paramsPeriode({ periode: 'minggu_ini', dari: '2026-10-01', sampai: '2026-10-06' })).toEqual(
      { periode: 'minggu_ini' },
    )
    expect(paramsPeriode(periodeAwal('hari_ini'))).toEqual({ periode: 'hari_ini' })
  })

  it('mengirim dari & sampai hanya pada mode rentang', () => {
    expect(paramsPeriode({ periode: 'rentang', dari: '2026-10-01', sampai: '2026-10-06' })).toEqual({
      periode: 'rentang',
      dari: '2026-10-01',
      sampai: '2026-10-06',
    })
  })

  it('tidak mengirim tanggal kosong pada rentang', () => {
    expect(paramsPeriode({ periode: 'rentang', dari: '2026-10-01', sampai: '' })).toEqual({
      periode: 'rentang',
      dari: '2026-10-01',
    })
  })

  it('menyatakan rentang siap hanya bila kedua tanggal terisi', () => {
    expect(rentangSiap(periodeAwal('bulan_ini'))).toBe(true)
    expect(rentangSiap({ periode: 'rentang', dari: '2026-10-01', sampai: '' })).toBe(false)
    expect(rentangSiap({ periode: 'rentang', dari: '2026-10-01', sampai: '2026-10-06' })).toBe(true)
  })

  it('menyusun label periode yang dapat dibaca', () => {
    expect(labelPeriode(periodeAwal('bulan_ini'))).toBe('Bulan Ini')
    expect(labelPeriode({ periode: 'rentang', dari: '', sampai: '' })).toBe(
      'Rentang Tanggal (belum lengkap)',
    )
    expect(labelPeriode({ periode: 'rentang', dari: '2026-10-01', sampai: '2026-10-06' })).toBe(
      '2026-10-01 s.d. 2026-10-06',
    )
  })

  it('memberi tanggal hari ini dalam bentuk YYYY-MM-DD lokal', () => {
    // Bukan toISOString: pada zona positif hasilnya akan bergeser sehari.
    expect(tanggalHariIni()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(tanggalHariIni()).toBe(tanggalHariIni())
  })
})
