import { FormField, kelasInput } from './FormField'
import { cn } from '@/lib/cn'

interface Opsi {
  nilai: string | number
  label: string
}

interface PilihanProps {
  label: string
  id: string
  nilai: string | number | ''
  onUbah: (nilai: string) => void
  opsi: Opsi[]
  wajib?: boolean
  pesanError?: string
  kosongLabel?: string
  petunjuk?: string
  className?: string
}

/** Bidang pilihan (select) dengan gaya yang sama seperti bidang teks. */
export function BidangPilihan({
  label,
  id,
  nilai,
  onUbah,
  opsi,
  wajib,
  pesanError,
  kosongLabel = '— Pilih —',
  petunjuk,
  className,
}: PilihanProps) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      wajib={wajib}
      pesanError={pesanError}
      petunjuk={petunjuk}
      className={className}
    >
      <select
        id={id}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        className={cn(kelasInput, 'appearance-none')}
      >
        <option value="">{kosongLabel}</option>
        {opsi.map((o) => (
          <option key={o.nilai} value={o.nilai}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

interface TeksProps {
  label: string
  id: string
  nilai: string | number
  onUbah: (nilai: string) => void
  tipe?: 'text' | 'date' | 'time' | 'email' | 'number' | 'password' | 'tel'
  wajib?: boolean
  pesanError?: string
  petunjuk?: string
  placeholder?: string
  className?: string
  readOnly?: boolean
}

/** Bidang teks bertipe. */
export function BidangTeks({
  label,
  id,
  nilai,
  onUbah,
  tipe = 'text',
  wajib,
  pesanError,
  petunjuk,
  placeholder,
  className,
  readOnly,
}: TeksProps) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      wajib={wajib}
      pesanError={pesanError}
      petunjuk={petunjuk}
      className={className}
    >
      <input
        id={id}
        type={tipe}
        value={nilai}
        readOnly={readOnly}
        onChange={(e) => onUbah(e.target.value)}
        placeholder={placeholder}
        className={cn(kelasInput, (tipe === 'date' || tipe === 'time') && 'tnum')}
      />
    </FormField>
  )
}
