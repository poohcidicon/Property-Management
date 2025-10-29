import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBuddhist(date: Date, pattern: string = 'd MMMM yyyy'): string {
  const formatted = format(date, pattern, { locale: th })
  return formatted.replace(/\d{4}$/, (year) => String(parseInt(year) + 543))
}
