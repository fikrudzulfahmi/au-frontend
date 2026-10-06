import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GaugeMenitKerja } from './GaugeMenitKerja'
import { PresensiKinerjaCard } from './PresensiKinerjaCard'
import { ProgressRing } from './ProgressRing'

/**
 * FR-UI-06 / A-20 — gauge menit kerja: persentase besar, teks X / Y, dan label.
 */
describe('GaugeMenitKerja', () => {
  it('menampilkan persentase dan perbandingan menit kerja', () => {
    render(<GaugeMenitKerja berjalan={114} target={300} />)

    expect(screen.getByText('38%')).toBeDefined()
    expect(screen.getByText('114 / 300')).toBeDefined()
    expect(screen.getByText('Menit Kerja')).toBeDefined()
  })

  it('tidak membagi dengan nol saat target 0', () => {
    render(<GaugeMenitKerja berjalan={0} target={0} />)

    expect(screen.getByText('0%')).toBeDefined()
    expect(screen.getByText('0 / 0')).toBeDefined()
  })

  it('membatasi persentase pada 100%', () => {
    render(<GaugeMenitKerja berjalan={500} target={300} />)

    expect(screen.getByText('100%')).toBeDefined()
  })
})

describe('PresensiKinerjaCard', () => {
  it('menampilkan jam datang, jam pulang, lencana, dan tanggal panjang', () => {
    render(
      <PresensiKinerjaCard
        tanggal={new Date(2026, 6, 6, 10, 26, 8)}
        data={{
          jamDatang: '07:01:12',
          jamPulang: null,
          menitKerja: 114,
          menitKerjaTarget: 300,
          lencana: 'TERLAMBAT',
          lencanaVarian: 'peringatan',
        }}
      />,
    )

    expect(screen.getByText('07:01:12')).toBeDefined()
    expect(screen.getByText('00:00:00')).toBeDefined()
    expect(screen.getByText('TERLAMBAT')).toBeDefined()
    expect(screen.getByText('Jam Datang')).toBeDefined()
    expect(screen.getByText('Jam Pulang')).toBeDefined()
    expect(screen.getByText(/Senin, 6 Juli 2026/)).toBeDefined()
  })
})

describe('ProgressRing', () => {
  it('membulatkan nilai ke rentang 0–100', () => {
    const { container } = render(
      <ProgressRing nilai={140}>
        <span>140</span>
      </ProgressRing>,
    )

    const lingkaran = container.querySelectorAll('circle')
    expect(lingkaran).toHaveLength(2)
  })
})
