"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Flame, Trash2 } from "lucide-react"
import type { Habit, HabitEntry } from "@/lib/database"
import { formatDate, calculateStreak, getCompletionRate } from "@/lib/utils"

interface HabitCardProps {
  habit: Habit
  entries: HabitEntry[]
  onToggleComplete: (habitId: number, date: string, completed: boolean) => void
  onDelete: (habitId: number) => void
}

export function HabitCard({ habit, entries, onToggleComplete, onDelete }: HabitCardProps) {
  // Safety checks
  if (!habit || !habit.id) return null

  const validEntries = entries || []
  const today = formatDate(new Date())
  const todayEntry = validEntries.find((entry) => entry && entry.date === today)
  const isCompletedToday = todayEntry?.completed || false

  const streak = calculateStreak(validEntries)
  const completionRate = getCompletionRate(validEntries)

  const handleToggle = () => {
    onToggleComplete(habit.id!, today, !isCompletedToday)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{habit.name || "Unnamed Habit"}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(habit.id!)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {habit.description && <p className="text-sm text-muted-foreground">{habit.description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={handleToggle}
            variant={isCompletedToday ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isCompletedToday ? "Completed" : "Mark Complete"}
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-semibold">{isNaN(streak) ? 0 : streak}</span>
            </div>
            <Badge variant="secondary">{isNaN(completionRate) ? 0 : completionRate}% complete</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{isNaN(completionRate) ? 0 : completionRate}%</span>
          </div>
          <Progress value={isNaN(completionRate) ? 0 : completionRate} className="h-2" />
        </div>

        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const dateStr = formatDate(date)
            const entry = validEntries.find((e) => e && e.date === dateStr)
            const isCompleted = entry?.completed || false

            return (
              <div
                key={dateStr}
                className={`w-6 h-6 rounded-sm border ${
                  isCompleted ? "bg-green-500 border-green-500" : "bg-gray-100 border-gray-300"
                }`}
                title={dateStr}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
