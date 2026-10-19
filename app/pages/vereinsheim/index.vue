<script setup lang="ts">
// Dashboard: lila Begrüßung mit Spruch zur Tageszeit, daneben die Post (Vorstand) bzw. die eigenen
// Einreichungen in der Kasse (Mitglieder); darunter Kacheln mit Icons zu allen Bereichen.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim', vollbreit: true })
useSeoMeta({ title: 'Vereinsheim', robots: 'noindex, nofollow' })

const { ich } = useVereinsheimIch()
const post = useVereinsheimPost()
// die fünf neuesten Mails; aktualisiert sich jede Minute
const mails = computed(() => (post.listen.value.eingang?.eingerichtet ? post.listen.value.eingang.mails.slice(0, 5) : null))
useAutoAktualisierung(() => ich.value?.vorstand && post.aktualisieren('eingang'))

interface Post { art: 'antrag' | 'vorschlag' | 'gastbeitrag' | 'leserbrief' | 'anmeldung', titel: string, von: string, wann: string, to: string }
interface Auslage { id: number, titel: string, betrag: string | number, status: string, datum: string }
interface Termin { id: number, titel: string, slug: string, beginn: string, ort: string | null }

const WOCHE = { _gte: '$NOW(-7 days)' }

const { data } = useAsyncData('vh-dashboard', async () => {
  const neu = (c: string, f: object) => vh.anzahl(c, f as Record<string, unknown>).catch(() => 0)
  function neueste<T>(c: string, fields: string, filter: object = {}) {
    return vh.liste<T & { date_created: string }>(c, { fields: `${fields},date_created`, filter, sort: '-date_created', limit: 4 }).catch(() => [])
  }

  const [naechster, neuIn] = await Promise.all([
    vh.liste<Termin>('termine', { fields: 'id,titel,slug,beginn,ort', filter: { status: { _eq: 'published' }, beginn: { _gte: '$NOW' } }, sort: 'beginn', limit: 1 }).catch(() => []),
    Promise.all([
      neu('anmeldungen', { date_created: WOCHE }),
      neu('gastbeitraege', { status: { _eq: 'eingereicht' } }),
      neu('leserbriefe', { date_created: WOCHE }),
      neu('vorschlaege', { status: { _eq: 'neu' } }),
      neu('ideen', { date_created: WOCHE }),
      neu('auslagen', { status: { _eq: 'eingereicht' } }),
      ich.value?.vorstand ? neu('mitgliedsantraege', { status: { _eq: 'eingereicht' } }) : Promise.resolve(0),
    ]),
  ])

  // Vorstand: was zuletzt über die Website reinkam · Mitglieder: eigene Einreichungen in der Kasse
  let eingaenge: Post[] = []
  let auslagen: Auslage[] = []
  if (ich.value?.vorstand) {
    // echtes Kontakt-Postfach, falls angeschlossen (gemerkt für die Post-Seite) – sonst die Eingänge über die Website
    if (!post.listen.value.eingang) await post.aktualisieren('eingang')
    else post.aktualisieren('eingang')
    const [antraege, vorschlaege, gast, briefe, anmeldungen] = await Promise.all([
      neueste<{ vorname: string, nachname: string, art: string }>('mitgliedsantraege', 'vorname,nachname,art'),
      neueste<{ name: string, idee: string }>('vorschlaege', 'name,idee'),
      neueste<{ autor_in: string, titel: string }>('gastbeitraege', 'autor_in,titel'),
      neueste<{ name: string, text: string }>('leserbriefe', 'name,text'),
      neueste<{ name: string, personen: number, termin: { id: number, titel: string } | null }>('anmeldungen', 'name,personen,termin.id,termin.titel'),
    ])
    eingaenge = [
      ...antraege.map(a => ({ art: 'antrag' as const, titel: `Mitgliedsantrag (${a.art === 'regulaer' ? 'regulär' : 'Förder'})`, von: `${a.vorname} ${a.nachname}`, wann: a.date_created, to: '/vereinsheim/mitglieder' })),
      ...vorschlaege.map(v => ({ art: 'vorschlag' as const, titel: v.idee, von: v.name, wann: v.date_created, to: '/vereinsheim/ideensammlung' })),
      ...gast.map(g => ({ art: 'gastbeitrag' as const, titel: `Gastbeitrag: ${g.titel}`, von: g.autor_in, wann: g.date_created, to: '/vereinsheim/dorfanzeiger?reiter=gastbeitraege' })),
      ...briefe.map(b => ({ art: 'leserbrief' as const, titel: `Leserbrief: ${b.text}`, von: b.name, wann: b.date_created, to: '/vereinsheim/dorfanzeiger?reiter=leserbriefe' })),
      ...anmeldungen.map(a => ({ art: 'anmeldung' as const, titel: `Anmeldung: ${a.termin?.titel ?? 'Termin'}${a.personen > 1 ? ` (${a.personen} Pers.)` : ''}`, von: a.name, wann: a.date_created, to: a.termin ? `/vereinsheim/termine/${a.termin.id}/anmeldungen` : '/vereinsheim/termine' })),
    ].sort((a, b) => Date.parse(b.wann) - Date.parse(a.wann)).slice(0, 5)
  }
  else {
    auslagen = await vh.liste<Auslage>('auslagen', { fields: 'id,titel,betrag,status,datum', sort: '-date_created', limit: 4 }).catch(() => [])
  }

  const [anmeldungen, gastbeitraege, leserbriefe, vorschlaege, ideen, kasse, antraege] = neuIn
  return { naechster: naechster[0] ?? null, post: eingaenge, auslagen, neu: { anmeldungen, gastbeitraege, leserbriefe, vorschlaege, ideen, kasse, antraege } }
}, { server: false })

