import { openDB, type DBSchema, type IDBPDatabase } from "idb"

export interface Habit {
  id?: number
  name: string
  description: string
  color: string
  createdAt: Date
  targetDays: number[]
  isActive: boolean
}

export interface HabitEntry {
  id?: number
  habitId: number
  date: string
  completed: boolean
  notes?: string
  createdAt: Date
}

interface HabitTrackerDB extends DBSchema {
  habits: {
    key: number
    value: Habit
    indexes: { "by-active": boolean }
  }
  entries: {
    key: number
    value: HabitEntry
    indexes: { "by-habit": number; "by-date": string }
  }
}

class DatabaseManager {
  private db: IDBPDatabase<HabitTrackerDB> | null = null

  async init() {
    this.db = await openDB<HabitTrackerDB>("habit-tracker", 1, {
      upgrade(db) {
        // Create habits store
        const habitStore = db.createObjectStore("habits", {
          keyPath: "id",
          autoIncrement: true,
        })
        habitStore.createIndex("by-active", "isActive")

        // Create entries store
        const entryStore = db.createObjectStore("entries", {
          keyPath: "id",
          autoIncrement: true,
        })
        entryStore.createIndex("by-habit", "habitId")
        entryStore.createIndex("by-date", "date")
      },
    })
  }

  async addHabit(habit: Omit<Habit, "id">): Promise<number> {
    if (!this.db) await this.init()
    return await this.db!.add("habits", habit as Habit)
  }

  async getHabits(): Promise<Habit[]> {
    if (!this.db) await this.init()
    return await this.db!.getAll("habits")
  }

  async getActiveHabits(): Promise<Habit[]> {
    if (!this.db) await this.init()
    return await this.db!.getAllFromIndex("habits", "by-active", true)
  }

  async updateHabit(habit: Habit): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put("habits", habit)
  }

  async deleteHabit(id: number): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.delete("habits", id)
  }

  async addEntry(entry: Omit<HabitEntry, "id">): Promise<number> {
    if (!this.db) await this.init()
    return await this.db!.add("entries", entry as HabitEntry)
  }

  async getEntriesForHabit(habitId: number): Promise<HabitEntry[]> {
    if (!this.db) await this.init()
    return await this.db!.getAllFromIndex("entries", "by-habit", habitId)
  }

  async getEntriesForDate(date: string): Promise<HabitEntry[]> {
    if (!this.db) await this.init()
    return await this.db!.getAllFromIndex("entries", "by-date", date)
  }

  async updateEntry(entry: HabitEntry): Promise<void> {
    if (!this.db) await this.init()
    await this.db!.put("entries", entry)
  }

  async getStreakForHabit(habitId: number): Promise<number> {
    const entries = await this.getEntriesForHabit(habitId)
    const sortedEntries = entries
      .filter((entry) => entry.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let streak = 0
    const today = new Date()

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date)
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === i) {
        streak++
      } else {
        break
      }
    }

    return streak
  }
}

export const db = new DatabaseManager()
