<script setup lang="ts">
// Ein Dorfanzeiger-Beitrag (Titelei, Autorzeile, Bild, Text, Aufruf-Kasten) – auf der Artikelseite
// und als Vorschau im Vereinsheim, damit beide gleich aussehen.
defineProps<{
  artikel: Pick<ArtikelDetail, 'titel' | 'teaser' | 'autor_in' | 'autor_in_bild' | 'veroeffentlicht_am' | 'datum_text' | 'lesedauer_minuten' | 'bild' | 'bild_alt' | 'bildunterschrift' | 'inhalt_html' | 'aufruf_titel' | 'aufruf_text' | 'aufruf_knopf' | 'aufruf_link'>
  dachzeile: string
}>()
</script>

<template>
  <div class="beitrag">
    <header class="beitrag__titelei">
      <p class="beitrag__dachzeile">{{ dachzeile }}</p>
      <h1 class="beitrag__titel">{{ artikel.titel }}</h1>
      <p class="beitrag__vorspann">{{ artikel.teaser }}</p>
    </header>

    <div class="beitrag__zeile">
      <span class="beitrag__autor">
        <NuxtImg
          v-if="artikel.autor_in_bild"
          :src="artikel.autor_in_bild" :provider="bildAnbieter(artikel.autor_in_bild)"
          alt=""
          width="64"
          height="64"
          class="beitrag__autorbild"
        />
        <template v-if="artikel.autor_in">Text: {{ artikel.autor_in }}</template>
      </span>
      <span>
        <time v-if="artikel.veroeffentlicht_am" :datetime="artikel.veroeffentlicht_am">{{ datumLang(artikel.veroeffentlicht_am) }}</time>
        <template v-else-if="artikel.datum_text">{{ artikel.datum_text }}</template>
        <template v-if="artikel.lesedauer_minuten"> · {{ artikel.lesedauer_minuten }} Min. Lesezeit</template>
      </span>
    </div>

    <figure v-if="artikel.bild" class="beitrag__hauptbild">
      <NuxtImg
        :src="artikel.bild" :provider="bildAnbieter(artikel.bild)"
        :alt="artikel.bild_alt ?? ''"
        width="1480"
        height="760"
        sizes="100vw md:740px"
        preload
      />
      <figcaption v-if="artikel.bildunterschrift">{{ artikel.bildunterschrift }}</figcaption>
    </figure>

    <!-- eslint-disable-next-line vue/no-v-html -- serverseitig aus Markdown erzeugt, rohes HTML wird escaped -->
    <div class="beitrag__text" v-html="artikel.inhalt_html" />

    <aside v-if="artikel.aufruf_titel" class="beitrag__aufruf">
      <div>
        <p class="beitrag__aufruf-titel">{{ artikel.aufruf_titel }}</p>
        <p v-if="artikel.aufruf_text" class="beitrag__aufruf-text">{{ artikel.aufruf_text }}</p>
      </div>
      <BasisKnopf v-if="artikel.aufruf_link" :to="artikel.aufruf_link" groesse="klein">
        {{ artikel.aufruf_knopf ?? 'Mitmachen' }}
      </BasisKnopf>
    </aside>
  </div>
</template>

<style scoped>
.beitrag__titelei {
  margin-top: var(--abstand-m);
}

.beitrag__titelei p {
  margin: 0;
}

.beitrag__dachzeile {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.875rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
  color: var(--farbe-orange-text);
}

.beitrag__titel {
  margin-top: 0.4rem;
  font-size: clamp(2.25rem, 4.6vw, 4rem);
  line-height: 0.95;
}

.beitrag__titelei .beitrag__vorspann {
  margin-top: 0.9rem;
  font-size: clamp(1rem, 1.3vw, 1.1875rem);
  font-weight: var(--gewicht-text-mittel);
  line-height: 1.5;
}

