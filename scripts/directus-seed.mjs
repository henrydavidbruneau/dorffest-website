#!/usr/bin/env node
// Startinhalte für Directus (aus scripts/directus-seed/inhalte.json, siehe DIRECTUS.md → „Startinhalte“).
//
// Lädt Bilder aus dem Repo hoch, löst Relationen auf (ressort = Slug, ausgabe = Nummer) und legt
// die Einträge an – NUR die, die noch fehlen (erkannt an Slug, Nummer, Überschrift, Frage, Name).
// Bestehendes wird nie geändert oder gelöscht. Beliebig oft ausführbar.
// Vorher muss scripts/directus-setup.mjs gelaufen sein.
//
// Aufruf (Node 22+, im Projektordner):
//
//   DIRECTUS_ADMIN_TOKEN=… node scripts/directus-seed.mjs --dry-run   → zeigt, was passieren würde
//   DIRECTUS_ADMIN_TOKEN=… node scripts/directus-seed.mjs             → legt an
//
// DIRECTUS_URL ist optional (Standard: die Königsdorf-API).

import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'

const BASE = (process.env.DIRECTUS_URL || 'https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de').replace(/\/+$/, '')
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || ''
const DRY = process.argv.includes('--dry-run')

if (!TOKEN) {
  console.error('DIRECTUS_ADMIN_TOKEN muss gesetzt sein (siehe Kopf dieser Datei).')
  process.exit(1)
}

/* ── API ───────────────────────────────────────────────── */

