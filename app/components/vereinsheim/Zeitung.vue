<script setup lang="ts">
// Zeitungsblatt auf lila Grund wie im Dorfanzeiger – für den Redaktionstisch im Vereinsheim
defineProps<{ titel: string, zusatz?: string, meta?: string }>()
</script>

<template>
  <div class="vh-zeitung">
    <div class="vh-zeitung__blatt">
      <BasisKlebeband position="links" farbe="gelb" :drehung="-3" :breite="6" class="vh-zeitung__tape" />
      <BasisKlebeband position="rechts" farbe="flieder" :drehung="3" :breite="6" class="vh-zeitung__tape" />
      <header class="vh-zeitung__kopf">
        <p v-if="zusatz" class="vh-zeitung__zusatz handschrift">{{ zusatz }}</p>
        <h1 class="vh-zeitung__titel">{{ titel }}</h1>
        <p class="vh-zeitung__meta">
          <span>Der Königsdorfer Dorfanzeiger</span>
          <span>✶ {{ meta ?? 'Redaktionstisch im Vereinsheim' }} ✶</span>
          <span>Kostet nix</span>
        </p>
        <div v-if="$slots.ressorts" class="vh-zeitung__ressorts"><slot name="ressorts" /></div>
      </header>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.vh-zeitung {
  padding: clamp(2rem, 4.5vw, 4rem) var(--seitenrand) var(--abstand-sektion);
  background: var(--farbe-lila);
}

.vh-zeitung__blatt {
  position: relative;
  max-width: 69.25rem;
  margin-inline: auto;
  padding: clamp(1.5rem, 3.9vw, 3.5rem);
  border-radius: var(--radius-xl);
  background: var(--farbe-zeitungspapier);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
  rotate: -0.3deg;
}

.vh-zeitung__kopf {
  margin-bottom: var(--abstand-l);
  text-align: center;
}

.vh-zeitung__zusatz {
  margin: 0;
  font-size: var(--groesse-hand-m);
  color: var(--farbe-orange-text);
}

.vh-zeitung__titel {
  margin: 0.15rem 0 0;
  font-size: clamp(2.5rem, 5.5vw, 5rem);
  line-height: 0.9;
  color: var(--farbe-schwarz);
}

.vh-zeitung__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  margin: clamp(1rem, 2vw, 1.75rem) 0 0;
  padding-block: 0.6rem 0.5rem;
  border-top: 5px solid var(--farbe-schwarz);
  border-bottom: 1.5px solid var(--farbe-schwarz);
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(0.8125rem, 1.04vw, 0.9375rem);
  text-transform: uppercase;
}

.vh-zeitung__ressorts {
  border-bottom: 1.5px solid var(--farbe-schwarz);
}

@media (max-width: 48rem) {
  .vh-zeitung__blatt {
    rotate: none;
  }
}
</style>