.beitrag__zeile {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  margin-top: var(--abstand-m);
  padding-block: 0.5rem;
  border-top: 2px solid var(--farbe-schwarz);
  border-bottom: 2px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.8125rem, 1vw, 0.875rem);
  text-transform: uppercase;
}

.beitrag__autor {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.beitrag__autorbild {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

/* ---------- Bilder ---------- */
.beitrag__hauptbild,
.beitrag__text :deep(figure) {
  margin: var(--abstand-m) 0 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--farbe-spaltenlinie);
}

.beitrag__hauptbild img {
  width: 100%;
  aspect-ratio: 2 / 1;
  object-fit: cover;
}

.beitrag__text :deep(figure img) {
  width: 100%;
  aspect-ratio: 3 / 1;
  object-fit: cover;
}

.beitrag__hauptbild figcaption,
.beitrag__text :deep(figcaption) {
  margin-top: 0.3rem;
  font-family: var(--schrift-hand);
  font-size: clamp(1.25rem, 1.6vw, 1.5rem);
  line-height: 1.1;
}

/* ---------- Fließtext ---------- */
.beitrag__text {
  margin-top: var(--abstand-l);
  font-size: clamp(1rem, 1.15vw, 1.0625rem);
  font-weight: var(--gewicht-text-normal);
  line-height: 1.75;
}

/* Text leicht eingerückt, Bilder und Zitate laufen über die volle Breite */
.beitrag__text :deep(p),
.beitrag__text :deep(h2),
.beitrag__text :deep(h3),
.beitrag__text :deep(h4) {
  max-width: 40rem;
  margin: 0 0 1em;
  padding-left: clamp(0.5rem, 1.6vw, 1.25rem);
}

.beitrag__text :deep(h2),
.beitrag__text :deep(h3),
.beitrag__text :deep(h4) {
  margin-top: 1.4em;
  margin-bottom: 0.4em;
  font-size: clamp(1.25rem, 1.8vw, 1.5rem);
  line-height: 1.1;
}

/* Initiale: am Anfang und nach einem Bild */
.beitrag__text :deep(> p:first-child::first-letter),
.beitrag__text :deep(figure + p::first-letter) {
  float: left;
  margin: 0.08em 0.4rem 0 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: 3.6em;
  line-height: 0.8;
  color: var(--farbe-orange);
}

.beitrag__text :deep(figure + p) {
  margin-top: var(--abstand-l);
}

.beitrag__text :deep(a) {
  color: var(--farbe-lila);
  text-decoration-color: var(--farbe-orange);
}

/* Zitatkasten zwischen dicken Linien */
.beitrag__text :deep(blockquote) {
  margin: var(--abstand-l) 0;
  padding: var(--abstand-m) var(--abstand-s);
  border-top: 4px solid var(--farbe-schwarz);
  border-bottom: 4px solid var(--farbe-schwarz);
  text-align: center;
}

.beitrag__text :deep(blockquote p) {
  max-width: none;
  margin: 0;
  padding: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.5rem, 2.6vw, 2.25rem);
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.beitrag__text :deep(blockquote footer) {
  margin-top: 0.4rem;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-s);
  color: var(--farbe-orange-text);
}

/* ---------- Aufruf ---------- */
.beitrag__aufruf {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--abstand-s);
  margin: var(--abstand-l) clamp(0.5rem, 1.6vw, 1.25rem) 0;
  padding: 1.1rem 1.4rem;
  border: 4px solid var(--farbe-schwarz);
  border-radius: var(--radius-l);
  background: var(--farbe-gelb);
  box-shadow: 0 0 0 5px var(--farbe-gelb);
}

.beitrag__aufruf p {
  margin: 0;
}

.beitrag__aufruf-titel {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.375rem, 2vw, 1.75rem);
  line-height: 1;
}

.beitrag__aufruf-text {
  margin-top: 0.25rem !important;
  font-size: var(--groesse-xs);
}
</style>
