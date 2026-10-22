#!/usr/bin/env node
// Brevo Inbound Parsing für Push-Benachrichtigungen bei neuer Post (einmalig einrichten).
//
// Ablauf: IONOS leitet von jeder Mail im Kontakt-Postfach eine Kopie an NUXT_EINGANG_ADRESSE weiter
// (z.B. post-k7x2m9qa@eingang.koenigsdorf-rueckt-zusammen.de). Die Subdomain hat MX-Einträge bei Brevo:
//
//   eingang  MX 10  inbound1.sendinblue.com
//   eingang  MX 20  inbound2.sendinblue.com
//
// Brevo ruft dann https://<seite>/api/eingang/brevo?schluessel=<NUXT_EINGANG_SCHLUESSEL> auf.
// Dieses Skript legt den Webhook dafür an (oder zeigt, dass es ihn schon gibt).
//
// Aufruf (Node 22+):
//
//   BREVO_API_KEY=… \
//   EINGANG_SCHLUESSEL=… \
//   node scripts/brevo-eingang.mjs --domain eingang.koenigsdorf-rueckt-zusammen.de --seite https://xn--knigsdorf-rckt-zusammen-7kc4n.de
//
//   … --list   → zeigt die vorhandenen Inbound-Webhooks

const args = process.argv.slice(2)
const value = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const KEY = process.env.BREVO_API_KEY || ''
if (!KEY) {
  console.error('BREVO_API_KEY muss gesetzt sein (Brevo → SMTP & API → API-Schlüssel).')
  process.exit(1)
}

async function brevo(method, pfad, body) {
  const res = await fetch(`https://api.brevo.com/v3${pfad}`, {
    method,
    headers: { 'api-key': KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${pfad} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : {}
}

// Ohne Inbound-Webhooks antwortet Brevo mit 400 „document_not_found“ statt einer leeren Liste
const { webhooks = [] } = await brevo('GET', '/webhooks?type=inbound').catch((e) => {
  if (e.message.includes('document_not_found')) return {}
  throw e
})
// Schlüssel in der Ausgabe nicht zeigen
const ohneSchluessel = (url) => url.replace(/schluessel=[^&]+/, 'schluessel=…')

if (args.includes('--list')) {
  if (!webhooks.length) console.log('Keine Inbound-Webhooks.')
  for (const w of webhooks) console.log(`  ${w.id}  ${w.domain ?? ''}  → ${ohneSchluessel(w.url)}`)
  process.exit(0)
}

const domain = value('domain')
const seite = value('seite')?.replace(/\/+$/, '')
const schluessel = process.env.EINGANG_SCHLUESSEL || ''
if (!domain || !seite || !schluessel) {
  console.error('Bitte --domain, --seite und EINGANG_SCHLUESSEL angeben (siehe Kopf dieser Datei).')
  process.exit(1)
}

const url = `${seite}/api/eingang/brevo?schluessel=${encodeURIComponent(schluessel)}`
const vorhanden = webhooks.find((w) => w.domain === domain)
if (vorhanden) {
  console.log(`Für ${domain} gibt es schon einen Webhook (${vorhanden.id} → ${ohneSchluessel(vorhanden.url)}).`)
  console.log('Ändern: in Brevo löschen und dieses Skript noch einmal ausführen.')
  process.exit(0)
}

const neu = await brevo('POST', '/webhooks', {
  type: 'inbound',
  events: ['inboundEmailProcessed'],
  url,
  domain,
  description: 'Vereinsheim: Push bei neuer Post',
})
console.log(`Angelegt: Webhook ${neu.id} für ${domain} → ${ohneSchluessel(url)}`)
