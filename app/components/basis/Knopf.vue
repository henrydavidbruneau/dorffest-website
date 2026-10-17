<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Ziel: interne Route oder externe URL. Ohne `to` wird ein <button> gerendert */
    to?: string
    variante?: 'gefuellt' | 'outline' | 'hell'
    groesse?: 'normal' | 'klein'
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
  padding: 0.55em 1.4em;
  border: var(--linie-dicke) solid var(--farbe-lila);
  border-radius: var(--radius-knopf);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: var(--groesse-m);
  line-height: 1.1;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-decoration: none;
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

.knopf--gefuellt {
  background: var(--farbe-lila);
  color: var(--farbe-weiss);
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
  border-color: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}

.knopf--klein {
  padding: 0.4em 1em;
  font-size: var(--groesse-s);
}
</style>
