import { toast } from 'sonner'

/**
 * Registers the service worker that keeps the site working offline (built
 * into dist/sw.js by scripts/build-sw.ts). Production only: the dev server
 * has no sw.js, and a stored copy would hide changes while developing.
 *
 * A new version never takes over by itself. A notice offers to reload, and
 * if it's ignored the update applies the next time the site is opened.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  // Reload only when the person chose to, not when the first install takes control.
  let reloadWanted = false
  // With no controller yet, the next change is the first install, not an update.
  let updating = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadWanted) window.location.reload()
    // The update was accepted in another tab. This tab still runs the old version, so offer to reload it too.
    else if (updating)
      toast('utilities.my was updated in another tab', {
        description: "Reload this tab to use the new version. Anything you haven't saved on this page will be cleared.",
        duration: Infinity,
        action: { label: 'Reload', onClick: () => window.location.reload() },
      })
    updating = true
  })

  const offer = (worker: ServiceWorker) => {
    toast('A new version of utilities.my is ready', {
      description: "Reload to use it. Anything you haven't saved on this page will be cleared.",
      duration: Infinity,
      action: {
        label: 'Reload',
        onClick: () => {
          reloadWanted = true
          // A service worker's postMessage has no target origin, unlike window.postMessage.
          // oxlint-disable-next-line unicorn/require-post-message-target-origin
          worker.postMessage({ type: 'skip-waiting' })
        },
      },
    })
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) offer(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const next = registration.installing
          next?.addEventListener('statechange', () => {
            // With no controller this is the first install, not an update.
            if (next.state === 'installed' && navigator.serviceWorker.controller) offer(next)
          })
        })
        // Moving between pages doesn't reload the app, so look for a new version when the tab comes back.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update().catch(() => undefined)
        })
      })
      .catch(() => {
        // No offline support this time (private mode, blocked storage); the site works as before.
      })
  })
}
