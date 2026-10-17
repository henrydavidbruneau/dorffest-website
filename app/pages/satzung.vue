<script setup lang="ts">
import satzung from '~/inhalte/satzung.md?raw'

useSeoMeta({ title: 'Satzung', description: 'Die Satzung des Vereins „Rückt Zusammen e.V.“ aus Frechen-Königsdorf.' })
</script>

<template>
  <BasisTextseite zusatz="Satzung des Vereins" titel="„Rückt Zusammen e.V.“" :inhalt="satzung">
    <p class="satzung__stand">Beschlossen in der Mitgliederversammlung am 19.03.2026.</p>
  </BasisTextseite>
</template>

<style scoped>
.satzung__stand {
  margin: var(--abstand-s) 0 0;
  font-family: var(--schrift-hand);
  font-size: var(--groesse-hand-m);
  color: var(--farbe-lila);
}
</style>
