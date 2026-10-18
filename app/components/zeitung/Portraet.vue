<script setup lang="ts">
defineProps<{ portraet: Portraet }>()
</script>

<template>
  <div class="portraet">
    <NuxtImg
      v-if="portraet.bild"
      :src="portraet.bild" :provider="bildAnbieter(portraet.bild)"
      :alt="portraet.bild_alt ?? ''"
      width="300"
      height="300"
      class="portraet__bild"
    />
    <div>
      <h3 class="portraet__name">{{ portraet.name }}</h3>
      <blockquote class="portraet__zitat handschrift">{{ portraet.zitat }}</blockquote>
      <NuxtLink v-if="portraet.artikel" :to="`/dorfanzeiger/${portraet.artikel}`" class="portraet__link">
        Zum Interview <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* Design: Kreis 150 mit orangem Rand, Name 26, Zitat in Handschrift ~36 */
.portraet {
  display: grid;
  grid-template-columns: clamp(6rem, 10.4vw, 9.4rem) 1fr;
  gap: var(--abstand-m);
  align-items: start;
  padding-top: var(--abstand-m);
}

.portraet__bild {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 4px solid var(--farbe-orange);
  border-radius: 50%;
}

.portraet__name {
  font-size: clamp(1.375rem, 1.8vw, 1.625rem);
}

.portraet__zitat {
  margin: 0.3rem 0 0.9rem;
  font-size: clamp(1.5rem, 2.15vw, 1.95rem);
  line-height: 1.15;
}

.portraet__link {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.9375rem, 1.15vw, 1.0625rem);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-orange-text);
}

.portraet__link:hover {
  text-decoration: underline;
}
</style>
