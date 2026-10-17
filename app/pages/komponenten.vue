<script setup lang="ts">
// Interne Vorschau der Basis-Komponenten. Vor dem Livegang entfernen.
useSeoMeta({ title: 'Komponenten', robots: 'noindex, nofollow' })

const basis = { status: 'published', date_created: '2025-10-01T10:00:00Z', date_updated: null } as const

const termine: Termin[] = [
  {
    ...basis, id: 1, slug: 'kleidertausch', titel: 'Kleidertausch', beginn: '2025-11-15T14:00:00+01:00', ende: null,
    datum_text: null, hinweis: null, ort: 'JuMa Königsdorf', adresse: null, kurzbeschreibung: null, beschreibung: null, aufruf_text: null,
  },
  {
    ...basis, id: 2, slug: 'dorffest-2026', titel: 'Dorffest', beginn: null, ende: null, datum_text: '2026',
    hinweis: 'Termin folgt – hilf mit planen', ort: null, adresse: null, kurzbeschreibung: null, beschreibung: null, aufruf_text: 'Mithelfen',
  },
]

const artikel: Artikel = {
  ...basis, id: 1, slug: 'so-war-das-erste-dorffest', titel: 'So war das erste Dorffest',
  teaser: 'Bühne, Buffet, Workshops und ein Mini-Jahrmarkt für die Pänz.', ressort: 'feste', autor_in: 'Kathie',
  veroeffentlicht_am: '2025-09-07', datum_text: null, lesedauer_minuten: 4, bild: '/platzhalter/foto-3x2.svg',
  bild_alt: 'Platzhalter', bildunterschrift: null, inhalt: '', titelgeschichte: true, ausgabe: 3,
}

const anzeigen: Kleinanzeige[] = [
  { ...basis, id: 1, art: 'gesucht', titel: 'Kuchen', text: 'Für das Adventscafé, ein Blech reicht.', link_text: 'melde dich!', link: '#' },
  { ...basis, id: 2, art: 'gefunden', titel: 'Schal', text: 'Blau, beim Dorffest. Liegt im JuMa.', link_text: 'abholen', link: '#' },
]
</script>

<template>
  <div class="inhalt vorschau">
    <h1>Komponenten</h1>

    <section>
      <h2 class="vorschau__titel">Schriften</h2>
      <p class="display" style="font-size: 3rem; color: var(--farbe-lila)">Londrina Solid Black</p>
      <p>Poppins Light – Wir sind Nachbar*innen, die Feste organisieren. <strong>Fett hervorgehoben.</strong></p>
      <p class="handschrift" style="color: var(--farbe-orange-text)">Reenie Beanie – Verein für Zusammenhalt</p>
    </section>

    <section>
      <h2 class="vorschau__titel">Farben</h2>
      <ul class="vorschau__farben">
        <li v-for="f in ['lila', 'orange', 'orange-text', 'flieder', 'creme', 'pfirsich', 'gelb']" :key="f">
          <span :style="{ background: `var(--farbe-${f})` }" />{{ f }}
        </li>
      </ul>
    </section>

    <section>
      <h2 class="vorschau__titel">Knöpfe</h2>
      <div class="vorschau__reihe">
        <BasisKnopf to="/">Zum Infochannel</BasisKnopf>
        <BasisKnopf to="/" variante="outline">Was wir tun</BasisKnopf>
        <BasisKnopf groesse="klein">Mitmachen</BasisKnopf>
        <span class="vorschau__lila"><BasisKnopf variante="hell" groesse="klein">Eintragen</BasisKnopf></span>
      </div>
    </section>

    <section>
      <h2 class="vorschau__titel">Hervorhebung</h2>
      <p class="display" style="font-size: var(--groesse-h1); color: var(--farbe-lila)">
        Königsdorf<br><BasisHervorhebung>Rückt zusammen</BasisHervorhebung>
      </p>
      <p class="display" style="font-size: var(--groesse-h2); color: var(--farbe-lila)">
        Was <BasisHervorhebung :drehung="2">kommt</BasisHervorhebung>
      </p>
    </section>

    <section>
      <h2 class="vorschau__titel">Notizzettel</h2>
      <div class="vorschau__raster">
        <BasisNotizzettel rahmen :drehung="1.5">Dorffeste, Konzerte und Kultur – gemeinsam organisieren.</BasisNotizzettel>
        <BasisNotizzettel farbe="pfirsich" tape="links" :drehung="-2">Mit Tape links</BasisNotizzettel>
        <BasisNotizzettel farbe="gelb" tape="rechts" tape-farbe="flieder" :drehung="2.5">Gelb, Tape rechts</BasisNotizzettel>
      </div>
    </section>

    <section>
      <h2 class="vorschau__titel">Termin-Zettel</h2>
      <div class="vorschau__raster">
        <BasisTerminZettel :termin="termine[0]!" :drehung="-1.5" />
        <BasisTerminZettel :termin="termine[1]!" :drehung="1" tape="rechts" tape-farbe="flieder" />
      </div>
    </section>

    <section>
      <h2 class="vorschau__titel">Artikel-Teaser</h2>
      <div class="vorschau__raster">
        <BasisArtikelTeaser :artikel="artikel" />
        <BasisArtikelTeaser :artikel="artikel" variante="spalte" />
        <BasisArtikelTeaser :artikel="artikel" variante="kompakt" />
      </div>
    </section>

    <section>
      <h2 class="vorschau__titel">Kleinanzeigen</h2>
      <div class="vorschau__raster">
        <BasisKleinanzeige v-for="a in anzeigen" :key="a.id" :anzeige="a" />
      </div>
    </section>

    <section>
      <h2 class="vorschau__titel">Polaroid</h2>
      <div class="vorschau__raster">
        <BasisPolaroid src="/platzhalter/foto-4x5.svg" alt="Platzhalter" :breite="400" :hoehe="500" unterschrift="Thomas" />
      </div>
    </section>

    <section>
      <h2 class="vorschau__titel">Trennlinien</h2>
      <BasisTrennlinie />
      <br>
      <BasisTrennlinie art="gestrichelt" farbe="schwarz" />
    </section>

    <section>
      <h2 class="vorschau__titel">Newsletter</h2>
      <div class="vorschau__lila" style="padding: 2rem">
        <BasisNewsletterBox
          variante="lila"
          titel="Neue Termine ins Postfach"
          text="Verpass keine unserer Veranstaltungen und meld dich für unser Rundschreiben an! Abmelden geht jederzeit."
        />
      </div>
      <br>
      <div style="max-width: 28rem">
        <BasisNewsletterBox variante="zettel" label="Schick mir die Neuigkeiten an:" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.vorschau {
  display: grid;
  gap: var(--abstand-xl);
  padding-block: var(--abstand-xl);
}

.vorschau__titel {
  margin-bottom: var(--abstand-m);
  font-size: var(--groesse-h3);
  color: var(--farbe-orange);
}

.vorschau__reihe {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-s);
}

.vorschau__raster {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--abstand-l);
  align-items: start;
}

.vorschau__farben {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-s);
  padding: 0;
  list-style: none;
  font-size: var(--groesse-s);
}

.vorschau__farben span {
  display: block;
  width: 5rem;
  height: 3rem;
  margin-bottom: 0.25rem;
  border: 1px solid rgb(0 0 0 / 0.15);
}

.vorschau__lila {
  --farbe-fokus: var(--farbe-gelb);
  display: inline-block;
  padding: 0.5rem;
  background: var(--farbe-lila);
}
</style>
