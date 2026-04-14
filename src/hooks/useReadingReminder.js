import { useEffect, useRef } from 'react'
import { useNotification } from './useNotification'

/**
 * Handles reading reminder logic:
 * - On mount: warns if grimoire has been dormant 2+ days
 * - Every minute: fires a push notification if past the configured time and no entry logged today
 * - At midnight: resets the fired flag so the check runs again the next day
 *
 * Reads from localStorage directly (not React state) to avoid stale closure issues
 * with the setInterval callback.
 *
 * @param {Array} entries - Current reading entries from state
 */
export function useReadingReminder(entries) {
  const notify = useNotification()
  const reminderFired = useRef(false)

  useEffect(() => {
    const enabled = window.localStorage.getItem('lore-reminder') === '1'
    if (!enabled) return

    // On-open: warn if grimoire has been dormant 2+ days
    if (entries.length > 0) {
      const lastDate = entries.reduce((max, e) => e.date > max ? e.date : max, '')
      if (lastDate) {
        const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
        if (daysSince >= 2) {
          notify(`El grimorio te extraña... Han pasado ${daysSince} días sin una crónica.`, 'info')
        }
      }
    }

    // Timed notification: check every minute if it's past the set reminder time
    const check = () => {
      if (reminderFired.current) return
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      const time = window.localStorage.getItem('lore-reminder-time') || '21:00'
      const now = new Date()
      const [h, m] = time.split(':').map(Number)
      const today = now.toISOString().split('T')[0]

      try {
        const stored = JSON.parse(window.localStorage.getItem('reading-entries') || '[]')
        if (stored.some(e => e.date === today)) { reminderFired.current = true; return }
      } catch { return }

      if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
        reminderFired.current = true
        navigator.serviceWorker?.ready
          .then(reg => reg.showNotification('Lorekeeper', {
            body: '¿Leíste hoy, archivero? El grimorio aguarda tu crónica.',
            icon: '/pwa-192.png',
            badge: '/pwa-192.png',
            tag: 'reading-reminder',
          }))
          .catch(() => {})
      }
    }

    check()
    const interval = setInterval(check, 60_000)

    // Reset fired flag at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const midnightTimer = setTimeout(() => { reminderFired.current = false }, tomorrow - now)

    return () => { clearInterval(interval); clearTimeout(midnightTimer) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
