import { cn } from '@/lib/cn'

interface GaugeMenitKerjaProps {
  /** X — menit kerja berjalan (A-20). */
  berjalan: number
  /** Y — durasi jam kerja hari ini (jam_pulang − jam_masuk). */
  target: number
  className?: string
}

function titik(cx: number, cy: number, r: number, derajat: number): [number, number] {
  const rad = (derajat * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
}

function busur(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const [x1, y1] = titik(cx, cy, r, a1)
  const [x2, y2] = titik(cx, cy, r, a2)
  const besar = Math.abs(a2 - a1) > 180 ? 1 : 0
  const arah = a1 > a2 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${besar} ${arah} ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

const SEGMEN = 16
const CELAH = 2.2

/**
 * FR-UI-06 / A-20 — gauge setengah lingkaran bersegmen berisi persentase besar
 * dan teks `X / Y` serta label "Menit Kerja".
 */
export function GaugeMenitKerja({ berjalan, target, className }: GaugeMenitKerjaProps) {
  const persentase = target > 0 ? Math.max(0, Math.min(100, (berjalan / target) * 100)) : 0

  const lebar = 132
  const tinggi = lebar / 2 + 16
  const cx = lebar / 2
  const cy = lebar / 2 + 6
  const r = lebar / 2 - 12
  const lebarBusur = 180 / SEGMEN

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: lebar, height: tinggi }}>
        <svg width={lebar} height={tinggi} viewBox={`0 0 ${lebar} ${tinggi}`}>
          {Array.from({ length: SEGMEN }).map((_, i) => {
            const a1 = 180 - i * lebarBusur
            const a2 = a1 - lebarBusur + CELAH
            const aktif = target > 0 && (i + 0.5) / SEGMEN <= persentase / 100
            return (
              <path
                key={i}
                d={busur(cx, cy, r, a1, a2)}
                stroke={aktif ? 'var(--color-primary)' : 'var(--color-app)'}
                strokeWidth={9}
                strokeLinecap="round"
                fill="none"
              />
            )
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="tnum text-2xl font-extrabold leading-none text-strong">
            {Math.round(persentase)}%
          </span>
          <span className="tnum mt-0.5 text-[11px] font-semibold text-muted">
            {berjalan} / {target}
          </span>
        </div>
      </div>
      <span className="mt-1 text-xs font-semibold text-muted">Menit Kerja</span>
    </div>
  )
}
