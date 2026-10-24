import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Peta presensi memuat tile dari server luar. Bila CSP produksi hanya
 * mengizinkan origin sendiri, browser memblokir setiap tile dan peta tampil
 * abu-abu tanpa pesan galat di UI — jadi daftar host tile diuji di sini.
 */
// Vitest dijalankan dari akar repo, jadi path relatif ini selalu menunjuk berkas asli.
const htaccess = readFileSync(join(process.cwd(), 'public', '.htaccess'), 'utf8')

const csp = /Content-Security-Policy "([^"]+)"/.exec(htaccess)?.[1] ?? ''
const direktif = csp
  .split(';')
  .map((bagian) => bagian.trim())
  .find((bagian) => bagian.startsWith('img-src')) ?? ''

describe('CSP mengizinkan tile peta', () => {
  it('img-src memuat server tile citra satelit dan jalan', () => {
    expect(csp).not.toBe('')
    expect(direktif).toContain('https://server.arcgisonline.com')
    expect(direktif).toContain('tile.openstreetmap.org')
  })
})
