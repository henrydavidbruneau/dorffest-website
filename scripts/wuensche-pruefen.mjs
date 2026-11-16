#!/usr/bin/env node
// Wunschliste: Wer hat sich je Termin mehr als 3 Dinge gewünscht? (nur lesen, außer mit --nachtragen)
//
// Wünsche von vor der Grenze (16.11.2026) haben noch kein Feld `waehler`. Wer einen Wunsch anlegt,
// stimmt aber automatisch im selben Moment dafür (`wunsch_stimmen.waehler` = Hash der Browser-Kennung).
// Die Stimme, die bis zu 10 Sekunden nach dem Wunsch angelegt wurde, verrät also, welcher Browser ihn
// eingetragen hat. Grenzen: ein Browser ≠ eine Person (anderes Handy, Cookies gelöscht = „neue“ Person);
// hat jemand die eigene Stimme später zurückgenommen, bleibt der Wunsch „unbekannt“.
//
// Aufruf (Node 22+, im Projektordner):
//
//   DIRECTUS_URL=https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de \
//   DIRECTUS_ADMIN_TOKEN=… \
//   node scripts/wuensche-pruefen.mjs
//       → zeigt je Termin, wie viele Wünsche jeder Browser eingetragen hat (wer mehr als 3 hat, steht oben)
//
//   … node scripts/wuensche-pruefen.mjs --nachtragen
//       → schreibt den gefundenen Browser zusätzlich in `wuensche.waehler` (nur wo es leer ist),
//         damit alte Wünsche bei der Grenze mitzählen. Vorher `scripts/directus-setup.mjs` ausführen.

const BASE = process.env.DIRECTUS_URL?.replace(/\/$/, '')
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN
const NACHTRAGEN = process.argv.includes('--nachtragen')
const GRENZE = 3
const FENSTER_MS = 10_000

if (!BASE || !TOKEN) {
  console.error('DIRECTUS_URL und DIRECTUS_ADMIN_TOKEN setzen (siehe Kopf der Datei).')
  process.exit(1)
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json?.errors?.map(e => e.message).join('; ') || text}`)
  return json.data
}

const liste = (collection, fields) => api('GET', `/items/${collection}?limit=-1&fields=${fields}`)

let wuensche
try {
  wuensche = await liste('wuensche', 'id,status,text,name,date_created,waehler,termin.id,termin.titel')
}
catch {
  // Feld `waehler` noch nicht angelegt
  wuensche = await liste('wuensche', 'id,status,text,name,date_created,termin.id,termin.titel')
}
const stimmen = await liste('wunsch_stimmen', 'wunsch,waehler,date_created')

const stimmenJeWunsch = new Map()
for (const s of stimmen) {
  const id = Number(s.wunsch)
  if (!stimmenJeWunsch.has(id)) stimmenJeWunsch.set(id, [])
  stimmenJeWunsch.get(id).push(s)
}

/** Browser, der den Wunsch angelegt hat: gespeichert oder aus der Stimme direkt danach */
function urheber(w) {
  if (w.waehler) return { waehler: w.waehler, quelle: 'gespeichert' }
  const t = Date.parse(w.date_created)
  const passend = (stimmenJeWunsch.get(w.id) ?? [])
    .map(s => ({ s, abstand: Date.parse(s.date_created) - t }))
    .filter(x => x.abstand >= -1000 && x.abstand <= FENSTER_MS)
    .sort((a, b) => a.abstand - b.abstand)[0]
  return passend ? { waehler: passend.s.waehler, quelle: 'erschlossen' } : null
}

const termine = new Map()
let unbekannt = 0
for (const w of wuensche) {
  const termin = w.termin?.titel ?? `Termin ${w.termin?.id ?? '?'}`
  if (!termine.has(termin)) termine.set(termin, new Map())
  const u = urheber(w)
  if (!u) {
    unbekannt++
    continue
  }
  w._urheber = u
  const je = termine.get(termin)
  if (!je.has(u.waehler)) je.set(u.waehler, [])
  je.get(u.waehler).push(w)
}

console.log(`${wuensche.length} Wünsche, ${stimmen.length} Stimmen. Urheber*in unbekannt bei ${unbekannt} Wünschen.\n`)
let auffaellig = 0
for (const [termin, je] of termine) {
  const browser = [...je.entries()].sort((a, b) => b[1].length - a[1].length)
  console.log(`■ ${termin}: ${browser.length} Browser haben Wünsche eingetragen`)
  for (const [waehler, ws] of browser) {
    const zuViel = ws.length > GRENZE
    if (zuViel) auffaellig++
    const namen = [...new Set(ws.map(w => w.name).filter(Boolean))].join(', ') || 'ohne Namen'
    console.log(`  ${zuViel ? '⚠️ ' : '   '}${ws.length}× · Browser ${waehler.slice(0, 8)} · ${namen}`)
    if (zuViel) for (const w of ws) console.log(`       – ${w.text}${w.status === 'hidden' ? ' (ausgeblendet)' : ''} · ${w.date_created}`)
  }
  console.log()
}
console.log(auffaellig ? `⚠️  ${auffaellig}× mehr als ${GRENZE} Wünsche von einem Browser.` : `Niemand hat mehr als ${GRENZE} Wünsche eingetragen.`)

if (NACHTRAGEN) {
  const offen = wuensche.filter(w => !w.waehler && w._urheber)
  for (const w of offen) await api('PATCH', `/items/wuensche/${w.id}`, { waehler: w._urheber.waehler })
  console.log(`\n${offen.length} Wünschen den Browser nachgetragen.`)
}
