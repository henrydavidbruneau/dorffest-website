<script setup lang="ts">
// Schwarzes Brett: Übersicht mit angepinnten Zetteln je Bereich, rote Sticker zeigen Neues.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Vereinsheim', robots: 'noindex, nofollow' })

const { ich } = useVereinsheimIch()

interface NaechsterTermin { id: number, titel: string, beginn: string, plaetze: number | null }
interface Zuletzt { titel: string, date_updated: string | null, user_updated: { first_name: string | null } | null }

const WOCHE = { _gte: '$NOW(-7 days)' }

const { data, status } = useAsyncData('vh-brett', async () => {
  const [termin] = await vh.liste<NaechsterTermin>('termine', {
    fields: 'id,titel,beginn,plaetze',
    filter: { status: { _eq: 'published' }, beginn: { _gte: '$NOW' } },
    sort: 'beginn',
    limit: 1,
  })
  const zaehle = (c: string, f: object) => vh.anzahl(c, f as Record<string, unknown>).catch(() => 0)
  const [anmeldungen, entwuerfe, leserbriefe, gastbeitraege, vorschlaege, ideen, stimmenEntwuerfe, faqEntwuerfe, auslagen, antraege, zuletzt] = await Promise.all([
    zaehle('anmeldungen', { date_created: WOCHE }),
    zaehle('artikel', { status: { _eq: 'draft' } }),
    zaehle('leserbriefe', { date_created: WOCHE }),
    zaehle('gastbeitraege', { status: { _eq: 'eingereicht' } }),
    zaehle('vorschlaege', { status: { _eq: 'neu' } }),
    zaehle('ideen', { date_created: WOCHE }),
    zaehle('stimmen', { status: { _eq: 'draft' } }),
    zaehle('faq', { status: { _eq: 'draft' } }),
    zaehle('auslagen', { status: { _eq: 'eingereicht' } }),
    ich.value?.vorstand ? zaehle('mitgliedsantraege', { status: { _eq: 'eingereicht' } }) : Promise.resolve(0),
    vh.liste<Zuletzt>('artikel', { fields: 'titel,date_updated,user_updated.first_name', filter: { date_updated: { _nnull: true } }, sort: '-date_updated', limit: 1 }).catch(() => []),
  ])
  const anmeldungenTermin = termin
    ? await vh.liste<{ sum: { personen: string | number | null } }>('anmeldungen', { 'aggregate[sum]': 'personen', 'filter': { termin: { _eq: termin.id }, status: { _eq: 'angemeldet' } } })
      .then(r => Number(r[0]?.sum.personen ?? 0)).catch(() => 0)
    : 0
  return { termin, anmeldungenTermin, anmeldungen, entwuerfe, leserbriefe, gastbeitraege, vorschlaege, ideen, ueberUns: stimmenEntwuerfe + faqEntwuerfe, auslagen, antraege, zuletzt: zuletzt[0] ?? null }
}, { server: false })

// Begrüßung je nach Tageszeit und Wochentag
const begruessung = computed(() => {
  const name = ich.value?.first_name || ich.value?.benutzername || 'du'
  const jetzt = new Date()
  const stunde = Number(new Intl.DateTimeFormat('de-DE', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Berlin' }).format(jetzt))
  const tag = new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'Europe/Berlin' }).format(jetzt)
  if (stunde < 5) return { gruss: `Noch wach, ${name}?`, satz: 'Die Stühle stehen schon auf den Tischen – aber für dich machen wir das Licht nochmal an.' }
  if (stunde < 11) return { gruss: `Moin ${name}!`, satz: 'Kaffee steht in der Küche. Die Milch ist im Kühlschrank, zweites Fach.' }
  if (stunde < 14) return { gruss: `Mahlzeit, ${name}!`, satz: 'Schön, dass du in der Mittagspause vorbeischaust.' }
  if (stunde < 18) return { gruss: `Hallo ${name}!`, satz: tag === 'Sonntag' ? 'Schönen Sonntag! Kuchen ist noch da.' : 'Es gibt noch Kuchen von gestern. Bedien dich.' }
  if (stunde < 22) return { gruss: `N’Abend ${name}!`, satz: 'Mach’s dir gemütlich – wer zuletzt geht, macht das Licht aus.' }
  return { gruss: `Na, noch spät dran, ${name}?`, satz: 'Die Heizung läuft noch. Nicht zu lange bleiben!' }
})

