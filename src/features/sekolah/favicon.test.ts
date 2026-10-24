import { describe, expect, it } from 'vitest'

import { pasangFavicon } from './favicon'

function dokumenUji(): Document {
  const doc = document.implementation.createHTMLDocument('uji')
  const ikon = doc.createElement('link')
  ikon.rel = 'icon'
  ikon.type = 'image/png'
  ikon.href = '/icons/favicon-64.png'
  doc.head.appendChild(ikon)
  return doc
}

describe('pasangFavicon', () => {
  it('mengganti favicon statis dengan gambar dari server', () => {
    const doc = dokumenUji()

    pasangFavicon('https://api.contoh/api/v1/publik/sekolah/berkas/favicon?v=abc123', doc)

    const ikon = doc.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
    expect(ikon?.href).toBe('https://api.contoh/api/v1/publik/sekolah/berkas/favicon?v=abc123')
    // type lama (image/png) harus hilang karena berkas unggahan berupa JPEG.
    expect(ikon?.hasAttribute('type')).toBe(false)
  })

  it('membuat tautan icon & apple-touch-icon bila belum ada', () => {
    const doc = document.implementation.createHTMLDocument('kosong')

    pasangFavicon('/api/v1/publik/sekolah/berkas/favicon?v=1', doc)

    expect(doc.head.querySelectorAll('link[rel="icon"]')).toHaveLength(1)
    expect(doc.head.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe(
      '/api/v1/publik/sekolah/berkas/favicon?v=1',
    )
  })

  it('tidak menyentuh favicon statis bila sekolah belum punya favicon', () => {
    const doc = dokumenUji()

    pasangFavicon(null, doc)

    expect(doc.head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/icons/favicon-64.png')
  })
})
