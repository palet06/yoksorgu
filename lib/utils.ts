import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Istanbul",
  })
}

export function parseIdentityNumbers(text: string): string[] {
  if (!text.trim()) return []

  // Split by various delimiters and clean up
  const numbers = text
    .split(/[\n,;\s]+/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0)
    .filter((num) => /^\d{11}$/.test(num)) // Only valid 11-digit numbers

  // Remove duplicates
  return [...new Set(numbers)]
}