const tageBis = (iso: string) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000))
</script>

<template>
  <div class="brett">
    <div class="brett__kopf">
      <BasisNotizzettel farbe="gelb" tape="mitte" tape-farbe="flieder" :drehung="-1.5" class="brett__gruss">
        <h1 class="brett__titel">{{ begruessung.gruss }}</h1>
        <p class="brett__satz">{{ begruessung.satz }}</p>
      </BasisNotizzettel>
      <div class="brett__tasse" aria-hidden="true">☕</div>
      <p v-if="data?.zuletzt?.user_updated?.first_name" class="brett__zuletzt handschrift">
        Zuletzt am Werk: {{ data.zuletzt.user_updated.first_name }} – „{{ data.zuletzt.titel }}“
      </p>
    </div>

    <p v-if="status === 'pending'" class="brett__laden handschrift">Moment, wir räumen noch das Brett auf …</p>

    <ul v-else class="brett__zettel">
      <li>
        <NuxtLink to="/vereinsheim/termine" class="zettel-link">
          <BasisNotizzettel farbe="creme" befestigung="pin" :drehung="-2" class="zettel">
            <VereinsheimSticker :anzahl="data?.anmeldungen ?? 0" text="Anm." />
            <h2 class="zettel__titel">Termine</h2>
            <template v-if="data?.termin">
              <p class="zettel__gross">in {{ tageBis(data.termin.beginn) }} Tagen</p>
              <p>{{ data.termin.titel }}, {{ tagMonat(data.termin.beginn) }}<br>
                {{ data.anmeldungenTermin }}{{ data.termin.plaetze ? ` von ${data.termin.plaetze}` : '' }} angemeldet</p>
            </template>
            <p v-else>Gerade ist nichts geplant. Zeit für eine neue Idee?</p>
            <span class="zettel__weiter handschrift">→ zum Klemmbrett</span>
          </BasisNotizzettel>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vereinsheim/dorfanzeiger" class="zettel-link">
          <BasisNotizzettel farbe="weiss" tape="links" tape-farbe="gelb" :drehung="1.5" class="zettel">
            <VereinsheimSticker :anzahl="(data?.gastbeitraege ?? 0) + (data?.leserbriefe ?? 0)" />
            <h2 class="zettel__titel">Dorfanzeiger</h2>
            <ul class="zettel__liste">
              <li>{{ data?.entwuerfe ?? 0 }} Artikel im Entwurf</li>
              <li>{{ data?.leserbriefe ?? 0 }} neue Leserbriefe</li>
              <li>{{ data?.gastbeitraege ?? 0 }} Gastbeiträge im Posteingang</li>
            </ul>
            <span class="zettel__weiter handschrift">→ zum Redaktionstisch</span>
          </BasisNotizzettel>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vereinsheim/mitmachen" class="zettel-link">
          <BasisNotizzettel farbe="pfirsich" befestigung="pin" :drehung="-1" class="zettel">
            <VereinsheimSticker :anzahl="data?.vorschlaege ?? 0" />
            <h2 class="zettel__titel">Mitmachen</h2>
            <ul class="zettel__liste">
              <li>{{ data?.vorschlaege ?? 0 }} neue Vorschläge</li>
              <li>{{ data?.ideen ?? 0 }} neue Ideen an der Wand</li>
            </ul>
            <span class="zettel__weiter handschrift">→ Ideen sortieren</span>
          </BasisNotizzettel>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vereinsheim/ueber-uns" class="zettel-link">
          <BasisNotizzettel farbe="weiss" tape="rechts" tape-farbe="pfirsich" :drehung="2" class="zettel">
            <VereinsheimSticker :anzahl="data?.ueberUns ?? 0" text="Entw." />
            <h2 class="zettel__titel">Über uns</h2>
            <p>Stimmen aus dem Verein und die Fragen auf der Startseite.</p>
            <span class="zettel__weiter handschrift">→ Stimmen &amp; Fragen</span>
          </BasisNotizzettel>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/vereinsheim/kassenbuch" class="zettel-link">
          <BasisNotizzettel farbe="papier" befestigung="klammer" :drehung="-1.5" class="zettel zettel--kasse">
            <VereinsheimSticker :anzahl="data?.auslagen ?? 0" text="offen" />
            <h2 class="zettel__titel">Kassenbuch</h2>
            <p>Etwas für den Verein ausgelegt? Hier einreichen, wir zahlen es zurück.</p>
            <span class="zettel__weiter handschrift">→ Auslage einreichen</span>
          </BasisNotizzettel>
        </NuxtLink>
      </li>
      <li v-if="ich?.vorstand">
        <NuxtLink to="/vereinsheim/mitglieder" class="zettel-link">
          <BasisNotizzettel farbe="gelb" befestigung="pin" :drehung="1" class="zettel">
            <VereinsheimSticker :anzahl="data?.antraege ?? 0" text="Antr." />
            <h2 class="zettel__titel">Mitglieder</h2>
            <p>{{ data?.antraege ? `${data.antraege} Anträge warten auf den Vorstand.` : 'Keine offenen Anträge. Der Vorstand darf Kuchen essen.' }}</p>
            <span class="zettel__weiter handschrift">→ zur Mitgliederliste</span>
          </BasisNotizzettel>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.brett {
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.brett__kopf {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--abstand-m) var(--abstand-l);
  margin-bottom: var(--abstand-xl);
}

