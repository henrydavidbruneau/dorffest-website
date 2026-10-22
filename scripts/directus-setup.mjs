#!/usr/bin/env node
// Directus-Setup für „Königsdorf rückt zusammen“ (Bauplan: DIRECTUS.md).
//
// Legt an, was die Website und das Vereinsheim in Directus brauchen – und NUR das, was fehlt:
//   • alle Collections aus DIRECTUS.md inkl. Felder und Relationen
//   • Datei-Ordner (termine, artikel, gastbeitraege, stimmen, belege)
//   • Policies `Server`, `Mitglied`, `Vorstand` (alle ohne App Access, siehe „Lizenz-Seats“)
//     mit ihren Rechten
//   • hängt `Server` an den User `website-server` (dessen Token liegt auf Netlify)
//   • Rollen `Mitglied` (Policy Mitglied) und `Vorstand` (Mitglied + Vorstand)
//   • Flows: Kleinanzeigen max. 4, Abgelehntes nach 6 Monaten löschen
//
// Bestehendes wird nie geändert oder gelöscht – Ausnahme: an vorhandene Rechte werden neue
// Felder aus dem Bauplan angehängt. Weicht ein Recht sonst ab, meldet das Skript es nur. Beliebig oft ausführbar. Die öffentliche Rolle bekommt keine Rechte.
//
// Aufruf (Node 22+, im Projektordner):
//
//   DIRECTUS_URL=https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de \
//   DIRECTUS_ADMIN_TOKEN=… \
//   node scripts/directus-setup.mjs --dry-run
//       → zeigt, was passieren würde, ändert nichts
//
//   … node scripts/directus-setup.mjs
//       → legt an
//
//   … node scripts/directus-setup.mjs --list
//       → zeigt Policies, Zuordnungen und Rechte je Policy
//
// --server-user: Name oder E-Mail des Server-Users (Standard: website-server)
// Der Token braucht Admin-Rechte (Schema + Rechte ändern).
//
// Directus 12: neue Collections bekämen im Studio ein `archived`-Boolean statt `status` –
// hier legen wir `status` selbst an (die Website filtert darauf). Eigene Filter in Rechten
// brauchen eine Lizenz (Open Innovation Grant ist eingetragen).

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  if (i >= 0 && args[i + 1]) return args[i + 1]
  const eq = args.find((a) => a.startsWith(`--${name}=`))
  return eq ? eq.slice(name.length + 3) : fallback
}

const BASE = (process.env.DIRECTUS_URL || 'https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de').replace(/\/+$/, '')
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || ''
const DRY = flag('dry-run')
const SERVER_USER = value('server-user', 'website-server')

if (!TOKEN) {
  console.error('DIRECTUS_ADMIN_TOKEN muss gesetzt sein (siehe Kopf dieser Datei).')
  process.exit(1)
}

