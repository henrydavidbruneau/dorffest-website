// Push-Benachrichtigungen im Vereinsheim (Web Push, ohne App Store).
//
// Jedes Gerät, auf dem jemand unter „Mein Profil“ Benachrichtigungen einschaltet, ist ein Eintrag in
// Directus `push_abos` (Adresse + Schlüssel des Browsers). `post` = auch neue Mails im Kontakt-Postfach;
// setzen darf das nur der Vorstand (Policy), und ein Flow nimmt es zurück, wenn sich die Rolle ändert.
// Verschickt wird mit dem VAPID-Schlüsselpaar (NUXT_VAPID_PRIVATE_KEY / NUXT_PUBLIC_VAPID_PUBLIC_KEY).
// Abgelaufene Abos (Browser meldet 404/410) löscht der Server gleich mit.
import webpush from 'web-push'

export interface PushAbo {
  id: number
  endpoint: string
  p256dh: string
  auth: string
  geraet?: string | null
  post?: boolean
}

export interface PushNachricht {
  titel: string
  text: string
  /** Ziel beim Antippen (Pfad im Vereinsheim) */
  url: string
  /** gleiche Kennung ersetzt die ältere Benachrichtigung statt eine zweite zu zeigen */
  kennung?: string
}

export function pushKonfig() {
  const { vapidPrivateKey, mailVon, public: { vapidPublicKey } } = useRuntimeConfig()
  return { eingerichtet: !!(vapidPrivateKey && vapidPublicKey), oeffentlich: vapidPublicKey, privat: vapidPrivateKey, kontakt: `mailto:${mailVon}` }
}

/** Nachricht an alle Abos; gibt zurück, wie viele angekommen sind */
export async function sendePush(abos: PushAbo[], nachricht: PushNachricht): Promise<number> {
  const k = pushKonfig()
  if (!k.eingerichtet) {
    console.log('[push] nicht eingerichtet – hätte geschickt:', nachricht.titel, `(${abos.length} Geräte)`)
    return 0
  }
  const inhalt = JSON.stringify(nachricht)
  const ergebnisse = await Promise.all(abos.map(abo => webpush.sendNotification(
    { endpoint: abo.endpoint, keys: { p256dh: abo.p256dh, auth: abo.auth } },
    inhalt,
    { vapidDetails: { subject: k.kontakt, publicKey: k.oeffentlich, privateKey: k.privat }, TTL: 60 * 60 * 24, urgency: 'high' },
  ).then(() => true, async (e: { statusCode?: number, body?: string }) => {
    // 404/410: Browser hat das Abo aufgegeben (abgemeldet, App gelöscht) → weg damit
    if (e.statusCode === 404 || e.statusCode === 410) await directusServer(`/items/push_abos/${abo.id}`, { method: 'DELETE' }).catch(() => {})
    else console.error('[push]', e.statusCode, e.body ?? e)
    return false
  })))
  return ergebnisse.filter(Boolean).length
}

/** Abo aus dem Browser prüfen (Form wie `PushSubscription.toJSON()`) */
export function leseAbo(body: Record<string, unknown>) {
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : ''
  const keys = (body.keys && typeof body.keys === 'object' ? body.keys : {}) as Record<string, unknown>
  const p256dh = typeof keys.p256dh === 'string' ? keys.p256dh : ''
  const auth = typeof keys.auth === 'string' ? keys.auth : ''
  if (!/^https:\/\/\S{10,1000}$/.test(endpoint) || !/^[\w-]{20,200}$/.test(p256dh) || !/^[\w-]{10,100}$/.test(auth)) {
    throw fail(400, 'abo', 'Dieses Gerät hat keine gültige Push-Adresse geschickt.')
  }
  return { endpoint, p256dh, auth, geraet: text(body.geraet, 80) || null }
}
