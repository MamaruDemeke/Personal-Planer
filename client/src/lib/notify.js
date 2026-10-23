/**
 * System (OS-level) notifications.
 *
 * Android Chrome and installed PWAs only accept notifications through a
 * service worker registration, so those go through `showNotification` and
 * appear in the phone's notification shade / lock screen with the system
 * sound. Desktop browsers fall back to the classic Notification constructor.
 */

const ICON = '/icons/icon-192.png'

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permissionState() {
  return notificationsSupported() ? window.Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return await window.Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

async function getRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing) return existing
    // `ready` never settles when no worker is registered (e.g. dev server).
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
    ])
  } catch {
    return null
  }
}

function buildOptions(body, opts) {
  return {
    body,
    icon: ICON,
    badge: ICON,
    tag: opts.tag ?? 'mezgab-reminder',
    renotify: true,
    requireInteraction: opts.sticky ?? false,
    vibrate: opts.vibrate ?? [600, 300, 600, 300, 600],
    data: { url: opts.url ?? '/' },
  }
}

/** Show a native notification. Resolves true when it was displayed. */
export async function showSystemNotification(title, body, opts = {}) {
  if (!notificationsSupported() || window.Notification.permission !== 'granted') return false

  const registration = await getRegistration()
  if (registration?.showNotification) {
    try {
      await registration.showNotification(title, buildOptions(body, opts))
      return true
    } catch {
      /* Fall back to the page notification below. */
    }
  }

  try {
    // eslint-disable-next-line no-new
    new window.Notification(title, buildOptions(body, opts))
    return true
  } catch {
    return false
  }
}