.brett__gruss {
  max-width: 36rem;
  padding: var(--abstand-l) var(--abstand-l) var(--abstand-m);
}

.brett__titel {
  margin: 0 0 var(--abstand-2xs);
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1;
  color: var(--farbe-lila);
}

.brett__satz {
  margin: 0;
  font-size: var(--groesse-l);
}

.brett__tasse {
  font-size: 3.5rem;
  rotate: 8deg;
  filter: drop-shadow(2px 4px 2px rgb(0 0 0 / 0.25));
}

.brett__zuletzt {
  margin: 0;
  padding: 0.2rem 0.8rem;
  background: rgb(255 253 247 / 0.85);
  font-size: var(--groesse-hand-s);
  rotate: -1deg;
}

.brett__laden {
  font-size: var(--groesse-hand-l);
  color: var(--farbe-creme);
}

.brett__zettel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
  gap: var(--abstand-xl) var(--abstand-l);
  margin: 0;
  padding: 0;
  list-style: none;
}

.zettel-link {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.zettel {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
  height: 100%;
  padding: var(--abstand-l) var(--abstand-m) var(--abstand-m);
  transition: transform var(--dauer-mittel), box-shadow var(--dauer-mittel);
}

.zettel-link:hover .zettel,
.zettel-link:focus-visible .zettel {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: 4px 10px 18px rgb(0 0 0 / 0.25);
}

.zettel--kasse {
  padding-top: 3rem;
}

.zettel__titel {
  margin: 0;
  font-size: var(--groesse-h3);
  color: var(--farbe-lila);
}

.zettel__gross {
  margin: 0;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-l);
  line-height: 1;
  color: var(--farbe-orange-text);
}

.zettel p {
  margin: 0;
}

.zettel__liste {
  margin: 0;
  padding-left: 1.1rem;
}

.zettel__weiter {
  margin-top: auto;
  padding-top: var(--abstand-2xs);
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

@media (prefers-reduced-motion: reduce) {
  .zettel {
    transition: none;
  }
}
</style>
