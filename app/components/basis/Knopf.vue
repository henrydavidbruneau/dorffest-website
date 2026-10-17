<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Ziel: interne Route oder externe URL. Ohne `to` wird ein <button> gerendert */
    to?: string
    variante?: 'gefuellt' | 'outline' | 'hell'
    /** klein = Navigation (42px), normal = Hero (53px), gross = "Mehr erfahren" (72px) */
    groesse?: 'klein' | 'normal' | 'gross'
    type?: 'button' | 'submit'
  }>(),
  { to: undefined, variante: 'gefuellt', groesse: 'normal', type: 'button' },
)

const klassen = computed(() => ['knopf', `knopf--${props.variante}`, `knopf--${props.groesse}`])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="klassen">
    <slot />
  </NuxtLink>
  <button v-else :type="type" :class="klassen">
    <slot />
  </button>
</template>

<style scoped>
.knopf {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  border: var(--linie-dicke) solid var(--farbe-lila);
  border-radius: var(--radius-knopf);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform var(--dauer-kurz) ease,
    box-shadow var(--dauer-kurz) ease,
    background-color var(--dauer-kurz) ease;
}

.knopf:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 0 rgb(0 0 0 / 0.2);
}

.knopf:active {
  transform: translateY(0);
  box-shadow: none;
}

/* ---------- Größen (Design: 160×42 / 195×53 / 260×72) ---------- */
.knopf--klein {
  min-height: 2.625rem;
  padding: 0.5em 2.3em;
  font-size: var(--groesse-knopf-klein);
}

.knopf--normal {
  min-height: clamp(2.75rem, 3.68vw, 3.3125rem);
  padding: 0.55em 1em;
  font-size: var(--groesse-knopf);
}

.knopf--gross {
  min-height: clamp(3.5rem, 5vw, 4.5rem);
  padding: 0.6em 1.45em;
  font-size: var(--groesse-knopf-gross);
}

/* ---------- Varianten ---------- */
.knopf--gefuellt {
  background: var(--farbe-lila);
  color: var(--farbe-weiss);
}

/* große Knöpfe tragen im Design Pfirsich-Schrift */
.knopf--gefuellt.knopf--gross {
  color: var(--farbe-pfirsich);
}

.knopf--outline {
  background: transparent;
  color: var(--farbe-lila);
}

.knopf--outline:hover {
  background: var(--farbe-weiss);
}

/* auf lila Grund */
.knopf--hell {
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}
</style>
