// Service Worker des Vereinsheims: nur für Push-Benachrichtigungen (kein Offline-Zwischenspeicher –
// das Vereinsheim soll immer frisch vom Server kommen). Nachricht: { titel, text, url, kennung }
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let n = {}
  try {
    n = event.data ? event.data.json() : {}
  }
  catch {
    n = { text: event.data ? event.data.text() : '' }
  }
  event.waitUntil(self.registration.showNotification(n.titel || 'Vereinsheim', {
    body: n.text || '',
    icon: '/app/icon-192.png',
    tag: n.kennung || undefined,
    data: { url: n.url || '/vereinsheim' },
    lang: 'de',
  }))
})

// Antippen: offenes Vereinsheim nach vorn holen und dorthin wechseln, sonst neu öffnen
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const ziel = new URL(event.notification.data?.url || '/vereinsheim', self.location.origin).href
  event.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const offen = fenster.find((f) => new URL(f.url).pathname.startsWith('/vereinsheim'))
    if (offen) {
      await offen.focus()
      return offen.navigate(ziel).catch(() => self.clients.openWindow(ziel))
    }
    return self.clients.openWindow(ziel)
  })())
})
