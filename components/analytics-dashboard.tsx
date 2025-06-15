"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import type { Habit, HabitEntry } from "@/lib/database"
import { getDateRange, getCompletionRate } from "@/lib/utils"

interface AnalyticsDashboardProps {
  habits: Habit[]
  entries: HabitEntry[]
}

export function AnalyticsDashboard({ habits, entries }: AnalyticsDashboardProps) {
  // Ensure we have valid data
  const validHabits = habits || []
  const validEntries = entries || []

  const last30Days = getDateRange(30)

  // Calculate daily completion rates with safety checks
  const dailyData = last30Days.map((date) => {
    const dayEntries = validEntries.filter((entry) => entry && entry.date === date)
    const activeHabitsCount = validHabits.filter((habit) => habit && habit.isActive).length
    const completedHabits = dayEntries.filter((entry) => entry && entry.completed === true).length

    const completion = activeHabitsCount > 0 ? Math.round((completedHabits / activeHabitsCount) * 100) : 0

    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completion: isNaN(completion) ? 0 : completion,
      completed: completedHabits || 0,
      total: activeHabitsCount || 0,
    }
  })

  // Calculate habit-specific completion rates with safety checks
  const habitData = validHabits
    .map((habit) => {
      if (!habit || !habit.id) return null

      const habitEntries = validEntries.filter((entry) => entry && entry.habitId === habit.id)
      const completionRate = getCompletionRate(habitEntries)

      return {
        name: habit.name && habit.name.length > 15 ? habit.name.substring(0, 15) + "..." : habit.name || "Unknown",
        completion: isNaN(completionRate) ? 0 : completionRate,
        total: habitEntries.length || 0,
        completed: habitEntries.filter((entry) => entry && entry.completed === true).length || 0,
      }
    })
    .filter(Boolean) // Remove null entries

  // Safe calculations for summary stats
  const totalHabits = validHabits.length || 0
  const activeHabits = validHabits.filter((habit) => habit && habit.isActive).length || 0
  const totalEntries = validEntries.length || 0
  const completedEntries = validEntries.filter((entry) => entry && entry.completed === true).length || 0
  const overallCompletion = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Habits</CardDescription>
            <CardTitle className="text-3xl">{totalHabits}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Habits</CardDescription>
            <CardTitle className="text-3xl">{activeHabits}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Completion</CardDescription>
            <CardTitle className="text-3xl">{isNaN(overallCompletion) ? 0 : overallCompletion}%</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Check-ins</CardDescription>
            <CardTitle className="text-3xl">{completedEntries}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Completion Rate (Last 30 Days)</CardTitle>
          <CardDescription>Your overall habit completion percentage each day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              completion: {
                label: "Completion Rate",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="var(--color-completion)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-completion)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {habitData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Habit Performance</CardTitle>
            <CardDescription>Completion rate by habit</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completion: {
                  label: "Completion Rate",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completion" fill="var(--color-completion)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