// Begrüßung je nach Tageszeit: Spruch als Überschrift, Name hervorgehoben
const jetzt = new Date()
const datum = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }).format(jetzt)
const begruessung = computed(() => {
  const name = ich.value?.first_name || ich.value?.benutzername || 'du'
  const h = stunde(jetzt)
  const sonntag = new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'Europe/Berlin' }).format(jetzt) === 'Sonntag'
  if (h < 5) return { vor: 'Noch wach,', name, nach: '?', satz: 'Die Stühle stehen schon auf den Tischen – aber für dich machen wir das Licht nochmal an.' }
  if (h < 11) return { vor: 'Moin', name, nach: '!', satz: 'Kaffee steht in der Küche. Die Milch ist im Kühlschrank, zweites Fach.' }
  if (h < 14) return { vor: 'Mahlzeit,', name, nach: '!', satz: 'Schön, dass du in der Mittagspause vorbeischaust.' }
  if (h < 18) return { vor: 'Hallo', name, nach: '!', satz: sonntag ? 'Schönen Sonntag! Kuchen ist noch da.' : 'Es gibt noch Kuchen von gestern. Bedien dich.' }
  if (h < 22) return { vor: 'N’Abend', name, nach: '!', satz: 'Mach’s dir gemütlich – wer zuletzt geht, macht das Licht aus.' }
  return { vor: 'Noch spät dran,', name, nach: '?', satz: 'Schön, dass du noch reinschaust. Mach nicht mehr zu lange – morgen ist auch noch ein Tag.' }
})

function seit(iso: string) {
  const minuten = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (minuten < 60) return `vor ${Math.max(1, minuten)} Min.`
  if (minuten < 24 * 60) return `vor ${Math.round(minuten / 60)} Std.`
  if (minuten < 7 * 24 * 60) return `vor ${Math.round(minuten / 1440)} Tagen`
  return datumLang(iso)
}

const POST_ICON = { antrag: 'mitglieder', vorschlag: 'ideen', gastbeitrag: 'dorfanzeiger', leserbrief: 'post', anmeldung: 'termine' } as const

interface Kachel { titel: string, text: string, to: string, link: string, icon: 'termine' | 'dorfanzeiger' | 'ideen' | 'ueber' | 'kasse' | 'mitglieder', neu: boolean, tape: 'links' | 'mitte' | 'rechts', farbe: 'gelb' | 'flieder' }

