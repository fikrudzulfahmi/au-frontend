import { describe, expect, it, vi } from 'vitest'

import { pasangIkonLeaflet } from './ikonLeaflet'

describe('pasangIkonLeaflet', () => {
  it('mengarahkan ikon penanda ke berkas hasil bundel, bukan path relatif CSS', () => {
    const mergeOptions = vi.fn()

    pasangIkonLeaflet({ Icon: { Default: { mergeOptions } } } as never)

    expect(mergeOptions).toHaveBeenCalledTimes(1)
    const opsi = mergeOptions.mock.calls[0][0]
    // Vite memberi URL ber-hash di /assets/ atau data URI (gambar kecil di-inline).
    // Yang penting BUKAN path relatif polos seperti 'marker-icon.png' — path itu yang
    // jatuh ke root situs, dijawab index.html, dan berakhir 415 di hosting.
    for (const url of [opsi.iconUrl, opsi.iconRetinaUrl, opsi.shadowUrl]) {
      expect(String(url)).toMatch(/\.png$|^data:image\/png/)
      expect(String(url)).not.toMatch(/^(images\/)?marker-/)
    }
    expect(String(opsi.iconUrl)).not.toMatch(/^(images\/)?marker-icon\.png$/)
  })

  it('tidak melempar saat modul leaflet dipalsukan tanpa Icon', () => {
    expect(() => pasangIkonLeaflet({} as never)).not.toThrow()
    expect(() => pasangIkonLeaflet({ Icon: {} } as never)).not.toThrow()
  })
})
