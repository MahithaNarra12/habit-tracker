"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BarChart3, Home, Settings, Download } from "lucide-react"
import { HabitCard } from "@/components/habit-card"
import { AddHabitForm } from "@/components/add-habit-form"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { db, type Habit, type HabitEntry } from "@/lib/database"
import { formatDate } from "@/lib/utils"
import { NotificationService } from "@/lib/notifications"

export default function HabitTrackerApp() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeApp()
    setupPWA()
  }, [])

  const initializeApp = async () => {
    try {
      setError(null)
      await db.init()
      const habitsData = await db.getHabits()
      setHabits(habitsData || [])

      // Load entries for all habits
      const allEntries: HabitEntry[] = []
      for (const habit of habitsData || []) {
        if (habit && habit.id) {
          const habitEntries = await db.getEntriesForHabit(habit.id)
          allEntries.push(...(habitEntries || []))
        }
      }
      setEntries(allEntries)
    } catch (error) {
      console.error("Failed to initialize app:", error)
      setError("Failed to load app data. Please refresh the page.")
    } finally {
      setIsLoading(false)
    }
  }

  const setupPWA = () => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    }

    // Handle install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    })

    // Request notification permission
    NotificationService.requestPermission()
  }

  const handleInstallApp = async () => {
    if (!installPrompt) return

    const result = await installPrompt.prompt()
    console.log("Install prompt result:", result)
    setInstallPrompt(null)
  }

  const handleAddHabit = async (habitData: {
    name: string
    description: string
    color: string
    targetDays: number[]
  }) => {
    try {
      const newHabit: Omit<Habit, "id"> = {
        ...habitData,
        createdAt: new Date(),
        isActive: true,
      }

      const id = await db.addHabit(newHabit)
      const habit = { ...newHabit, id }
      setHabits((prev) => [...prev, habit])
    } catch (error) {
      console.error("Failed to add habit:", error)
    }
  }

  const handleToggleComplete = async (habitId: number, date: string, completed: boolean) => {
    try {
      const existingEntry = entries.find((entry) => entry.habitId === habitId && entry.date === date)

      if (existingEntry) {
        const updatedEntry = { ...existingEntry, completed }
        await db.updateEntry(updatedEntry)
        setEntries((prev) => prev.map((entry) => (entry.id === existingEntry.id ? updatedEntry : entry)))
      } else {
        const newEntry: Omit<HabitEntry, "id"> = {
          habitId,
          date,
          completed,
          createdAt: new Date(),
        }
        const id = await db.addEntry(newEntry)
        setEntries((prev) => [...prev, { ...newEntry, id }])
      }
    } catch (error) {
      console.error("Failed to toggle habit completion:", error)
    }
  }

  const handleDeleteHabit = async (habitId: number) => {
    try {
      await db.deleteHabit(habitId)
      setHabits((prev) => prev.filter((habit) => habit.id !== habitId))
      setEntries((prev) => prev.filter((entry) => entry.habitId !== habitId))
    } catch (error) {
      console.error("Failed to delete habit:", error)
    }
  }

  const activeHabits = habits.filter((habit) => habit && habit.isActive) || []
  const todayEntries = entries.filter((entry) => entry && entry.date === formatDate(new Date())) || []
  const completedToday = todayEntries.filter((entry) => entry && entry.completed === true).length || 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your habits...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
              <p className="text-sm text-gray-600">
                {completedToday} of {activeHabits.length} habits completed today
              </p>
            </div>
            <div className="flex items-center gap-2">
              {installPrompt && (
                <Button onClick={handleInstallApp} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
              <Badge variant="secondary">{activeHabits.length} Active</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="habits" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="habits" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  entries={entries.filter((entry) => entry.habitId === habit.id)}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteHabit}
                />
              ))}
              <AddHabitForm onAdd={handleAddHabit} />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard habits={habits} entries={entries} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-4">
              <div className="p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                <Button onClick={() => NotificationService.requestPermission()} className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </Button>
                <p className="text-sm text-gray-600 mt-2">Get reminded to check in on your habits</p>
              </div>

              <div className="p-6 bg-white rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your data is stored locally on your device and works offline
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm">
                    Import Data
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
