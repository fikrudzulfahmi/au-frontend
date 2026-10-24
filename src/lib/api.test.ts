import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * PHP hanya menguraikan `multipart/form-data` pada POST. Sebelum diperbaiki,
 * `put()` mengirim FormData apa adanya sehingga badan permintaan kosong dan
 * server menolak dengan "materi wajib diisi" — form edit jurnal (termasuk oleh
 * guru piket) tidak pernah bisa disimpan.
 */
const { instance } = vi.hoisted(() => ({
  instance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('axios', () => ({ default: { create: () => instance } }))

const { put } = await import('./api')

beforeEach(() => {
  vi.clearAllMocks()
  instance.post.mockResolvedValue({ data: { ok: true } })
  instance.put.mockResolvedValue({ data: { ok: true } })
})

describe('put dengan FormData', () => {
  it('dikirim sebagai POST dengan _method=PUT', async () => {
    const form = new FormData()
    form.append('materi', 'Persamaan linear')

    await put('/jurnal/7', form)

    expect(instance.post).toHaveBeenCalledTimes(1)
    expect(instance.put).not.toHaveBeenCalled()
    expect(instance.post.mock.calls[0][0]).toBe('/jurnal/7')
    expect(form.get('_method')).toBe('PUT')
    expect(form.get('materi')).toBe('Persamaan linear')
  })

  it('tetap memakai PUT biasa untuk badan JSON', async () => {
    const badan = { materi: 'Persamaan linear' }

    await put('/jurnal/7', badan)

    expect(instance.put).toHaveBeenCalledWith('/jurnal/7', badan)
    expect(instance.post).not.toHaveBeenCalled()
  })
})
