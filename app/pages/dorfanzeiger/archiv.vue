<script setup lang="ts">
// Archiv des Dorfanzeigers: alle Artikel, neueste zuerst, nach Monat gruppiert; Ressort-Filter wie auf der Übersicht
definePageMeta({ layout: 'zeitung' })

const route = useRoute()
const ressort = computed<Ressort | undefined>(() => {
  const wert = String(route.query.ressort ?? '')
  return wert in RESSORTS ? (wert as Ressort) : undefined
})

const { data: artikel } = await useDorfanzeiger({ ressort, mitInterviews: true })

const wann = (a: Artikel) => a.veroeffentlicht_am
const monate = computed(() => {
  const gruppen: { titel: string, artikel: Artikel[] }[] = []
  for (const a of artikel.value) {
    const titel = wann(a) ? monatJahr(wann(a)!) : 'Ohne Datum'
    const letzte = gruppen.at(-1)
    if (letzte?.titel === titel) letzte.artikel.push(a)
    else gruppen.push({ titel, artikel: [a] })
  }
  return gruppen
})

useSeoMeta({
  title: 'Archiv – Der Königsdorfer Dorfanzeiger',
  description: 'Alle Artikel aus dem Königsdorfer Dorfanzeiger: Feste, Vereinsleben, Rezepte, Porträts und mehr.',
  ogTitle: 'Archiv – Der Königsdorfer Dorfanzeiger',
})
</script>

<template>
  <ZeitungBlatt>
    <ZeitungKopf :stand="artikel[0] ? wann(artikel[0]) : null" :ressort="ressort" basis="/dorfanzeiger/archiv" />

    <div class="archiv__kopf">
      <h2 class="archiv__titel">Archiv</h2>
      <p class="archiv__anzahl">{{ artikel.length }} Artikel{{ ressort ? ` im Ressort ${RESSORTS[ressort]}` : '' }}</p>
      <NuxtLink to="/dorfanzeiger" class="archiv__zurueck handlink">← zur aktuellen Seite</NuxtLink>
    </div>

    <p v-if="!artikel.length" class="archiv__leer">
      Hier ist noch nichts erschienen.
      <NuxtLink :to="{ query: {} }">Alle Ressorts zeigen</NuxtLink>
    </p>

    <section v-for="(m, i) in monate" :key="m.titel" class="archiv__monat" :aria-labelledby="`monat-${i}`">
      <h3 :id="`monat-${i}`" class="archiv__monat-titel">{{ m.titel }}</h3>
      <ol class="archiv__liste">
        <li v-for="a in m.artikel" :key="a.id" class="eintrag">
          <time v-if="wann(a)" :datetime="wann(a)!" class="eintrag__datum">
            <span class="eintrag__tag">{{ tagZahl(wann(a)!) }}</span>
            <span class="eintrag__monat">{{ monatKurz(wann(a)!) }}</span>
          </time>
          <span v-else class="eintrag__datum" />
          <div class="eintrag__text">
            <p class="eintrag__ressort">{{ RESSORTS[a.ressort] }}</p>
            <h4 class="eintrag__titel">
              <NuxtLink :to="`/dorfanzeiger/${a.slug}`">{{ a.titel }}</NuxtLink>
            </h4>
            <p class="eintrag__teaser">{{ a.teaser_kurz ?? a.teaser }}</p>
            <p v-if="a.autor_in || a.lesedauer_minuten" class="eintrag__meta">
              {{ [a.autor_in ? `Text: ${a.autor_in}` : '', a.lesedauer_minuten ? `${a.lesedauer_minuten} Min.` : ''].filter(Boolean).join(' · ') }}
            </p>
          </div>
          <NuxtImg
            v-if="a.bild"
            :src="a.bild"
            :provider="bildAnbieter(a.bild)"
            :alt="a.bild_alt ?? ''"
            width="240"
            height="160"
            sizes="160px"
            loading="lazy"
            class="eintrag__bild"
          />
        </li>
      </ol>
    </section>
  </ZeitungBlatt>
</template>

<style scoped>
.archiv__kopf {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--abstand-2xs) var(--abstand-m);
  margin-top: clamp(1.5rem, 2.8vw, 2.5rem);
  padding-bottom: var(--abstand-s);
  border-bottom: 5px solid var(--farbe-schwarz);
}

.archiv__titel {
  margin: 0;
  font-size: var(--groesse-masthead);
  line-height: 1;
  color: var(--farbe-schwarz);
}

.archiv__anzahl {
  margin: 0;
  font-size: var(--groesse-xs);
}

.archiv__zurueck {
  margin-left: auto;
  color: var(--farbe-lila);
}

.archiv__leer {
  padding-block: var(--abstand-xl);
  text-align: center;
}

.archiv__monat {
  margin-top: var(--abstand-l);
}

.archiv__monat-titel {
  margin: 0;
  padding-bottom: 0.4rem;
  border-bottom: 1.5px solid var(--farbe-schwarz);
  font-size: clamp(1.25rem, 1.8vw, 1.6rem);
  color: var(--farbe-lila);
}

.archiv__liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* eine Zeile wie im Inhaltsverzeichnis: Datum · Text · kleines Bild */
.eintrag {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  gap: var(--abstand-2xs) var(--abstand-m);
  padding-block: var(--abstand-m);
  border-bottom: 1px solid var(--farbe-spaltenlinie);
}

.eintrag__datum {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.eintrag__tag {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 2rem;
}

.eintrag__monat {
  font-size: var(--groesse-xs);
  text-transform: uppercase;
}

.eintrag__text p {
  margin: 0;
}

.eintrag__ressort {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.eintrag__titel {
  margin: 0.1rem 0 0.3rem;
  font-size: var(--groesse-h4);
  line-height: 1.05;
}

.eintrag__titel a {
  color: var(--farbe-schwarz);
  text-decoration: none;
}

.eintrag__titel a:hover {
  color: var(--farbe-lila);
  text-decoration: underline;
}

.eintrag__teaser {
  font-size: var(--groesse-s);
  line-height: 1.55;
}

.eintrag .eintrag__meta {
  margin-top: 0.3rem;
  font-size: var(--groesse-xs);
  color: #5c564d;
}

.eintrag__bild {
  display: none;
}

@media (min-width: 48rem) {
  .eintrag {
    grid-template-columns: 4rem minmax(0, 1fr) 10rem;
  }

  .eintrag__bild {
    display: block;
    width: 10rem;
    height: 6.75rem;
    object-fit: cover;
  }
}
</style>
