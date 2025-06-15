import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getDateRange(days: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(formatDate(date))
  }

  return dates
}

export function calculateStreak(entries: { date: string; completed: boolean }[]): number {
  if (!entries || entries.length === 0) return 0

  const sortedEntries = entries
    .filter((entry) => entry && entry.completed === true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedEntries.length === 0) return 0

  let streak = 0
  const today = new Date()

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].date)
    if (isNaN(entryDate.getTime())) continue

    const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === i) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export function getCompletionRate(entries: { completed: boolean }[]): number {
  if (!entries || entries.length === 0) return 0

  const validEntries = entries.filter((entry) => entry && typeof entry.completed === "boolean")
  if (validEntries.length === 0) return 0

  const completed = validEntries.filter((entry) => entry.completed === true).length
  const rate = (completed / validEntries.length) * 100

  return isNaN(rate) ? 0 : Math.round(rate)
}
