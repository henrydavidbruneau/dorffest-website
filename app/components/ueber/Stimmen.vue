<script setup lang="ts">
const { data: stimmen } = await useStimmen()
const aktivId = ref<number | null>(null)
const aktiv = computed(() => stimmen.value.find(s => s.id === aktivId.value) ?? stimmen.value[0] ?? null)
</script>

<template>
  <section v-if="aktiv" class="stimmen" aria-labelledby="stimmen-titel">
    <div class="inhalt-breit">
      <div class="stimmen__raster strich-oben-unten">
      <BasisPolaroid
        :key="`bild-${aktiv.id}`"
        :src="aktiv.bild ?? '/fotos/stimme-thomas.webp'"
        :alt="aktiv.bild_alt ?? ''"
        :breite="664"
        :hoehe="690"
        :unterschrift="aktiv.name"
        :drehung="-2.5"
        class="stimmen__polaroid"
      />

      <div>
        <h2 id="stimmen-titel" class="stimmen__titel">
          Stimmen aus dem <BasisHervorhebung>Verein</BasisHervorhebung>
        </h2>
        <figure :key="`zitat-${aktiv.id}`" class="stimmen__zitat" aria-live="polite">
          <blockquote class="handschrift">{{ aktiv.zitat }}</blockquote>
          <figcaption>{{ aktiv.name }}</figcaption>
        </figure>

        <div class="stimmen__auswahl" role="group" aria-label="Weitere Stimmen">
          <button
            v-for="s in stimmen"
            :key="s.id"
            type="button"
            class="stimmen__avatar"
            :class="{ 'stimmen__avatar--aktiv': s.id === aktiv.id }"
            :aria-pressed="s.id === aktiv.id"
            @click="aktivId = s.id"
          >
            <NuxtImg v-if="s.bild" :src="s.bild" alt="" width="160" height="160" />
            <span class="nur-screenreader">{{ s.name }}</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Design: Polaroid 360×412, Titel 55, Zitat Handschrift ~49/65, Avatare 65 (aktiv 78 mit Ring) */
.stimmen__raster {
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
  padding-block: clamp(3rem, 8vw, 7.5rem);
}

.stimmen__polaroid {
  width: min(75%, 22.5rem);
  justify-self: center;
  animation: einblenden 0.35s ease both;
}

.stimmen__polaroid :deep(.polaroid__bild) {
  aspect-ratio: 332 / 345;
}

.stimmen__titel {
  font-size: clamp(2.25rem, 3.8vw, 3.4375rem);
}

.stimmen__zitat {
  margin: clamp(1.25rem, 2.6vw, 2.25rem) 0 0;
  animation: einblenden 0.35s ease both;
}

.stimmen__zitat blockquote {
  margin: 0;
  font-size: clamp(2rem, 4.1vw, 3.7rem);
  line-height: 1.12;
}

.stimmen__zitat figcaption {
  margin-top: var(--abstand-s);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1.5rem, 2vw, 1.75rem);
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.stimmen__auswahl {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.1rem;
  margin-top: var(--abstand-l);
}

.stimmen__avatar {
  width: 4.1rem;
  height: 4.1rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  transition: transform var(--dauer-kurz) ease;
}

.stimmen__avatar:hover {
  transform: scale(1.06);
}

.stimmen__avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.stimmen__avatar--aktiv {
  width: 4.9rem;
  height: 4.9rem;
  padding: 3px;
  border: 3px solid var(--farbe-orange);
}

@keyframes einblenden {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (min-width: 48rem) {
  .stimmen__raster {
    grid-template-columns: 22.5rem 1fr;
    gap: clamp(2.5rem, 6vw, 5.5rem);
  }
}
</style>