const kacheln = computed<Kachel[]>(() => {
  const n = data.value?.neu
  const t = data.value?.naechster
  return [
    { titel: 'Termine', text: t ? `Als Nächstes: ${t.titel} am ${tagMonat(t.beginn)}.` : 'Gerade ist nichts geplant.', to: '/vereinsheim/termine', link: 'Zum Klemmbrett', icon: 'termine', neu: !!n?.anmeldungen, tape: 'links', farbe: 'gelb' },
    { titel: 'Dorfanzeiger', text: 'Artikel schreiben, Leserbriefe lesen, Gastbeiträge prüfen.', to: '/vereinsheim/dorfanzeiger', link: 'Zum Redaktionstisch', icon: 'dorfanzeiger', neu: !!(n?.gastbeitraege || n?.leserbriefe), tape: 'mitte', farbe: 'flieder' },
    { titel: 'Ideensammlung', text: 'Vorschläge von außen, die Ideenwand und das Plenum.', to: '/vereinsheim/ideensammlung', link: 'Ideen sortieren', icon: 'ideen', neu: !!(n?.vorschlaege || n?.ideen), tape: 'rechts', farbe: 'gelb' },
    { titel: 'Über uns', text: 'Stimmen aus dem Verein und die Fragen auf der Startseite.', to: '/vereinsheim/ueber-uns', link: 'Stimmen & Fragen', icon: 'ueber', neu: false, tape: 'links', farbe: 'flieder' },
    { titel: 'Kasse', text: 'Etwas ausgelegt? Hier einreichen, wir zahlen es zurück.', to: '/vereinsheim/kassenbuch', link: 'Auslage einreichen', icon: 'kasse', neu: !!(ich.value?.vorstand && n?.kasse), tape: 'mitte', farbe: 'gelb' },
    ...(ich.value?.vorstand ? [{ titel: 'Mitglieder', text: 'Anträge entscheiden, Mitgliederliste und Vereinsdaten.', to: '/vereinsheim/mitglieder', link: 'Zur Mitgliederliste', icon: 'mitglieder' as const, neu: !!n?.antraege, tape: 'rechts' as const, farbe: 'flieder' as const }] : []),
  ]
})

const STEMPEL: Record<string, string> = { eingereicht: 'eingereicht', genehmigt: 'genehmigt', ausgezahlt: 'ausgezahlt', abgelehnt: 'abgelehnt' }
</script>

