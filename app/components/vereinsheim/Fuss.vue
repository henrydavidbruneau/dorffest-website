<script setup lang="ts">
// Fuß auf jeder Vereinsheim-Seite: „Wir sehen uns im Plenum!“ und der Weg zurück zur Website
</script>

<template>
  <footer class="vh-fuss">
    <BasisTrennlinie />
    <div class="vh-fuss__innen">
      <div>
        <p class="vh-fuss__titel">
          Wir sehen uns im <BasisHervorhebung :drehung="-1.5">Plenum!</BasisHervorhebung>
        </p>
        <p class="vh-fuss__text handschrift">Wer zuletzt geht, macht das Licht aus.</p>
      </div>
      <NuxtLink to="/" class="vh-fuss__website">← Zurück zur Website</NuxtLink>
    </div>
  </footer>
</template>

<style scoped>
.vh-fuss {
  width: 100%;
  max-width: calc(var(--inhaltsbreite) + 2 * var(--seitenrand));
  margin-inline: auto;
  padding: var(--abstand-xl) var(--seitenrand) var(--abstand-sektion);
}

.vh-fuss__innen {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--abstand-m);
  margin-top: var(--abstand-xl);
}

.vh-fuss__titel {
  margin: 0;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-h2);
  line-height: 1.1;
  text-transform: uppercase;
  color: var(--farbe-lila);
}

.vh-fuss__text {
  margin: var(--abstand-xs) 0 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.vh-fuss__website {
  color: var(--farbe-lila);
  font-weight: var(--gewicht-text-mittel);
}

@media print {
  .vh-fuss {
    display: none;
  }
}
</style>
