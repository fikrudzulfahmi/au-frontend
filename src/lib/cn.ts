export type ClassValue = string | false | null | undefined

/** Penggabung kelas sederhana (pengganti clsx). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
