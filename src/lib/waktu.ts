import { useEffect, useRef, useState } from 'react'

import { get } from './api'

/**
 * BR-38 — Jam di UI disinkronkan dengan waktu server (offset dari /waktu-server),
 * bukan jam perangkat.
 */
interface WaktuServerResponse {
  data: {
    waktu: string
    epoch_ms: number
    zona: string
    offset_menit: number
  }
}

interface ServerClockValue {
  /** Selisih jam server terhadap jam perangkat (ms). */
  offsetMs: number
  /** true bila offset sudah berhasil diambil dari server. */
  tersinkron: boolean
  /** Waktu server saat ini. */
  sekarang: Date
}

const REFRESH_MS = 5 * 60 * 1000

export function useServerClock(): ServerClockValue {
  const [offsetMs, setOffsetMs] = useState(0)
  const [tersinkron, setTersinkron] = useState(false)
  const [, forceTick] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    async function sinkron() {
      try {
        const res = await get<WaktuServerResponse>('/waktu-server')
        if (!mounted.current) return
        const serverMs = new Date(res.data.waktu).getTime()
        setOffsetMs(serverMs - Date.now())
        setTersinkron(true)
      } catch {
        // BR-38: bila gagal, UI memakai jam perangkat sebagai cadangan.
        if (mounted.current) setTersinkron(false)
      }
    }

    void sinkron()
    const refresh = window.setInterval(sinkron, REFRESH_MS)
    const tick = window.setInterval(() => forceTick((n) => n + 1), 1000)

    return () => {
      mounted.current = false
      window.clearInterval(refresh)
      window.clearInterval(tick)
    }
  }, [])

  return { offsetMs, tersinkron, sekarang: new Date(Date.now() + offsetMs) }
}
