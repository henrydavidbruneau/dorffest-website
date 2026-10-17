<script setup lang="ts">
import { links } from '~/navigation'

// Platzhalter: Der Mitgliedsantrag (Formular + POST-Route) kommt in Phase 7.
useSeoMeta({ title: 'Mitglied werden', robots: 'noindex' })
const route = useRoute()
const name = computed(() => String(route.query.name ?? '').slice(0, 40))
</script>

<template>
  <section class="inhalt platzhalter">
    <p class="handschrift platzhalter__zusatz">{{ name ? `Hallo ${name}!` : 'Schön, dass du da bist!' }}</p>
    <h1>Mitglied werden</h1>
    <p>Der Mitgliedsantrag kommt hier bald hin. Bis dahin: Schreib uns einfach an <a :href="`mailto:${links.kontaktMail}`">{{ links.kontaktMail }}</a>.</p>
  </section>
</template>

<style scoped>
.platzhalter {
  padding-block: var(--abstand-sektion);
}

.platzhalter__zusatz {
  margin: 0;
  color: var(--farbe-orange-text);
}

.platzhalter h1 {
  margin-block: 0.5rem var(--abstand-m);
  font-size: var(--groesse-h2);
}
</style>