async function api(method, path, body) {
  const isForm = body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(isForm ? {} : { 'Content-Type': 'application/json' }) },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || text
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`)
  }
  return json.data
}

const q = (params) => new URLSearchParams(params).toString()

const done = []
const skipped = []
const failed = []

async function step(label, fn) {
  if (DRY) { done.push(label); return null }
  try {
    const result = await fn()
    done.push(label)
    return result
  }
  catch (err) {
    failed.push(`${label}\n      ${err.message}`)
    return null
  }
}

/* ── Inhalte ───────────────────────────────────────────── */

const inhalte = JSON.parse(await readFile(new URL('./directus-seed/inhalte.json', import.meta.url), 'utf8'))

// In welchen Ordner ein Bild kommt: erste Collection in dieser Reihenfolge, die es nutzt
const ORDNER_JE_COLLECTION = [['artikel', 'artikel'], ['ausgaben', 'artikel'], ['termine', 'termine'], ['stimmen', 'stimmen']]
const MD_BILD = /\]\((\/fotos\/[^)\s]+)/g

function dateiPfade() {
  const pfade = new Map() // Pfad → Ordnername
  for (const [collection, ordner] of ORDNER_JE_COLLECTION) {
    for (const eintrag of inhalte[collection] || []) {
      for (const wert of Object.values(eintrag)) {
        if (wert && typeof wert === 'object' && wert.datei && !pfade.has(wert.datei)) pfade.set(wert.datei, ordner)
        if (typeof wert === 'string') for (const [, url] of wert.matchAll(MD_BILD)) if (!pfade.has(`public${url}`)) pfade.set(`public${url}`, ordner)
      }
    }
  }
  return pfade
}

const TYPEN = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml' }

/* ── Ablauf ────────────────────────────────────────────── */

async function main() {
  // 0. Ordner (legt directus-setup.mjs an)
  const folders = Object.fromEntries((await api('GET', '/folders?limit=-1&fields=id,name,parent')).filter((f) => !f.parent).map((f) => [f.name, f.id]))
  for (const name of ['artikel', 'termine', 'stimmen']) {
    if (!folders[name]) throw new Error(`Ordner „${name}“ fehlt – erst scripts/directus-setup.mjs ausführen`)
  }

  // 1. Dateien hochladen (erkannt an Dateiname + Ordner)
  const dateiIds = new Map() // Pfad → Datei-ID
  for (const [pfad, ordner] of dateiPfade()) {
    const name = basename(pfad)
    const vorhanden = await api('GET', `/files?${q({ 'filter[filename_download][_eq]': name, 'filter[folder][_eq]': folders[ordner], fields: 'id', limit: '1' })}`)
    if (vorhanden.length) { dateiIds.set(pfad, vorhanden[0].id); skipped.push(`Datei ${name} – schon vorhanden`); continue }
    const daten = await readFile(new URL(`../${pfad}`, import.meta.url))
    const created = await step(`Datei ${name} hochladen (Ordner ${ordner})`, () => {
      const form = new FormData()
      form.append('folder', folders[ordner]) // Felder vor der Datei, sonst ignoriert Directus sie
      form.append('title', name.replace(/\.[^.]+$/, ''))
      form.append('file', new Blob([daten], { type: TYPEN[name.split('.').pop()] || 'application/octet-stream' }), name)
      return api('POST', '/files', form)
    })
    dateiIds.set(pfad, created?.id || `<neu:${name}>`)
  }

  // {datei} → ID, /fotos/… im Markdown → Asset-URL
  const aufloesen = (eintrag) => Object.fromEntries(Object.entries(eintrag).map(([k, v]) => {
    if (v && typeof v === 'object' && v.datei) return [k, dateiIds.get(v.datei) ?? null]
    if (typeof v === 'string') return [k, v.replace(MD_BILD, (m, url) => `](${BASE}/assets/${dateiIds.get(`public${url}`)}`)]
    return [k, v]
  }))

  // 2. Einträge anlegen, erkannt an einem Schlüsselfeld
  async function anlegen(collection, schluessel, vorbereiten = (x) => x) {
    const vorhanden = new Map((await api('GET', `/items/${collection}?${q({ fields: `id,${schluessel}`, limit: '-1' })}`)).map((x) => [String(x[schluessel]), x.id]))
    const ids = new Map(vorhanden)
    for (const eintrag of inhalte[collection] || []) {
      const key = String(eintrag[schluessel])
      if (vorhanden.has(key)) { skipped.push(`${collection}: ${key} – schon vorhanden`); continue }
      const created = await step(`${collection}: ${key}${eintrag.status === 'draft' ? ' (Entwurf)' : ''}`, () =>
        api('POST', `/items/${collection}`, vorbereiten(aufloesen(eintrag))))
      ids.set(key, created?.id ?? `<neu:${key}>`)
    }
    return ids
  }

  const ressorts = await anlegen('ressorts', 'slug')
  const ausgaben = await anlegen('ausgaben', 'nummer')
  await anlegen('termine', 'slug')
  const beziehung = (map, wert, was) => {
    if (wert == null) return null
    if (!map.has(String(wert))) throw new Error(`${was} „${wert}“ nicht gefunden`)
    return map.get(String(wert))
  }
  await anlegen('artikel', 'slug', (a) => ({ ...a, ressort: beziehung(ressorts, a.ressort, 'Ressort'), ausgabe: beziehung(ausgaben, a.ausgabe, 'Ausgabe') }))
  await anlegen('kleinanzeigen', 'ueberschrift')
  await anlegen('faq', 'frage')
  await anlegen('stimmen', 'name')

  // 3. Singleton verein: nur setzen, solange es leer ist
  const verein = await api('GET', '/items/verein')
  if (verein && Object.keys(inhalte.verein).some((k) => verein[k] != null)) skipped.push('verein – schon befüllt (nicht geändert)')
  else await step('verein: Kontakt, Konto, Infochannel, nächstes Dorffest', () => api('PATCH', '/items/verein', inhalte.verein))

  console.log(`\n${DRY ? 'PROBELAUF – nichts geändert.' : 'Fertig.'}\n`)
  if (done.length) console.log(`${DRY ? 'Würde anlegen' : 'Angelegt'} (${done.length}):\n${done.map((d) => `  ✓ ${d}`).join('\n')}\n`)
  if (skipped.length) console.log(`Schon vorhanden (${skipped.length}):\n${skipped.map((d) => `  · ${d}`).join('\n')}\n`)
  if (failed.length) {
    console.log(`Fehlgeschlagen:\n${failed.map((d) => `  ✗ ${d}`).join('\n')}\n`)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(`Abbruch: ${err.message}`)
  process.exit(1)
})
