export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }

  static async scheduleReminder(habitName: string, time: string): Promise<void> {
    const hasPermission = await this.requestPermission()
    if (!hasPermission) return

    // Mock scheduling - in a real app, you'd use a service worker
    const now = new Date()
    const [hours, minutes] = time.split(":").map(Number)
    const scheduledTime = new Date(now)
    scheduledTime.setHours(hours, minutes, 0, 0)

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime()

    setTimeout(() => {
      new Notification(`Habit Reminder: ${habitName}`, {
        body: `Time to work on your ${habitName} habit!`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
      })
    }, timeUntilNotification)
  }

  static showInstantReminder(habitName: string): void {
    if (Notification.permission === "granted") {
      new Notification(`Don't forget: ${habitName}`, {
        body: "You haven't checked in today!",
        icon: "/icon-192x192.png",
      })
    }
  }
}