<template>
  <div class="dash">
    <section class="dash__hero">
      <div class="dash__hero-innen">
        <div class="dash__gruss">
          <p class="dash__datum handschrift">{{ datum }}</p>
          <h1 class="dash__titel">
            {{ begruessung.vor }} <BasisHervorhebung :drehung="-2">{{ begruessung.name }}{{ begruessung.nach }}</BasisHervorhebung>
          </h1>
          <p class="dash__satz">{{ begruessung.satz }}</p>
        </div>

        <!-- Vorstand: Post · Mitglieder: eigene Einreichungen -->
        <BasisNotizzettel farbe="pfirsich" radius="l" :drehung="1.5" class="dash__karte" data-tour="post">
          <!-- solange geladen wird: Platzhalter in voller Höhe, damit die Kacheln darunter nicht springen -->
          <template v-if="!data">
            <p class="dash__karte-titel"><VereinsheimIcon :name="ich?.vorstand ? 'post' : 'kasse'" class="dash__karte-icon" /> {{ ich?.vorstand ? 'Neue Post' : 'Deine Einreichungen' }}</p>
            <ul class="dash__post" aria-hidden="true">
              <li v-for="n in 5" :key="n" class="dash__post-platzhalter" />
            </ul>
            <p class="dash__karte-hinweis dash__karte-hinweis--laedt">Wird geladen …</p>
          </template>
          <template v-else-if="ich?.vorstand && mails">
            <p class="dash__karte-titel"><VereinsheimIcon name="post" class="dash__karte-icon" /> Neue Post</p>
            <ul v-if="mails.length" class="dash__post">
              <li v-for="m in mails" :key="m.uid">
                <NuxtLink to="/vereinsheim/post" class="dash__post-link" :class="{ 'dash__post-link--neu': !m.gelesen }">
                  <VereinsheimIcon name="post" class="dash__post-icon" />
                  <span class="dash__post-text"><strong>{{ m.von }}</strong> · {{ m.betreff }}</span>
                  <span class="dash__post-zeit">{{ seit(m.datum) }}</span>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="dash__leer">Der Briefkasten ist leer.</p>
          </template>
          <template v-else-if="ich?.vorstand">
            <p class="dash__karte-titel"><VereinsheimIcon name="post" class="dash__karte-icon" /> Neue Post</p>
            <ul v-if="data?.post.length" class="dash__post">
              <li v-for="(p, i) in data.post" :key="i">
                <NuxtLink :to="p.to" class="dash__post-link">
                  <VereinsheimIcon :name="POST_ICON[p.art]" class="dash__post-icon" />
                  <span class="dash__post-text"><strong>{{ p.von }}</strong> · {{ p.titel }}</span>
                  <span class="dash__post-zeit">{{ seit(p.wann) }}</span>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="dash__leer">Der Briefkasten ist leer.</p>
            <p class="dash__karte-hinweis">Was über die Website reinkommt: Anträge, Vorschläge, Gastbeiträge, Leserbriefe, Anmeldungen.</p>
          </template>
          <template v-else>
            <p class="dash__karte-titel"><VereinsheimIcon name="kasse" class="dash__karte-icon" /> Deine Einreichungen</p>
            <ul v-if="data?.auslagen.length" class="dash__post">
              <li v-for="a in data.auslagen" :key="a.id">
                <NuxtLink to="/vereinsheim/kassenbuch" class="dash__post-link">
                  <span class="dash__post-text"><strong>{{ euro(a.betrag) }}</strong> · {{ a.titel }}</span>
                  <span class="dash__post-zeit">{{ STEMPEL[a.status] ?? a.status }}</span>
                </NuxtLink>
              </li>
            </ul>
            <p v-else class="dash__leer">Noch nichts eingereicht.</p>
          </template>
          <BasisTrennlinie class="dash__linie" />
          <NuxtLink :to="ich?.vorstand ? '/vereinsheim/post' : '/vereinsheim/kassenbuch'" class="dash__mehr">
            {{ ich?.vorstand ? 'Zum Postfach' : 'Zur Kasse' }} <span aria-hidden="true">→</span>
          </NuxtLink>
        </BasisNotizzettel>
      </div>
    </section>

    <section class="dash__kacheln" aria-label="Bereiche">
      <ul class="kacheln" data-tour="kacheln">
        <li v-for="(k, i) in kacheln" :key="k.to">
          <NuxtLink :to="k.to" class="kachel-link">
            <BasisNotizzettel farbe="pfirsich" radius="l" :tape="k.tape" :tape-farbe="k.farbe" :drehung="[-1, 0.6, -0.4, 0.8, -0.8, 0.5][i % 6]" class="kachel">
              <span class="kachel__kopf">
                <VereinsheimIcon :name="k.icon" class="kachel__icon" />
                <span v-if="k.neu" class="kachel__neu">neu</span>
              </span>
              <h2 class="kachel__titel">{{ k.titel }}</h2>
              <p class="kachel__text">{{ k.text }}</p>
              <span class="kachel__link">{{ k.link }} <span aria-hidden="true">→</span></span>
            </BasisNotizzettel>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/vereinsheim/termine/neu" class="kachel-link">
            <BasisNotizzettel farbe="weiss" radius="l" rahmen="orange" :drehung="0.4" class="kachel kachel--neu">
              <span class="kachel__kopf"><VereinsheimIcon name="neu" class="kachel__icon" /></span>
              <h2 class="kachel__titel">Termin anlegen</h2>
              <p class="kachel__text">Gerade eine Idee für ein Treffen? Leg sie gleich an.</p>
              <span class="kachel__link">Los <span aria-hidden="true">→</span></span>
            </BasisNotizzettel>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section class="dash__plenum">
      <BasisTrennlinie />
      <div class="dash__plenum-innen">
        <h2 class="dash__plenum-titel">
          Wir sehen uns im <BasisHervorhebung :drehung="-1.5">Plenum!</BasisHervorhebung>
        </h2>
        <p class="dash__plenum-text handschrift">
          Wer zuletzt geht, macht das Licht aus.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------- Begrüßung ---------- */
