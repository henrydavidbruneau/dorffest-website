// Signierte Links (Bestätigen/Abmelden) mit NUXT_LINK_SECRET – ohne Datenbank-Token.
// HMAC-SHA256 über Web Crypto (läuft in Node und auf Netlify gleich).

export function linkSchluesselDa() {
  return !!useRuntimeConfig().linkSecret
}

function base64url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function signiere(zweck: string, id: number | string): Promise<string> {
  const { linkSecret } = useRuntimeConfig()
  if (!linkSecret) throw new Error('NUXT_LINK_SECRET fehlt')
  const schluessel = await crypto.subtle.importKey('raw', new TextEncoder().encode(linkSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return base64url(await crypto.subtle.sign('HMAC', schluessel, new TextEncoder().encode(`${zweck}:${id}`)))
}

/** Vergleich in konstanter Zeit, damit die Signatur nicht Zeichen für Zeichen erraten werden kann */
function gleich(a: string, b: string) {
  if (a.length !== b.length) return false
  let unterschied = 0
  for (let i = 0; i < a.length; i++) unterschied |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return unterschied === 0
}

export async function pruefeSignatur(zweck: string, id: unknown, sig: unknown): Promise<boolean> {
  if (!linkSchluesselDa() || typeof sig !== 'string' || !/^\d{1,12}$/.test(String(id))) return false
  return gleich(await signiere(zweck, String(id)), sig)
}

/** wie pruefeSignatur, aber für einen beliebigen Wert (z.B. eine E-Mail-Adresse) */
export async function pruefeSignaturWert(zweck: string, wert: unknown, sig: unknown): Promise<boolean> {
  if (!linkSchluesselDa() || typeof sig !== 'string' || typeof wert !== 'string' || !wert || wert.length > 254) return false
  return gleich(await signiere(zweck, wert), sig)
}

/** absolute Adresse der Seite (für Links in Mails) */
export function seitenUrl(event: Parameters<typeof getRequestURL>[0]) {
  return getRequestURL(event, { xForwardedHost: true }).origin
}
