<script setup lang="ts">
// Wie kommt das Vereinsheim aufs Handy? Text je nach Gerät (Popup nach der Tour und Mein Profil)
import type { AppGeraet } from '~/composables/useVereinsheimApp'

defineProps<{ geraet: AppGeraet }>()
const { public: { siteUrl } } = useRuntimeConfig()
// Umlaut-Domain lesbar zeigen (der Browser kennt sie nur als xn--…)
const adresse = computed(() => {
  if (!import.meta.client) return ''
  const host = window.location.hostname.startsWith('xn--') ? siteUrl.replace(/^https?:\/\//, '') : window.location.host
  return `${host}/vereinsheim`
})
</script>

<template>
  <div class="anleitung">
    <p v-if="geraet === 'installiert'">Du nutzt das Vereinsheim schon als App. 🎉</p>
    <p v-else-if="geraet === 'knopf'">Mit einem Tipp liegt das Vereinsheim als App auf deinem Startbildschirm – mit eigenem Symbol, ohne Browserleiste.</p>
    <template v-else-if="geraet === 'ios-safari'">
      <p>So liegt das Vereinsheim als App auf deinem Home-Bildschirm:</p>
      <ol>
        <li>
          Unten auf <span class="anleitung__nowrap"><strong>Teilen</strong> tippen <svg class="anleitung__teilen" viewBox="0 0 24 24" aria-label="(Symbol: Kästchen mit Pfeil nach oben)" role="img"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
        </li>
        <li><strong>Zum Home-Bildschirm</strong> wählen (evtl. etwas nach unten wischen)</li>
        <li>Oben rechts <strong>Hinzufügen</strong> – fertig!</li>
      </ol>
    </template>
    <p v-else-if="geraet === 'ios-anderer'">Auf dem iPhone geht das nur in <strong>Safari</strong>: Öffne <strong>{{ adresse }}</strong> dort und tippe auf <strong>Teilen → Zum Home-Bildschirm</strong>.</p>
    <p v-else-if="geraet === 'handy'">Öffne im Browser-Menü <strong>(⋮)</strong> den Punkt <strong>„App installieren“</strong> bzw. <strong>„Zum Startbildschirm hinzufügen“</strong>.</p>
    <p v-else>Das Vereinsheim gibt’s auch als App fürs Handy: Öffne <strong>{{ adresse }}</strong> auf deinem Handy – dort zeigen wir dir, wie’s geht.</p>
  </div>
</template>

<style scoped>
.anleitung p,
.anleitung ol {
  margin: 0;
  font-size: var(--groesse-s);
  line-height: 1.55;
}

.anleitung ol {
  margin-top: var(--abstand-2xs);
  padding-left: 1.3rem;
}

.anleitung__nowrap {
  white-space: nowrap;
}

.anleitung__teilen {
  display: inline-block;
  width: 1.15em;
  height: 1.15em;
  vertical-align: -0.2em;
  color: #0a84ff;
}
</style>
