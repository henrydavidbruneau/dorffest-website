<script setup lang="ts">
// Seitenkopf im Vereinsheim: lila Band direkt unter der Navigation (wie das Dashboard),
// Titel optional mit Hervorhebung („Unsere [Termine]“), darunter eine sachliche Zeile, rechts die Aktionen.
defineProps<{
  titel?: string
  /** Wort im Flieder-Kasten hinter dem Titel */
  hervorhebung?: string
  zusatz?: string
  /** Link über dem Titel, z.B. zurück zur Übersicht */
  zurueck?: { to: string, text: string }
}>()
</script>

<template>
  <header class="vh-kopf">
    <div class="vh-kopf__innen">
      <div class="vh-kopf__text">
        <NuxtLink v-if="zurueck" :to="zurueck.to" class="vh-kopf__zurueck">← {{ zurueck.text }}</NuxtLink>
        <h1 class="vh-kopf__titel">
          {{ titel }}<template v-if="titel && hervorhebung">{{ ' ' }}</template><BasisHervorhebung v-if="hervorhebung" :drehung="-1.5">{{ hervorhebung }}</BasisHervorhebung>
        </h1>
        <p v-if="zusatz || $slots.meta" class="vh-kopf__zusatz">
          <slot name="meta" />{{ zusatz }}
        </p>
      </div>
      <div v-if="$slots.default" class="vh-kopf__aktionen"><slot /></div>
    </div>
  </header>
</template>

<style scoped>
/* volle Breite: aus dem Inhaltsbereich heraus bis an die Fensterränder, oben bündig an die Navigation */
.vh-kopf {
  --farbe-fokus: var(--farbe-gelb);
  margin: calc(-1 * var(--abstand-xl)) calc(50% - 50vw) var(--abstand-l);
  padding: var(--abstand-l) var(--seitenrand) clamp(2rem, 4vw, 3rem);
  background: var(--farbe-lila);
  color: var(--farbe-pfirsich);
}

.vh-kopf__innen {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--abstand-s) var(--abstand-m);
  max-width: var(--inhaltsbreite);
  margin-inline: auto;
}

.vh-kopf__text {
  min-width: 0;
}

.vh-kopf__zurueck {
  display: inline-block;
  margin-bottom: var(--abstand-xs);
  color: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
  text-decoration: none;
  opacity: 0.85;
}

.vh-kopf__zurueck:hover {
  opacity: 1;
  text-decoration: underline;
}

.vh-kopf__titel {
  margin: 0;
  font-size: clamp(2.25rem, 4.5vw, 3.5rem);
  line-height: 1.05;
  color: var(--farbe-pfirsich);
  overflow-wrap: anywhere;
}

.vh-kopf__titel :deep(.hervorhebung) {
  color: var(--farbe-weiss);
}

.vh-kopf__zusatz {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-xs);
  margin: 0.6rem 0 0;
  color: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
  opacity: 0.9;
}

.vh-kopf__aktionen {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-xs);
  margin-left: auto;
}

/* Knöpfe auf Lila: hell statt lila */
.vh-kopf__aktionen :deep(.knopf--gefuellt) {
  border-color: var(--farbe-pfirsich);
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}

.vh-kopf__aktionen :deep(.knopf--outline) {
  border-color: var(--farbe-pfirsich);
  background: transparent;
  color: var(--farbe-pfirsich);
}

@media print {
  .vh-kopf {
    margin: 0 0 var(--abstand-m);
    padding: 0;
    background: none;
    color: var(--farbe-schwarz);
  }

  .vh-kopf__titel {
    color: var(--farbe-schwarz);
  }
}
</style>
