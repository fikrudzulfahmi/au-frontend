import { cn } from '@/lib/cn'

interface FormFieldProps {
  label: string
  htmlFor?: string
  wajib?: boolean
  pesanError?: string
  petunjuk?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  wajib,
  pesanError,
  petunjuk,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-strong">
        {label}
        {wajib && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {petunjuk && !pesanError && <p className="text-xs text-muted">{petunjuk}</p>}
      {pesanError && <p className="text-xs font-medium text-danger">{pesanError}</p>}
    </div>
  )
}

export const kelasInput =
  'w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm text-strong placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:bg-app-soft disabled:text-muted'