/* ── API ───────────────────────────────────────────────── */

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || text
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`)
  }
  return json.data
}

const done = []
const skipped = []
const warnings = []
const failed = []

// Führt fn aus (außer im Probelauf). Gibt das Ergebnis zurück, im Probelauf/bei Fehler null.
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

/* ── Feld-Bausteine ────────────────────────────────────── */

const choices = (list) => list.map(([value, text]) => ({ value, text }))

const idField = () => ({
  field: 'id', type: 'integer',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { is_primary_key: true, has_auto_increment: true },
})
const statusField = (list, def, note) => ({
  field: 'status', type: 'string',
  meta: { interface: 'select-dropdown', options: { choices: choices(list) }, display: 'labels', width: 'half', note: note || null },
  schema: { default_value: def, is_nullable: false },
})
// Systemfelder: wann/wer angelegt und zuletzt geändert
const systemFields = () => [
  { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
  { field: 'date_updated', type: 'timestamp', meta: { special: ['date-updated'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime', display_options: { relative: true } }, schema: {} },
  { field: 'user_created', type: 'uuid', meta: { special: ['user-created'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half', display: 'user' }, schema: {} },
  { field: 'user_updated', type: 'uuid', meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', readonly: true, hidden: true, width: 'half', display: 'user' }, schema: {} },
]
const systemRelations = () => [
  { field: 'user_created', related_collection: 'directus_users', schema: { on_delete: 'SET NULL' } },
  { field: 'user_updated', related_collection: 'directus_users', schema: { on_delete: 'SET NULL' } },
]
const str = (field, { note, required, unique, width = 'full', max = 255, def, validation } = {}) => ({
  field, type: 'string',
  meta: { interface: 'input', width, note: note || null, required: !!required, validation: validation || null },
  schema: { max_length: max, is_unique: !!unique, ...(def !== undefined ? { default_value: def } : {}) },
})
const slug = (note) => ({
  ...str('slug', { required: true, unique: true, width: 'half', max: 120, note }),
  meta: { interface: 'input', width: 'half', note, required: true, options: { slug: true, trim: true }, validation: { slug: { _regex: '^[a-z0-9]+(-[a-z0-9]+)*$' } }, validation_message: 'Nur a–z, 0–9 und Bindestriche' },
})
const email = (field, opts = {}) => str(field, { width: 'half', max: 254, ...opts })
const text = (field, { note, required, max } = {}) => ({
  field, type: 'text',
  meta: { interface: 'input-multiline', note: note || null, required: !!required, ...(max ? { options: { softLength: max } } : {}) },
  schema: {},
})
const markdown = (field, { note, required } = {}) => ({
  field, type: 'text',
  meta: { interface: 'input-rich-text-md', note: note || 'Markdown', required: !!required },
  schema: {},
})
const bool = (field, { note, def = false } = {}) => ({
  field, type: 'boolean',
  meta: { interface: 'boolean', width: 'half', note: note || null, special: ['cast-boolean'] },
  schema: { default_value: def, is_nullable: false },
})
const int = (field, { note, required, unique, min, max, width = 'half' } = {}) => ({
  field, type: 'integer',
  meta: { interface: 'input', width, note: note || null, required: !!required, options: { ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) } },
  schema: { is_unique: !!unique },
})
const decimal = (field, { note, required } = {}) => ({
  field, type: 'decimal',
  meta: { interface: 'input', width: 'half', note: note || null, required: !!required },
  schema: { numeric_precision: 10, numeric_scale: 2 },
})
const timestamp = (field, { note, required } = {}) => ({
  field, type: 'timestamp',
  meta: { interface: 'datetime', width: 'half', note: note || null, required: !!required, display: 'datetime' },
  schema: {},
})
const date = (field, { note, required } = {}) => ({
  field, type: 'date',
  meta: { interface: 'datetime', width: 'half', note: note || null, required: !!required, display: 'datetime' },
  schema: {},
})
const select = (field, list, { note, required, def, width = 'half' } = {}) => ({
  field, type: 'string',
  meta: { interface: 'select-dropdown', options: { choices: choices(list) }, display: 'labels', width, note: note || null, required: !!required },
  schema: def !== undefined ? { default_value: def, is_nullable: false } : {},
})
const tags = (field, { note } = {}) => ({
  field, type: 'json',
  meta: { interface: 'tags', special: ['cast-json'], note: note || null },
  schema: {},
})
const sort = () => ({ field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} })
// Datei (Bild): Feld + Relation zu directus_files
const file = (field, { note, folder } = {}) => ({
  field, type: 'uuid',
  meta: { interface: 'file-image', special: ['file'], display: 'image', width: 'half', note: note || null, options: folder ? { folder: `$folder:${folder}` } : {} },
  schema: {},
})
// M2O-Feld (Integer- oder UUID-Fremdschlüssel); die Relation steht in `relations` der Collection
const m2o = (field, _related, { note, required, type = 'integer', template } = {}) => ({
  field, type,
  meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', note: note || null, required: !!required, display: 'related-values', ...(template ? { options: { template }, display_options: { template } } : {}) },
  schema: {},
})

/* ── Bauplan ───────────────────────────────────────────── */

const STATUS_PUBLISH = [['published', 'Veröffentlicht'], ['draft', 'Entwurf'], ['archived', 'Archiviert']]
const archive = { archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', archive_app_filter: true }
const DOT = 'Nur über den Server-Token anlegbar, nie öffentlich.'

const FOLDERS = ['termine', 'artikel', 'gastbeitraege', 'stimmen', 'belege', 'profilbilder', 'rundbrief']

const COLLECTIONS = [
  /* Termine */
  {
    collection: 'termine',
    meta: { icon: 'event', note: 'Termine (/termine/:slug, Startseite).', display_template: '{{titel}}', sort_field: null, ...archive },
    fields: [
      idField(),
      statusField(STATUS_PUBLISH, 'draft', 'Nur „Veröffentlicht“ erscheint auf der Website'),
      str('titel', { required: true, max: 160 }),
      slug('Adresse: /termine/<slug>'),
      timestamp('beginn', { note: 'Leer = Datum steht noch nicht fest' }),
      timestamp('ende'),
      bool('uhrzeit_folgt', { note: 'Datum fest, Uhrzeit offen (Kalenderdatei ganztägig)' }),
      str('datum_text', { width: 'half', max: 60, note: 'Ersetzt das Datum, solange „beginn“ leer ist („2027“)' }),
      select('wiederholung', [['aus', 'Einmalig'], ['woechentlich', 'Jede Woche'], ['zweiwoechentlich', 'Alle zwei Wochen'], ['monatlich_wochentag', 'Monatlich, gleicher Wochentag (z.B. 1. Montag)'], ['monatlich_datum', 'Monatlich, gleiches Datum']], { def: 'aus', note: 'Regelmäßiger Termin: beginn/ende = erstes Datum, die Website zeigt immer das nächste' }),
      date('wiederholung_bis', { note: 'Letzter Tag der Wiederholung (leer = ohne Ende)' }),
      str('rhythmus_kurz', { width: 'half', max: 30, note: 'Kurzform im Terminkalender; leer = automatisch aus der Wiederholung („1. Mo“)' }),
      str('hinweis', { width: 'half', max: 160, note: 'Ersetzt Uhrzeit/Ort auf dem Zettel' }),
      str('ort', { width: 'half', max: 160, note: 'Leer = „Ort folgt“' }),
      str('adresse', { width: 'half', max: 200 }),
      file('bild', { note: 'Polaroid auf der Eventseite', folder: 'termine' }),
      str('bild_alt', { width: 'half', max: 200, note: 'Pflicht, wenn ein Bild gesetzt ist' }),
      text('kurzbeschreibung', { max: 200, note: 'Countdown-Band, Zettel, Kalender, Vorschau (≈ 200 Zeichen)' }),
      markdown('beschreibung', { note: 'Markdown – „Worum geht’s?“' }),
      str('aufruf_text', { width: 'half', max: 40, note: 'Linktext auf dem Zettel, Standard „Details“' }),
      bool('hervorgehoben', { note: 'Auf der Startseite unter „Was kommt“' }),
      bool('im_fokus', { note: 'Im Nextup-Band auf der Startseite (höchstens einer; sonst der nächste Termin)' }),
      bool('anmeldung_aktiv', { note: 'Anmeldezettel anzeigen' }),
      int('plaetze', { min: 1, note: 'Leer = unbegrenzt' }),
      select('mitbringen_position', [['aus', 'Aus'], ['seite_1', 'Auf dem Anmeldezettel'], ['seite_2', 'Als 2. Seite']], { def: 'aus', note: '„Was bringst du mit?“' }),
      str('mitbringen_frage', { max: 120, note: 'Eigene Frage statt „Was bringst du mit?“, z.B. „Welche Songs sollen wir singen?“' }),
      text('mitbringen_text', { note: 'Einleitung, z.B. „Wir stellen einen Tisch mit Getränken …“' }),
      tags('mitbringen_vorschlaege', { note: 'Antippbare Vorschläge' }),
      { field: 'anmeldungen', type: 'alias', meta: { interface: 'list-o2m', special: ['o2m'], note: 'Anmeldungen zu diesem Termin', options: { template: '{{name}} ({{personen}})' } }, schema: null, alias: true },
      ...systemFields(),
    ],
    relations: [{ field: 'bild', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } }],
  },
  {
    collection: 'anmeldungen',
    meta: { icon: 'how_to_reg', note: `Anmeldungen zu Terminen (inkl. Mitbringen). ${DOT}`, display_template: '{{name}} · {{termin.titel}}' },
    fields: [
      idField(),
      statusField([['angemeldet', 'Angemeldet'], ['abgemeldet', 'Abgemeldet']], 'angemeldet', 'Abgemeldete zählen nicht'),
      m2o('termin', 'termine', { required: true, template: '{{titel}}' }),
      str('name', { required: true, width: 'half', max: 120 }),
      email('email', { required: true }),
      int('personen', { required: true, min: 1, max: 10, note: '1–10, Summe ergibt belegte Plätze' }),
      text('nachricht'),
      text('mitbringen', { note: '„Was bringst du mit?“' }),
      ...systemFields(),
    ],
    relations: [{ field: 'termin', related_collection: 'termine', meta: { one_field: 'anmeldungen' }, schema: { on_delete: 'CASCADE' } }],
  },
  {
    collection: 'beitraege',
    meta: { icon: 'shopping_basket', note: `„Was bringst du mit?“ bei Terminen ohne Anmeldung. ${DOT}`, display_template: '{{name}}: {{was}}' },
    fields: [
      idField(),
      m2o('termin', 'termine', { required: true, template: '{{titel}}' }),
      str('name', { required: true, width: 'half', max: 120 }),
      str('was', { required: true, width: 'half', max: 200 }),
      email('email'),
      ...systemFields(),
    ],
    relations: [{ field: 'termin', related_collection: 'termine', schema: { on_delete: 'CASCADE' } }],
  },
  {
    collection: 'termin_rundmails',
    meta: { icon: 'forward_to_inbox', note: 'Protokoll der Mails an alle Angemeldeten.', display_template: '{{betreff}}' },
    fields: [
      idField(),
      m2o('termin', 'termine', { required: true, template: '{{titel}}' }),
      str('betreff', { required: true, max: 200 }),
      markdown('text', { required: true }),
      int('empfaenger_anzahl'),
      timestamp('gesendet_am'),
      ...systemFields(),
    ],
    relations: [{ field: 'termin', related_collection: 'termine', schema: { on_delete: 'CASCADE' } }],
  },
  {
    collection: 'post_markierungen',
    meta: { icon: 'push_pin', note: 'Mails im Kontakt-Postfach für eine Person markiert (Vereinsheim → Post). Wer markiert hat = user_created.', display_template: '{{betreff}} → {{fuer.first_name}}' },
    fields: [
      idField(),
      str('message_id', { required: true, max: 998, note: 'Message-ID der Mail (bleibt beim Verschieben gleich)' }),
      select('ordner', [['eingang', 'Eingang'], ['gesendet', 'Gesendet']], { def: 'eingang' }),
      int('uid', { note: 'IMAP-UID im Ordner (zum schnellen Öffnen)' }),
      str('betreff', { max: 255 }),
      str('von', { max: 255 }),
      timestamp('datum', { note: 'Datum der Mail' }),
      m2o('fuer', 'directus_users', { type: 'uuid', required: true, note: 'für wen', template: '{{first_name}} {{last_name}}' }),
      str('notiz', { max: 300, note: 'kurzer Hinweis, z.B. „Kannst du das übernehmen?“' }),
      bool('erledigt'),
      ...systemFields(),
    ],
    relations: [{ field: 'fuer', related_collection: 'directus_users', schema: { on_delete: 'CASCADE' } }],
  },
  {
    collection: 'push_abos',
    meta: { icon: 'notifications_active', note: 'Geräte mit Push-Benachrichtigungen (Vereinsheim → Mein Profil). Wem es gehört = user_created.', display_template: '{{geraet}} · {{user_created.first_name}}' },
    fields: [
      idField(),
      str('endpoint', { required: true, unique: true, max: 1000, note: 'Push-Adresse des Browsers' }),
      str('p256dh', { required: true, width: 'half', max: 200 }),
      str('auth', { required: true, width: 'half', max: 100 }),
      str('geraet', { max: 80, note: 'z.B. „iPhone · Safari“' }),
      bool('post', { note: 'Auch neue Mails im Kontakt-Postfach (nur Vorstand)' }),
      ...systemFields(),
    ],
  },
  {
    collection: 'rundbriefe',
    meta: { icon: 'campaign', note: 'Rundbriefe (Newsletter) aus dem Vereinsheim: Entwürfe und verschickte, zum Ansehen und Duplizieren. Versand über Brevo.', display_template: '{{betreff}}' },
    fields: [
      idField(),
      select('status', [['entwurf', 'Entwurf'], ['verschickt', 'Verschickt']], { def: 'entwurf' }),
      str('betreff', { required: true, max: 200 }),
      markdown('text', { required: true, note: 'Mail-Text wie im Vereinsheim (Begrüßung, # Überschrift, ==Hervorhebung==, Bilder …)' }),
      timestamp('verschickt_am'),
      int('empfaenger_anzahl'),
      int('brevo_kampagne', { note: 'ID der Kampagne in Brevo (für Zustell-/Öffnungszahlen)' }),
      ...systemFields(),
    ],
  },

  /* Dorfanzeiger */
  {
    collection: 'ressorts',
    meta: { icon: 'category', note: 'Ressorts des Dorfanzeigers.', display_template: '{{name}}', sort_field: 'sort' },
    fields: [
      idField(),
      str('name', { required: true, width: 'half', max: 60 }),
      slug('Filter im Dorfanzeiger'),
      sort(),
      ...systemFields(),
    ],
  },
  {
    collection: 'ausgaben',
    meta: { icon: 'newspaper', note: 'Dorfanzeiger-Ausgaben. Die neueste erschienene ist die aktuelle.', display_template: 'Nr. {{nummer}} · {{jahreszeit}} {{jahr}}', sort_field: null },
    fields: [
      idField(),
      int('nummer', { required: true, unique: true, min: 1 }),
      select('jahreszeit', [['fruehling', 'Frühling'], ['sommer', 'Sommer'], ['herbst', 'Herbst'], ['winter', 'Winter']], { required: true }),
      int('jahr', { required: true }),
      str('motto', { width: 'half', max: 120 }),
      file('bild', { folder: 'artikel' }),
      str('bild_alt', { width: 'half', max: 200 }),
      date('erschienen_am', { note: 'Leer = angekündigt' }),
      ...systemFields(),
    ],
    relations: [{ field: 'bild', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } }],
  },
  {
    collection: 'artikel',
    meta: { icon: 'article', note: 'Dorfanzeiger-Artikel (/dorfanzeiger/:slug). Porträt = Ressort „Porträts“ mit portraet_name/-zitat.', display_template: '{{titel}}', sort_field: 'sort', ...archive },
    fields: [
      idField(),
      statusField(STATUS_PUBLISH, 'draft'),
      str('titel', { required: true, max: 200 }),
      slug('Adresse: /dorfanzeiger/<slug>'),
      str('teaser_titel', { width: 'half', max: 120, note: 'Kürzerer Titel für Teaser' }),
      text('teaser', { note: 'Vorspann / Teaser im Dorfanzeiger' }),
      text('teaser_kurz', { note: 'Noch kürzer für die Startseite' }),
      m2o('ressort', 'ressorts', { required: true, template: '{{name}}' }),
      m2o('ausgabe', 'ausgaben', { template: 'Nr. {{nummer}}' }),
      sort(),
      bool('titelgeschichte', { note: 'Max. eine je Ausgabe' }),
      bool('hervorgehoben', { note: 'Startseite „Was bisher geschah“ (3 Stück)' }),
      str('autor_in', { width: 'half', max: 120 }),
      file('autor_in_bild', { note: 'Kleines Rundbild', folder: 'artikel' }),
      date('veroeffentlicht_am'),
      str('datum_text', { width: 'half', max: 60, note: 'Statt Datum („November“, „Datum folgt“)' }),
      int('lesedauer_minuten', { min: 1 }),
      int('seite', { min: 1, note: '„Seite 1“ in der Kopfzeile' }),
      file('bild', { folder: 'artikel' }),
      str('bild_alt', { width: 'half', max: 200 }),
      str('bildunterschrift', { max: 255 }),
      markdown('inhalt', { note: 'Markdown. Bild mit Unterschrift: ![Alt](url "Unterschrift"). Zitat: > … und > — Quelle' }),
      str('aufruf_titel', { width: 'half', max: 120, note: 'Gelber Kasten am Ende (optional)' }),
      str('aufruf_knopf', { width: 'half', max: 40 }),
      text('aufruf_text'),
      str('aufruf_link', { width: 'half', max: 255 }),
      str('portraet_name', { width: 'half', max: 120, note: 'Nur Ressort „Porträts“' }),
      text('portraet_zitat', { note: 'Nur Ressort „Porträts“: speist „Fünf Fragen an …“' }),
      ...systemFields(),
    ],
    relations: [
      { field: 'ressort', related_collection: 'ressorts', schema: { on_delete: 'NO ACTION' } },
      { field: 'ausgabe', related_collection: 'ausgaben', schema: { on_delete: 'SET NULL' } },
      { field: 'autor_in_bild', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
      { field: 'bild', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
    ],
  },
  {
    collection: 'kleinanzeigen',
    meta: { icon: 'sell', note: 'Kleinanzeigen im Dorfanzeiger – maximal 4 veröffentlichte.', display_template: '{{ueberschrift}}', sort_field: 'sort' },
    fields: [
      idField(),
      statusField([['published', 'Veröffentlicht'], ['draft', 'Entwurf']], 'draft'),
      str('ueberschrift', { required: true, max: 80, note: 'z.B. „Gesucht: Kuchen“' }),
      text('kurzbeschreibung', { max: 80 }),
      str('link_text', { width: 'half', max: 40, note: 'z.B. „melde dich!“' }),
      email('ziel_email', { note: 'Ziel des Links (mailto: mit Betreff „Kleinanzeige: …“)' }),
      sort(),
      ...systemFields(),
    ],
  },
  {
    collection: 'leserbriefe',
    meta: { icon: 'mail', note: 'Leserbriefe – erscheinen sofort, „Ausgeblendet“ nimmt sie raus.', display_template: '{{name}}: {{text}}' },
    fields: [
      idField(),
      statusField([['published', 'Sichtbar'], ['hidden', 'Ausgeblendet']], 'published'),
      str('anrede', { width: 'half', max: 80, note: 'Überschrift des Briefs, leer = „Liebe Nachbar*innen,“' }),
      str('name', { required: true, width: 'half', max: 80 }),
      text('text', { required: true, max: 600 }),
      m2o('artikel', 'artikel', { note: 'Zu welchem Beitrag (optional)', template: '{{titel}}' }),
      ...systemFields(),
    ],
    relations: [{ field: 'artikel', related_collection: 'artikel', schema: { on_delete: 'SET NULL' } }],
  },
  {
    collection: 'gastbeitrag_einladungen',
    meta: { icon: 'key', note: 'Private Links /gastbeitrag/:schluessel. Schlüssel erzeugt das Vereinsheim.', display_template: '{{name}}' },
    fields: [
      idField(),
      statusField([['offen', 'Offen'], ['eingereicht', 'Eingereicht'], ['widerrufen', 'Widerrufen']], 'offen'),
      str('schluessel', { required: true, unique: true, max: 64, note: 'Zufällig, ≥ 24 Zeichen' }),
      str('name', { required: true, width: 'half', max: 120, note: 'Für wen („Hallo Marta!“)' }),
      m2o('ressort', 'ressorts', { note: 'Vorauswahl', template: '{{name}}' }),
      date('gueltig_bis', { note: 'Leer = unbegrenzt' }),
      bool('mehrfach', { note: 'Mehrere Beiträge über denselben Link' }),
      text('notiz', { note: 'Intern: worum es gehen soll' }),
      ...systemFields(),
    ],
    relations: [{ field: 'ressort', related_collection: 'ressorts', schema: { on_delete: 'SET NULL' } }],
  },
  {
    collection: 'gastbeitraege',
    meta: { icon: 'edit_note', note: `Eingereichte Gastbeiträge, warten aufs Okay. ${DOT}`, display_template: '{{titel}} · {{autor_in}}' },
    fields: [
      idField(),
      statusField([['eingereicht', 'Eingereicht'], ['angenommen', 'Angenommen'], ['abgelehnt', 'Abgelehnt']], 'eingereicht'),
      m2o('einladung', 'gastbeitrag_einladungen', { template: '{{name}}' }),
      str('titel', { required: true, max: 200 }),
      text('teaser'),
      markdown('inhalt', { required: true, note: 'Markdown (Leerzeile = Absatz)' }),
      m2o('ressort', 'ressorts', { template: '{{name}}' }),
      file('bild', { folder: 'gastbeitraege' }),
      str('bildunterschrift', { width: 'half', max: 255 }),
      str('foto_von', { width: 'half', max: 120 }),
      str('autor_in', { required: true, width: 'half', max: 120 }),
      email('email', { required: true, note: 'Nur für Rückfragen, nie öffentlich' }),
      bool('rechte_bestaetigt', { note: 'Pflicht' }),
      m2o('geprueft_von', 'directus_users', { type: 'uuid', note: 'Wer angenommen/abgelehnt hat', template: '{{first_name}} {{last_name}}' }),
      m2o('artikel', 'artikel', { note: 'Nach dem Annehmen', template: '{{titel}}' }),
      timestamp('erschienen_mail_am', { note: '„Dein Beitrag ist erschienen“-Mail verschickt' }),
      ...systemFields(),
    ],
    relations: [
      { field: 'einladung', related_collection: 'gastbeitrag_einladungen', schema: { on_delete: 'SET NULL' } },
      { field: 'ressort', related_collection: 'ressorts', schema: { on_delete: 'SET NULL' } },
      { field: 'bild', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } },
      { field: 'geprueft_von', related_collection: 'directus_users', schema: { on_delete: 'SET NULL' } },
      { field: 'artikel', related_collection: 'artikel', schema: { on_delete: 'SET NULL' } },
    ],
  },

  /* Über uns, Startseite, Mitmachen */
  {
    collection: 'stimmen',
    meta: { icon: 'format_quote', note: '„Stimmen aus dem Verein“ (Über uns).', display_template: '{{name}}', sort_field: 'sort' },
    fields: [
      idField(),
      statusField([['published', 'Veröffentlicht'], ['draft', 'Entwurf']], 'draft'),
      str('name', { required: true, width: 'half', max: 80 }),
      text('zitat', { required: true, max: 400 }),
      file('bild', { note: 'Quadratisch', folder: 'stimmen' }),
      str('bild_alt', { width: 'half', max: 200 }),
      sort(),
      ...systemFields(),
    ],
    relations: [{ field: 'bild', related_collection: 'directus_files', schema: { on_delete: 'SET NULL' } }],
  },
  {
    collection: 'faq',
    meta: { icon: 'help', note: 'Fragen auf der Startseite.', display_template: '{{frage}}', sort_field: 'sort' },
    fields: [
      idField(),
      statusField([['published', 'Veröffentlicht'], ['draft', 'Entwurf']], 'draft'),
      str('frage', { required: true, max: 200 }),
      markdown('antwort', { required: true }),
      sort(),
      ...systemFields(),
    ],
  },
  {
    collection: 'ideen',
    meta: { icon: 'lightbulb', note: 'Ideenwand „Was fehlt dir in Königsdorf?“ – sofort sichtbar, moderierbar.', display_template: '{{name}}: {{text}}' },
    fields: [
      idField(),
      statusField([['published', 'Sichtbar'], ['hidden', 'Ausgeblendet']], 'published'),
      str('name', { width: 'half', max: 80 }),
      text('text', { required: true, max: 280 }),
      ...systemFields(),
    ],
  },
  {
    collection: 'vorschlaege',
    meta: { icon: 'emoji_objects', note: `Eingereichte Ideen/Angebote (Mitmachen). ${DOT}`, display_template: '{{name}}: {{idee}}' },
    fields: [
      idField(),
      statusField([['neu', 'Neu'], ['in_planung', 'In Planung'], ['umgesetzt', 'Umgesetzt'], ['abgelehnt', 'Abgelehnt']], 'neu'),
      str('name', { required: true, width: 'half', max: 120 }),
      email('email', { required: true }),
      text('idee', { required: true }),
      bool('dorffest', { note: 'Für das Dorffest' }),
      bool('selbst_mitmachen', { note: 'Will selbst mitmachen' }),
      text('notiz', { note: 'Intern' }),
      ...systemFields(),
    ],
  },
  {
    collection: 'plenum_erinnerungen',
    meta: { icon: 'notifications', note: `Erinnerungen ans Plenum. ${DOT}`, display_template: '{{name}} <{{email}}>' },
    fields: [
      idField(),
      str('name', { width: 'half', max: 120 }),
      email('email', { required: true }),
      select('wie', [['jedes', 'Jedes Plenum'], ['naechstes', 'Nur das nächste']], { required: true, def: 'jedes' }),
      bool('bestaetigt', { note: 'Double-Opt-in' }),
      timestamp('abgemeldet_am'),
      timestamp('zuletzt_erinnert_am'),
      ...systemFields(),
    ],
  },

  /* Mitglieder & Finanzen */
  {
    collection: 'mitglieder',
    meta: { icon: 'badge', note: 'Mitgliederliste – nur Vorstand.', display_template: '{{vorname}} {{nachname}}' },
    fields: [
      idField(),
      statusField([['aktiv', 'Aktiv'], ['ausgetreten', 'Ausgetreten'], ['gestrichen', 'Gestrichen']], 'aktiv'),
      select('art', [['foerder', 'Fördermitglied'], ['stimmberechtigt', 'Stimmberechtigt']], { required: true }),
      str('vorname', { required: true, width: 'half', max: 80 }),
      str('nachname', { required: true, width: 'half', max: 80 }),
      str('strasse', { width: 'half', max: 120 }),
      str('plz', { width: 'half', max: 10 }),
      str('ort', { width: 'half', max: 80 }),
      email('email'),
      str('telefon', { width: 'half', max: 40 }),
      date('mitglied_seit'),
      date('austritt_zum'),
      decimal('beitrag_jahr', { note: '€ im Jahr' }),
      date('beitrag_bezahlt_bis'),
      text('notiz'),
      m2o('user', 'directus_users', { type: 'uuid', note: 'Vereinsheim-Zugang (optional)', template: '{{first_name}} {{last_name}}' }),
      ...systemFields(),
    ],
    relations: [{ field: 'user', related_collection: 'directus_users', schema: { on_delete: 'SET NULL' } }],
  },
  {
    collection: 'mitgliedsantraege',
    meta: { icon: 'person_add', note: `Anträge von /mitglied-werden – nur Vorstand. ${DOT}`, display_template: '{{vorname}} {{nachname}} ({{art}})' },
    fields: [
      idField(),
      statusField([['eingereicht', 'Eingereicht'], ['angenommen', 'Angenommen'], ['abgelehnt', 'Abgelehnt']], 'eingereicht'),
      select('art', [['foerder', 'Fördermitglied'], ['regulaer', 'Reguläres Mitglied']], { required: true }),
      select('beitrag_stufe', [['foerder_3', 'Förder 3 €/Monat'], ['foerder_5', 'Förder 5 €/Monat'], ['foerder_10', 'Förder 10 €/Monat'], ['foerder_eigen', 'Förder, eigener Betrag'], ['standard', 'Standard (24 €+/Jahr)'], ['ermaessigt', 'Ermäßigt (12 €/Jahr)']], { required: true }),
      decimal('beitrag_jahr', { required: true, note: '€ im Jahr' }),
      str('vorname', { required: true, width: 'half', max: 80 }),
      str('nachname', { required: true, width: 'half', max: 80 }),
      str('strasse', { required: true, width: 'half', max: 120 }),
      str('plz', { required: true, width: 'half', max: 10 }),
      str('ort', { required: true, width: 'half', max: 80 }),
      email('email', { required: true }),
      str('telefon', { width: 'half', max: 40 }),
      bool('plenum_besucht', { note: 'Nur reguläre Mitglieder (Selbstauskunft)' }),
      text('nachricht'),
      timestamp('satzung_anerkannt_am', { note: 'Textform-Nachweis' }),
      timestamp('entschieden_am'),
      m2o('entschieden_von', 'directus_users', { type: 'uuid', template: '{{first_name}} {{last_name}}' }),
      m2o('mitglied', 'mitglieder', { note: 'Gesetzt bei Annahme', template: '{{vorname}} {{nachname}}' }),
      ...systemFields(),
    ],
    relations: [
      { field: 'entschieden_von', related_collection: 'directus_users', schema: { on_delete: 'SET NULL' } },
      { field: 'mitglied', related_collection: 'mitglieder', schema: { on_delete: 'SET NULL' } },
    ],
  },
  {
    collection: 'auslagen',
    meta: { icon: 'receipt_long', note: 'Auslagen einreichen. Mitglieder sehen nur ihre eigenen.', display_template: '{{titel}} · {{betrag}} €' },
    fields: [
      idField(),
      statusField([['eingereicht', 'Eingereicht'], ['genehmigt', 'Genehmigt'], ['ausgezahlt', 'Ausgezahlt'], ['abgelehnt', 'Abgelehnt']], 'eingereicht'),
      str('titel', { required: true, max: 160, note: 'Wofür' }),
      decimal('betrag', { required: true, note: '€' }),
      date('datum', { required: true, note: 'Datum der Ausgabe' }),
      m2o('termin', 'termine', { note: 'Zuordnung zu einer Veranstaltung (optional)', template: '{{titel}}' }),
      { field: 'belege', type: 'alias', meta: { interface: 'files', special: ['files'], note: 'Foto/PDF des Kassenbons', options: { folder: '$folder:belege' } }, schema: null, alias: true },
      str('kontoinhaber_in', { width: 'half', max: 120 }),
      str('iban', { width: 'half', max: 40 }),
      text('notiz'),
      ...systemFields(),
    ],
    relations: [{ field: 'termin', related_collection: 'termine', schema: { on_delete: 'SET NULL' } }],
  },
  {
    // Junction für auslagen.belege (M2M zu directus_files)
    collection: 'auslagen_belege',
    meta: { icon: 'import_export', hidden: true, note: 'Verknüpfung Auslage ↔ Beleg-Dateien' },
    fields: [
      idField(),
      { field: 'auslagen_id', type: 'integer', meta: { hidden: true }, schema: {} },
      { field: 'directus_files_id', type: 'uuid', meta: { hidden: true }, schema: {} },
    ],
    relations: [
      { field: 'auslagen_id', related_collection: 'auslagen', meta: { one_field: 'belege', junction_field: 'directus_files_id', sort_field: null }, schema: { on_delete: 'CASCADE' } },
      { field: 'directus_files_id', related_collection: 'directus_files', meta: { junction_field: 'auslagen_id' }, schema: { on_delete: 'SET NULL' } },
    ],
  },
  {
    collection: 'verein',
    meta: { icon: 'home', singleton: true, note: 'Kontakt, Konto, Infochannel-Link.' },
    fields: [
      idField(),
      email('kontakt_email', { note: 'Ohne Umlaute (Mail)' }),
      str('kontoinhaber', { width: 'half', max: 120 }),
      str('iban', { width: 'half', max: 40 }),
      str('infochannel_url', { max: 255, note: 'WhatsApp-Infochannel' }),
      date('naechstes_dorffest'),
      ...systemFields(),
    ],
  },
]

// user_created/user_updated an jeder Collection mit Systemfeldern verknüpfen
for (const c of COLLECTIONS) {
  c.relations ||= []
  if (c.fields.some((f) => f.field === 'user_created')) c.relations.push(...systemRelations())
}

// Zusätzliche Felder an System-Collections
const SYSTEM_FIELDS = {
  // Login im Vereinsheim auch mit Benutzernamen: die Login-Route sucht damit die E-Mail
  // (Directus selbst meldet nur per E-Mail an)
  directus_users: [
    {
      ...str('benutzername', { unique: true, width: 'half', max: 30 }),
      meta: { interface: 'input', width: 'half', note: 'Login im Vereinsheim (statt E-Mail). Nur a–z, 0–9, . _ -', options: { trim: true }, validation: { benutzername: { _regex: '^[a-z0-9._-]{3,30}$' } }, validation_message: '3–30 Zeichen: a–z, 0–9, . _ -' },
    },
    // Tour durchs Vereinsheim gemacht oder abgelehnt → wird nicht mehr vorgeschlagen (im Konto wiederholbar)
    timestamp('tour_erledigt_am', { note: 'Vereinsheim-Tour gemacht oder abgelehnt' }),
  ],
}

/* ── Flows ─────────────────────────────────────────────── */

// Sechs Monate nach der Ablehnung (bzw. der letzten Änderung) löschen
const VOR_6_MONATEN = '$NOW(-6 months)'
const alt = (feld) => ({ _or: [{ [feld]: { _lt: VOR_6_MONATEN } }, { _and: [{ [feld]: { _null: true } }, { date_created: { _lt: VOR_6_MONATEN } }] }] })

// Operationen laufen der Reihe nach (resolve → nächste)
const FLOWS = [
  {
    name: 'Kleinanzeigen: max. 4 veröffentlicht',
    icon: 'sell',
    description: 'Verhindert eine fünfte veröffentlichte Kleinanzeige (Bauplan: DIRECTUS.md).',
    trigger: 'event',
    options: { type: 'filter', scope: ['items.create', 'items.update'], collections: ['kleinanzeigen'], return: '$last' },
    operations: [
      { key: 'veroeffentlicht', name: 'Veröffentlichte lesen', type: 'item-read', options: { collection: 'kleinanzeigen', permissions: '$full', query: { filter: { status: { _eq: 'published' } }, fields: ['id'], limit: -1 } } },
      {
        key: 'pruefen', name: 'Höchstens 4', type: 'exec', options: {
          code: [
            'module.exports = async function (data) {',
            '  const payload = data.$trigger.payload || {}',
            '  if (payload.status !== \'published\') return payload',
            '  const keys = (data.$trigger.keys || []).map(String)',
            '  const andere = (data.veroeffentlicht || []).filter((k) => !keys.includes(String(k.id)))',
            '  if (andere.length + Math.max(keys.length, 1) > 4) throw new Error(\'Es sind schon 4 Kleinanzeigen veröffentlicht – bitte erst eine zurückziehen.\')',
            '  return payload',
            '}',
          ].join('\n'),
        },
      },
    ],
  },
  {
    // Post-Pushes nur für den Vorstand: ändert sich Rolle oder Status, gibt es keine mehr, bis die Person
    // sie unter „Mein Profil“ neu einschaltet (dann prüft der Server, ob sie im Vorstand ist)
    name: 'Push: Post-Benachrichtigungen bei Rollenwechsel aus',
    icon: 'notifications_off',
    description: 'Setzt push_abos.post auf false, wenn sich bei einem User Rolle oder Status ändert.',
    trigger: 'event',
    options: { type: 'action', scope: ['items.update'], collections: ['directus_users'] },
    operations: [
      {
        key: 'geaendert', name: 'Rolle oder Status geändert?', type: 'exec', options: {
          code: [
            'module.exports = async function (data) {',
            '  const payload = data.$trigger.payload || {}',
            '  return { ja: \'role\' in payload || \'status\' in payload }',
            '}',
          ].join('\n'),
        },
      },
      { key: 'nur_dann', name: 'Nur dann', type: 'condition', options: { filter: { geaendert: { ja: { _eq: true } } } } },
      { key: 'aus', name: 'Post-Pushes aus', type: 'item-update', options: { collection: 'push_abos', permissions: '$full', query: { filter: { user_created: { _in: '{{$trigger.keys}}' } }, limit: -1 }, payload: { post: false } } },
    ],
  },
  {
    name: 'Aufräumen: Abgelehntes nach 6 Monaten löschen',
    icon: 'delete_sweep',
    description: 'Täglich um 3 Uhr: abgelehnte Gastbeiträge und Mitgliedsanträge, die älter als 6 Monate sind.',
    trigger: 'schedule',
    options: { cron: '0 0 3 * * *' },
    operations: [
      { key: 'gastbeitraege', name: 'Gastbeiträge', type: 'item-delete', options: { collection: 'gastbeitraege', permissions: '$full', query: { filter: { _and: [{ status: { _eq: 'abgelehnt' } }, alt('date_updated')] }, limit: -1 } } },
      { key: 'antraege', name: 'Mitgliedsanträge', type: 'item-delete', options: { collection: 'mitgliedsantraege', permissions: '$full', query: { filter: { _and: [{ status: { _eq: 'abgelehnt' } }, alt('entschieden_am')] }, limit: -1 } } },
    ],
  },
]

/* ── Policies & Rechte ─────────────────────────────────── */

const POLICIES = {
  Server: { icon: 'dns', description: 'Website (Netlify): liest Veröffentlichtes, legt Einreichungen an. Token: NUXT_DIRECTUS_TOKEN.' },
  Mitglied: { icon: 'groups', description: 'Vereinsmitglieder im Vereinsheim: Inhalte pflegen, Anmeldungen sehen, eigene Auslagen.' },
  Vorstand: { icon: 'workspace_premium', description: 'Vorstand (zusätzlich zu Mitglied): Mitgliedsanträge, Mitgliederliste, alle Auslagen.' },
}

// Rollen bündeln Policies: beim User nur die Rolle wählen. Ohne App Access → kein Lizenz-Seat.
const ROLES = {
  Mitglied: { icon: 'groups', description: 'Vereinsheim-Zugang für Mitglieder', policies: ['Mitglied'] },
  Vorstand: { icon: 'workspace_premium', description: 'Vereinsheim-Zugang für den Vorstand', policies: ['Mitglied', 'Vorstand'] },
}

const PUBLISHED = { status: { _eq: 'published' } }
const OWN = { user_created: { _eq: '$CURRENT_USER' } }
const CRUD = ['create', 'read', 'update', 'delete']
const all = (collection, actions = CRUD) => actions.map((action) => ({ collection, action, fields: ['*'] }))

// Ordner-IDs werden zur Laufzeit eingesetzt ($folder:name)
const PERMISSIONS = {
  Server: [
    { collection: 'termine', action: 'read', fields: ['*'], permissions: PUBLISHED },
    { collection: 'anmeldungen', action: 'create', fields: ['termin', 'name', 'email', 'personen', 'nachricht', 'mitbringen'], validation: { personen: { _between: [1, 10] } } },
    // date_created: Plätze bei regelmäßigen Terminen nur seit dem letzten Termin zählen
    { collection: 'anmeldungen', action: 'read', fields: ['id', 'termin', 'personen', 'status', 'date_created'] },
    // „Klick hier, um dich wieder auszutragen“ (signierter Link in der Bestätigungsmail): nur auf abgemeldet setzen
    { collection: 'anmeldungen', action: 'update', fields: ['status'], validation: { status: { _eq: 'abgemeldet' } } },
    { collection: 'beitraege', action: 'create', fields: ['termin', 'name', 'was', 'email'] },
    { collection: 'ressorts', action: 'read', fields: ['*'] },
    { collection: 'ausgaben', action: 'read', fields: ['*'] },
    { collection: 'artikel', action: 'read', fields: ['*'], permissions: PUBLISHED },
    { collection: 'kleinanzeigen', action: 'read', fields: ['*'], permissions: PUBLISHED },
    { collection: 'leserbriefe', action: 'create', fields: ['anrede', 'name', 'text', 'artikel'] },
    { collection: 'leserbriefe', action: 'read', fields: ['id', 'status', 'anrede', 'name', 'text', 'artikel', 'date_created'], permissions: PUBLISHED },
    { collection: 'gastbeitrag_einladungen', action: 'read', fields: ['id', 'status', 'schluessel', 'name', 'ressort', 'gueltig_bis', 'mehrfach', 'date_created'] },
    { collection: 'gastbeitrag_einladungen', action: 'update', fields: ['status'], permissions: { status: { _eq: 'offen' } }, validation: { status: { _in: ['offen', 'eingereicht'] } } },
    { collection: 'gastbeitraege', action: 'create', fields: ['einladung', 'titel', 'teaser', 'inhalt', 'ressort', 'bild', 'bildunterschrift', 'foto_von', 'autor_in', 'email', 'rechte_bestaetigt'], validation: { rechte_bestaetigt: { _eq: true } } },
    { collection: 'stimmen', action: 'read', fields: ['*'], permissions: PUBLISHED },
    { collection: 'faq', action: 'read', fields: ['*'], permissions: PUBLISHED },
    { collection: 'ideen', action: 'create', fields: ['name', 'text'] },
    { collection: 'ideen', action: 'read', fields: ['id', 'status', 'name', 'text', 'date_created'], permissions: PUBLISHED },
    { collection: 'vorschlaege', action: 'create', fields: ['name', 'email', 'idee', 'dorffest', 'selbst_mitmachen'] },
    { collection: 'plenum_erinnerungen', action: 'create', fields: ['name', 'email', 'wie'] },
    // Double-Opt-in: ID des neuen Eintrags für den signierten Link, dann bestätigen/abmelden
    // … und für die automatische Erinnerung (Netlify-Zeitplan → /api/plenum-erinnerung/automatisch)
    { collection: 'plenum_erinnerungen', action: 'read', fields: ['id', 'name', 'email', 'wie', 'bestaetigt', 'abgemeldet_am', 'zuletzt_erinnert_am'] },
    { collection: 'plenum_erinnerungen', action: 'update', fields: ['bestaetigt', 'abgemeldet_am', 'zuletzt_erinnert_am'] },
    { collection: 'mitgliedsantraege', action: 'create', fields: ['art', 'beitrag_stufe', 'beitrag_jahr', 'vorname', 'nachname', 'strasse', 'plz', 'ort', 'email', 'telefon', 'plenum_besucht', 'nachricht', 'satzung_anerkannt_am'] },
    { collection: 'verein', action: 'read', fields: ['*'] },
    // Push: neue Mail (Brevo-Eingang) an alle Post-Abos; Gerät neu zuordnen und Abgelaufenes löschen
    { collection: 'push_abos', action: 'read', fields: ['id', 'endpoint', 'p256dh', 'auth', 'post', 'user_created'] },
    { collection: 'push_abos', action: 'delete', fields: ['*'] },
    // Vereinsheim-Login: Benutzername → E-Mail (nur aktive User mit Benutzernamen)
    { collection: 'directus_users', action: 'read', fields: ['id', 'email', 'benutzername'], permissions: { _and: [{ benutzername: { _nnull: true } }, { status: { _eq: 'active' } }] } },
    // Konten ohne E-Mail: beim ersten Login Platzhalter `<benutzername>@ohne-mail.…` eintragen (nur wenn leer)
    { collection: 'directus_users', action: 'update', fields: ['email'], permissions: { _and: [{ benutzername: { _nnull: true } }, { email: { _null: true } }] }, validation: { email: { _ends_with: '@ohne-mail.koenigsdorf-rueckt-zusammen.de' } } },
    // Dateien: Bilder veröffentlichter Inhalte lesen (Ordner termine/artikel/stimmen),
    // Fotos von Gastbeiträgen hochladen (nur in den Ordner gastbeitraege)
    { collection: 'directus_files', action: 'read', fields: ['*'], permissions: { folder: { name: { _in: ['termine', 'artikel', 'stimmen', 'rundbrief'] } } }, aktualisieren: true },
    { collection: 'directus_files', action: 'create', fields: ['*'], presets: { folder: '$folder:gastbeitraege' }, validation: { folder: { _eq: '$folder:gastbeitraege' } } },
  ],
  Mitglied: [
    ...all('termine'),
    ...all('anmeldungen', ['read', 'update', 'delete']),
    ...all('beitraege', ['read', 'update', 'delete']),
    ...all('termin_rundmails', ['create', 'read']),
    ...all('ressorts', ['read']),
    ...all('ausgaben'),
    ...all('artikel'),
    ...all('kleinanzeigen'),
    ...all('leserbriefe', ['read', 'update', 'delete']),
    ...all('gastbeitrag_einladungen'),
    ...all('gastbeitraege', ['read', 'update']),
    ...all('stimmen'),
    ...all('faq'),
    ...all('ideen', ['read', 'update', 'delete']),
    ...all('vorschlaege', ['read', 'update']),
    ...all('plenum_erinnerungen', ['read', 'delete']),
    // Erinnerungen verschicken: „nur das nächste“ danach abmelden, Versand vermerken
    { collection: 'plenum_erinnerungen', action: 'update', fields: ['abgemeldet_am', 'zuletzt_erinnert_am'] },
    { collection: 'auslagen', action: 'create', fields: ['titel', 'betrag', 'datum', 'termin', 'belege', 'kontoinhaber_in', 'iban', 'notiz'] },
    { collection: 'auslagen', action: 'read', fields: ['*'], permissions: OWN },
    { collection: 'auslagen', action: 'update', fields: ['titel', 'betrag', 'datum', 'termin', 'belege', 'kontoinhaber_in', 'iban', 'notiz'], permissions: { _and: [OWN, { status: { _eq: 'eingereicht' } }] } },
    { collection: 'auslagen_belege', action: 'create', fields: ['*'] },
    { collection: 'auslagen_belege', action: 'read', fields: ['*'], permissions: { auslagen_id: OWN } },
    { collection: 'auslagen_belege', action: 'update', fields: ['*'], permissions: { auslagen_id: { _and: [OWN, { status: { _eq: 'eingereicht' } }] } } },
    ...all('verein', ['read']),
    // Push auf den eigenen Geräten; `post` (Kontakt-Postfach) setzt nur der Vorstand
    { collection: 'push_abos', action: 'create', fields: ['endpoint', 'p256dh', 'auth', 'geraet'] },
    { collection: 'push_abos', action: 'read', fields: ['*'], permissions: OWN },
    { collection: 'push_abos', action: 'delete', fields: ['*'], permissions: OWN },
    // Dateien: alles außer fremden Belegen lesen, hochladen, Nicht-Belege bearbeiten
    { collection: 'directus_files', action: 'create', fields: ['*'] },
    { collection: 'directus_files', action: 'read', fields: ['*'], permissions: { _or: [{ folder: { _null: true } }, { folder: { name: { _neq: 'belege' } } }, { uploaded_by: { _eq: '$CURRENT_USER' } }] } },
    { collection: 'directus_files', action: 'update', fields: ['*'], permissions: { _or: [{ folder: { _null: true } }, { folder: { name: { _neq: 'belege' } } }, { uploaded_by: { _eq: '$CURRENT_USER' } }] } },
    { collection: 'directus_folders', action: 'read', fields: ['*'] },
    // Namen anderer (wer hat angelegt/geprüft), eigenes Konto bearbeiten (Name, Passwort, Profilbild, Tour)
    { collection: 'directus_users', action: 'read', fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'benutzername', 'tour_erledigt_am'] },
    { collection: 'directus_users', action: 'update', fields: ['first_name', 'last_name', 'email', 'password', 'avatar', 'tour_erledigt_am'], permissions: { id: { _eq: '$CURRENT_USER' } } },
  ],
  // Vorstand bekommt zusätzlich zu Mitglied alles (Policies addieren sich)
  Vorstand: [
    ...COLLECTIONS.flatMap((c) => all(c.collection)),
    ...all('directus_files'),
    { collection: 'directus_users', action: 'read', fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'benutzername', 'status', 'last_access', 'role'] },
    // Post markieren: nur Personen mit Rolle Vorstand zur Auswahl (sie sehen das Postfach)
    { collection: 'directus_roles', action: 'read', fields: ['id', 'name'] },
  ],
}

/* ── Ablauf ────────────────────────────────────────────── */

async function list() {
  const policies = await api('GET', '/policies?fields=id,name,admin_access,app_access&limit=-1')
  const label = (id) => {
    const p = policies.find((x) => x.id === id)
    return !p ? id : p.name === '$t:public_label' ? 'Öffentlich (Public)' : p.name
  }
  console.log('Policies:\n')
  for (const p of policies) console.log(`  ${p.id}  ${label(p.id)}${p.admin_access ? '  (Admin)' : ''}${p.app_access ? '  (App Access)' : ''}`)
  const access = await api('GET', '/access?fields=policy,role.name,user.first_name,user.email&limit=-1')
  console.log('\nZuordnung (Rolle/User → Policy):\n')
  for (const a of access) console.log(`  ${a.role?.name || a.user?.email || a.user?.first_name || 'ÖFFENTLICH'} → ${label(a.policy)}`)
  const perms = await api('GET', '/permissions?limit=-1&fields=policy,collection,action,fields,permissions')
  console.log('\nRechte je Policy:')
  for (const p of policies.filter((x) => !x.admin_access)) {
    const byCol = {}
    for (const r of perms.filter((x) => x.policy === p.id)) {
      const extra = [r.permissions && Object.keys(r.permissions).length ? 'Filter' : '', r.fields?.includes('*') ? '' : `Felder: ${r.fields?.join(', ')}`].filter(Boolean).join('; ')
      ;(byCol[r.collection] ||= []).push(extra ? `${r.action} (${extra})` : r.action)
    }
    const lines = Object.entries(byCol).sort().map(([c, a]) => `    ${c}: ${a.join(', ')}`)
    console.log(`\n  ${label(p.id)}${lines.length ? '' : '  – keine Rechte'}\n${lines.join('\n')}`)
  }
}

// Ersetzt $folder:name in Filtern/Presets/Optionen durch die Ordner-ID
function withFolders(obj, folders) {
  if (obj == null) return obj
  return JSON.parse(JSON.stringify(obj), (_, v) => (typeof v === 'string' && v.startsWith('$folder:') ? folders[v.slice(8)] || v : v))
}

const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const filterOrNull = (f) => (f && Object.keys(f).length ? f : null)

async function main() {
  if (flag('list')) return list()

  // 1. Ordner
  const existingFolders = await api('GET', '/folders?limit=-1&fields=id,name,parent,type')
  const folders = {}
  for (const name of FOLDERS) {
    const have = existingFolders.find((f) => f.name === name && !f.parent && (f.type ?? 'files') === 'files')
    if (have) { folders[name] = have.id; skipped.push(`Ordner ${name} – schon vorhanden`); continue }
    const created = await step(`Ordner ${name} anlegen`, () => api('POST', '/folders', { name, type: 'files' }))
    if (created) folders[name] = created.id
  }

  // 2. Collections + Felder
  const existing = new Set((await api('GET', '/collections?limit=-1')).map((c) => c.collection))
  for (const c of COLLECTIONS) {
    const fields = withFolders(c.fields, folders).map(({ alias, ...f }) => (alias ? { ...f, schema: undefined } : f))
    if (!existing.has(c.collection)) {
      await step(`Collection ${c.collection} anlegen (${fields.length} Felder)`, () =>
        api('POST', '/collections', { collection: c.collection, meta: c.meta, schema: {}, fields }))
      continue
    }
    const have = new Set((await api('GET', `/fields/${c.collection}`)).map((f) => f.field))
    let missing = 0
    for (const f of fields) {
      if (have.has(f.field)) continue
      missing++
      await step(`Feld ${c.collection}.${f.field} anlegen`, () => api('POST', `/fields/${c.collection}`, f))
    }
    skipped.push(`Collection ${c.collection} – schon vorhanden${missing ? ` (${missing} fehlende Felder)` : ''}`)
  }

  for (const [collection, list] of Object.entries(SYSTEM_FIELDS)) {
    const have = new Set((await api('GET', `/fields/${collection}`)).map((f) => f.field))
    for (const f of list) {
      if (have.has(f.field)) { skipped.push(`Feld ${collection}.${f.field} – schon vorhanden`); continue }
      await step(`Feld ${collection}.${f.field} anlegen`, () => api('POST', `/fields/${collection}`, f))
    }
  }

  // 3. Relationen (erst, wenn alle Collections da sind)
  const relations = await api('GET', '/relations')
  for (const c of COLLECTIONS) {
    for (const r of c.relations) {
      if (relations.some((x) => x.collection === c.collection && x.field === r.field)) {
        skipped.push(`Relation ${c.collection}.${r.field} – schon vorhanden`)
        continue
      }
      await step(`Relation ${c.collection}.${r.field} → ${r.related_collection}`, () =>
        api('POST', '/relations', { collection: c.collection, ...r }))
    }
  }

  // 4. Policies (ohne App Access, ohne Admin)
  const policies = await api('GET', '/policies?fields=id,name,app_access,admin_access&limit=-1')
  const policyIds = {}
  for (const [name, def] of Object.entries(POLICIES)) {
    const same = policies.filter((p) => p.name === name)
    if (same.length > 1) { failed.push(`Es gibt ${same.length} Policies namens „${name}“ – bitte in Directus klären`); continue }
    if (same[0]) {
      policyIds[name] = same[0].id
      skipped.push(`Policy ${name} – schon vorhanden`)
      if (same[0].app_access || same[0].admin_access) warnings.push(`Policy ${name} hat App/Admin Access – laut Bauplan nicht vorgesehen (Lizenz-Seats)`)
      continue
    }
    const created = await step(`Policy ${name} anlegen (ohne App Access)`, () =>
      api('POST', '/policies', { name, icon: def.icon, description: def.description, app_access: false, admin_access: false, enforce_tfa: false }))
    policyIds[name] = created?.id || `<neu:${name}>`
  }

  // 5. Rechte
  const perms = DRY && Object.values(policyIds).every((id) => id.startsWith('<neu')) ? [] : await api('GET', '/permissions?limit=-1&fields=id,policy,collection,action,fields,permissions,validation,presets')
  for (const [name, list] of Object.entries(PERMISSIONS)) {
    const policy = policyIds[name]
    if (!policy) continue
    for (const raw of list) {
      const want = withFolders(raw, folders)
      const label = `${name}: ${want.action} auf ${want.collection}`
      const have = perms.find((p) => p.policy === policy && p.collection === want.collection && p.action === want.action)
      if (have) {
        // Neue Felder aus dem Bauplan werden angehängt (nur hinzufügen, nie entfernen)
        const hf = have.fields || []
        const missing = hf.includes('*') ? [] : want.fields.filter((f) => !hf.includes(f))
        if (missing.length) {
          await step(`${label} – Felder ergänzt: ${missing.join(', ')}`, () =>
            api('PATCH', `/permissions/${have.id}`, { fields: missing.includes('*') ? ['*'] : [...hf, ...missing] }))
        }
        else skipped.push(`${label} – schon vorhanden`)
        const filterAnders = !sameJson(filterOrNull(have.permissions), filterOrNull(want.permissions))
        // `aktualisieren: true` im Bauplan: Filter darf angeglichen werden (z.B. neuer Bild-Ordner)
        if (filterAnders && want.aktualisieren) {
          await step(`${label} – Filter aktualisiert`, () => api('PATCH', `/permissions/${have.id}`, { permissions: want.permissions || null }))
          continue
        }
        const differs = !sameJson([...new Set([...hf, ...missing])].sort(), [...want.fields].sort()) || filterAnders
        if (differs && !missing.includes('*')) warnings.push(`${label} weicht vom Bauplan ab (nicht geändert)`)
        continue
      }
      await step(label, () => api('POST', '/permissions', {
        policy, collection: want.collection, action: want.action, fields: want.fields,
        permissions: want.permissions || null, validation: want.validation || null, presets: want.presets || null,
      }))
    }
  }

  // 6. Server-Policy an den Server-User hängen
  const users = await api('GET', '/users?fields=id,first_name,email&limit=-1')
  const serverUser = users.filter((u) => u.first_name === SERVER_USER || u.email === SERVER_USER)
  if (serverUser.length !== 1) failed.push(`User „${SERVER_USER}“ ${serverUser.length ? 'mehrfach' : 'nicht'} gefunden – Policy Server nicht zugeordnet`)
  else if (policyIds.Server) {
    const access = policyIds.Server.startsWith('<neu') ? [] : await api('GET', `/access?filter[user][_eq]=${serverUser[0].id}&filter[policy][_eq]=${policyIds.Server}&fields=id`)
    if (access.length) skipped.push(`Policy Server → User ${SERVER_USER} – schon zugeordnet`)
    else await step(`Policy Server → User ${SERVER_USER}`, () => api('POST', '/access', { user: serverUser[0].id, policy: policyIds.Server, role: null }))
  }

  // 7. Rollen mit ihren Policies
  const roles = await api('GET', '/roles?fields=id,name&limit=-1')
  for (const [name, def] of Object.entries(ROLES)) {
    const same = roles.filter((r) => r.name === name)
    if (same.length > 1) { failed.push(`Es gibt ${same.length} Rollen namens „${name}“ – bitte in Directus klären`); continue }
    let roleId = same[0]?.id
    if (roleId) skipped.push(`Rolle ${name} – schon vorhanden`)
    else roleId = (await step(`Rolle ${name} anlegen`, () => api('POST', '/roles', { name, icon: def.icon, description: def.description })))?.id
    for (const pname of def.policies) {
      const policy = policyIds[pname]
      if (!policy) continue
      const access = roleId && !policy.startsWith('<neu') ? await api('GET', `/access?filter[role][_eq]=${roleId}&filter[policy][_eq]=${policy}&fields=id`) : []
      if (access.length) skipped.push(`Policy ${pname} → Rolle ${name} – schon zugeordnet`)
      else await step(`Policy ${pname} → Rolle ${name}`, () => api('POST', '/access', { role: roleId, policy, user: null }))
    }
  }

  // 8. Flows (erkannt am Namen; vorhandene werden nicht angefasst)
  const flows = await api('GET', '/flows?fields=id,name&limit=-1')
  for (const f of FLOWS) {
    if (flows.some((x) => x.name === f.name)) { skipped.push(`Flow „${f.name}“ – schon vorhanden`); continue }
    await step(`Flow „${f.name}“ anlegen (${f.operations.length} Operationen)`, async () => {
      const flow = await api('POST', '/flows', { name: f.name, icon: f.icon, description: f.description, status: 'active', trigger: f.trigger, options: f.options, accountability: 'all' })
      // von hinten anlegen, damit jede Operation ihre Nachfolgerin kennt
      let naechste = null
      for (const [i, op] of [...f.operations].reverse().entries()) {
        const angelegt = await api('POST', '/operations', { ...op, flow: flow.id, resolve: naechste, reject: null, position_x: 19 + (f.operations.length - 1 - i) * 18, position_y: 1 })
        naechste = angelegt.id
      }
      await api('PATCH', `/flows/${flow.id}`, { operation: naechste })
    })
  }

  // Hinweis: öffentliche Rolle soll keine Rechte haben
  const publicPolicies = policies.filter((p) => p.name === '$t:public_label').map((p) => p.id)
  const publicPerms = perms.filter((p) => publicPolicies.includes(p.policy))
  if (publicPerms.length) warnings.push(`Öffentlich hat ${publicPerms.length} Rechte (${publicPerms.map((p) => `${p.action} ${p.collection}`).join(', ')}) – laut Bauplan keine`)

  console.log(`\n${DRY ? 'PROBELAUF – nichts geändert.' : 'Fertig.'}\n`)
  if (done.length) console.log(`${DRY ? 'Würde anlegen' : 'Angelegt'} (${done.length}):\n${done.map((d) => `  ✓ ${d}`).join('\n')}\n`)
  if (skipped.length) console.log(`Schon vorhanden (${skipped.length}):\n${skipped.map((d) => `  · ${d}`).join('\n')}\n`)
  if (warnings.length) console.log(`Hinweise:\n${warnings.map((d) => `  ⚠ ${d}`).join('\n')}\n`)
  if (failed.length) {
    console.log(`Fehlgeschlagen:\n${failed.map((d) => `  ✗ ${d}`).join('\n')}\n`)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(`Abbruch: ${err.message}`)
  process.exit(1)
})