.dash__hero {
  --farbe-fokus: var(--farbe-gelb);
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.dash__hero-innen {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: var(--abstand-xl);
  max-width: calc(var(--inhaltsbreite) + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: var(--abstand-xl) var(--seitenrand) var(--abstand-sektion);
}

.dash__datum {
  margin: 0 0 var(--abstand-s);
  font-size: var(--groesse-hand-m);
  color: var(--farbe-pfirsich);
  rotate: -2deg;
}

.dash__titel {
  margin: 0;
  font-size: var(--groesse-h2);
  line-height: 1.05;
  color: var(--farbe-pfirsich);
}

.dash__satz {
  max-width: 34rem;
  margin: var(--abstand-l) 0 0;
  font-size: var(--groesse-l);
}

/* feste Mindesthöhe: ob Platzhalter, wenige oder fünf Einträge – die Kacheln darunter bleiben stehen */
.dash__karte {
  display: flex;
  flex-direction: column;
  min-height: 31rem;
  padding: var(--abstand-l);
  color: var(--farbe-schwarz);
}

.dash__karte .dash__linie {
  margin-top: auto;
  padding-top: var(--abstand-m);
}

.dash__karte-titel {
  display: flex;
  align-items: center;
  gap: var(--abstand-xs);
  margin: 0 0 var(--abstand-s);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h3);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.dash__karte-icon {
  width: 2.4rem;
  height: 2.4rem;
  color: var(--farbe-orange);
}

.dash__post {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dash__post-platzhalter {
  height: 2.35rem;
  border-bottom: 1px dashed rgb(0 0 0 / 0.15);
  background: linear-gradient(90deg, rgb(0 0 0 / 0.06) 0 70%, transparent 70%) left center / 100% 0.8rem no-repeat;
}

.dash__post-link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: var(--abstand-2xs);
  padding: 0.35rem 0;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed rgb(0 0 0 / 0.15);
}

.dash__post-link:hover .dash__post-link--neu .dash__post-text {
  font-weight: var(--gewicht-text-normal);
}

.dash__post-icon {
  align-self: center;
  width: 1.4rem;
  height: 1.4rem;
  color: var(--farbe-orange);
}

.dash__post-text {
  text-decoration: underline;
}

.dash__post-link--neu .dash__post-text {
  font-weight: var(--gewicht-text-normal);
}

.dash__post-icon {
  align-self: center;
  width: 1.4rem;
  height: 1.4rem;
  color: var(--farbe-orange);
}

.dash__post-text {
  overflow: hidden;
  font-size: var(--groesse-s);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash__post-zeit {
  font-size: var(--groesse-xs);
  color: var(--farbe-orange-text);
  white-space: nowrap;
}

.dash__leer {
  margin: 0;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-m);
}

.dash__karte-hinweis {
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-xs);
  color: rgb(0 0 0 / 0.65);
}

.dash__linie {
  margin-block: var(--abstand-m);
}

.dash__mehr,
.kachel__link {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 1.25rem;
  text-transform: uppercase;
  color: var(--farbe-orange-text);
  text-decoration: none;
}

/* ---------- Kacheln ---------- */
.dash__kacheln {
  max-width: calc(var(--inhaltsbreite) + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: var(--abstand-xl) var(--seitenrand) 0;
}

.kacheln {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
  gap: var(--abstand-xl) var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.kachel-link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.kachel {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
  height: 100%;
  padding: var(--abstand-l) var(--abstand-l) var(--abstand-m);
  transition: transform var(--dauer-mittel), box-shadow var(--dauer-mittel);
}

.kachel-link:hover .kachel,
.kachel-link:focus-visible .kachel {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: var(--schatten-karte);
}

.kachel__kopf {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.kachel__icon {
  width: 3.4rem;
  height: 3.4rem;
  color: var(--farbe-orange);
}

.kachel__neu {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--farbe-orange);
  color: var(--farbe-weiss);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 0.9rem;
  text-transform: uppercase;
  rotate: 4deg;
}

.kachel__titel {
  margin: var(--abstand-2xs) 0 0;
  font-size: var(--groesse-h3);
  color: var(--farbe-lila);
}

.kachel__text {
  margin: 0;
  font-size: var(--groesse-s);
}

.kachel__link {
  margin-top: auto;
  padding-top: var(--abstand-s);
  border-top: var(--strich-dicke) dashed var(--farbe-orange);
}

.kachel--neu .kachel__titel {
  font-size: var(--groesse-h3);
}

/* ---------- Plenum ---------- */
.dash__plenum {
  max-width: calc(var(--inhaltsbreite) + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: var(--abstand-xl) var(--seitenrand) var(--abstand-sektion);
}

.dash__plenum-innen {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--abstand-m);
  margin-top: var(--abstand-xl);
}

.dash__plenum-titel {
  margin: 0;
  font-size: var(--groesse-h2);
  line-height: 1.1;
  color: var(--farbe-lila);
}

.dash__plenum-text {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

@media (max-width: 56rem) {
  .dash__hero-innen {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kachel {
    transition: none;
  }
}
</style>
