<script setup lang="ts">
const props = defineProps<{
  ausgabe: Ausgabe | null
  /** aktives Ressort (aus ?ressort=…) */
  ressort?: Ressort
}>()

const ausgabeText = computed(() =>
  props.ausgabe ? `Nr. ${props.ausgabe.nummer} · ${JAHRESZEITEN[props.ausgabe.jahreszeit]} ${props.ausgabe.jahr}` : '',
)
const ressorts = Object.entries(RESSORTS) as [Ressort, string][]
</script>

<template>
  <header class="zkopf">
    <p class="zkopf__zusatz handschrift">von Nachbar*innen für Nachbar*innen</p>
    <h1 class="zkopf__titel">Der Königsdorfer<br>Dorfanzeiger</h1>

    <div class="zkopf__meta">
      <span>{{ ausgabeText }}</span>
      <span class="zkopf__herausgeber"><span aria-hidden="true">✶</span> Herausgegeben von Rückt Zusammen e.V. <span aria-hidden="true">✶</span></span>
      <span>Kostet nix</span>
    </div>

    <nav class="zkopf__ressorts" aria-label="Ressorts">
      <ul>
        <li>
          <NuxtLink
            :to="{ query: {} }"
            class="zkopf__ressort"
            :class="{ 'zkopf__ressort--aktiv': !ressort }"
            :aria-current="!ressort ? 'page' : undefined"
          >
            Alle Ressorts
          </NuxtLink>
        </li>
        <li v-for="[schluessel, name] in ressorts" :key="schluessel">
          <NuxtLink
            :to="{ query: { ressort: schluessel } }"
            class="zkopf__ressort"
            :class="{ 'zkopf__ressort--aktiv': ressort === schluessel }"
            :aria-current="ressort === schluessel ? 'page' : undefined"
          >
            {{ name }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
/* Design: Handschrift 28, Titel 112 (2 Zeilen), dicke Linie 5px, Meta 15, Ressorts 20 */
.zkopf {
  text-align: center;
}

.zkopf__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.zkopf__titel {
  margin-top: 0.15rem;
  font-size: clamp(2.5rem, 7.78vw, 7rem);
  line-height: 0.88;
  color: var(--farbe-schwarz);
}

.zkopf__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  margin-top: clamp(1.25rem, 2.8vw, 2.5rem);
  padding-block: 0.7rem 0.6rem;
  border-top: 5px solid var(--farbe-schwarz);
  border-bottom: 1.5px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.8125rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
}

.zkopf__ressorts {
  border-bottom: 1.5px solid var(--farbe-schwarz);
}

.zkopf__ressorts ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem clamp(1rem, 2.2vw, 2rem);
  margin: 0;
  padding: 0.8rem 0 0.5rem;
  list-style: none;
}

.zkopf__ressort {
  display: inline-block;
  padding-bottom: 0.2rem;
  border-bottom: 3px solid transparent;
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(1rem, 1.39vw, 1.25rem);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--farbe-schwarz);
}

.zkopf__ressort:hover {
  border-bottom-color: var(--farbe-pfirsich);
}

.zkopf__ressort--aktiv,
.zkopf__ressort--aktiv:hover {
  border-bottom-color: var(--farbe-orange);
  color: var(--farbe-lila);
}

@media (max-width: 40rem) {
  .zkopf__meta {
    justify-content: center;
  }

  .zkopf__herausgeber {
    order: 3;
    width: 100%;
  }
}
</style>
