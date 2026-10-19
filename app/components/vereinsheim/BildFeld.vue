<script setup lang="ts">
// Bild hochladen (im Browser verkleinert) oder entfernen; zeigt das aktuelle Bild als Polaroid
const wert = defineModel<string | null>()
const props = defineProps<{ label: string, ordner: string, hinweis?: string }>()
const { fehler } = useVereinsheimMeldung()
const laedt = ref(false)
const id = useId()

async function hochladen(e: Event) {
  const datei = (e.target as HTMLInputElement).files?.[0]
  if (!datei) return
  laedt.value = true
  try {
    const klein = datei.type === 'image/svg+xml' ? datei : await fotoVerkleinern(datei, 2400)
    wert.value = await vh.hochladen(klein, datei.name.replace(/\.\w+$/, '.jpg'), props.ordner)
  }
  catch (err) {
    fehler(err)
  }
  finally {
    laedt.value = false;
    (e.target as HTMLInputElement).value = ''
  }
}
</script>

<template>
  <div class="bildfeld">
    <span class="bildfeld__label vh-label">{{ label }}</span>
    <div class="bildfeld__reihe">
      <figure v-if="wert" class="bildfeld__polaroid">
        <img :src="vh.bild(wert, 400)" alt="Aktuelles Bild">
      </figure>
      <div class="bildfeld__knoepfe">
        <label :for="id" class="bildfeld__knopf">{{ laedt ? 'Lädt hoch …' : wert ? 'Anderes Bild' : 'Bild hochladen' }}</label>
        <input :id="id" type="file" accept="image/jpeg,image/png,image/webp" class="nur-screenreader" :disabled="laedt" @change="hochladen">
        <button v-if="wert" type="button" class="bildfeld__weg" @click="wert = null">Bild entfernen</button>
      </div>
    </div>
    <p v-if="hinweis" class="bildfeld__hinweis">{{ hinweis }}</p>
  </div>
</template>

<style scoped>
.bildfeld {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
}


.bildfeld__reihe {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-m);
}

.bildfeld__polaroid {
  margin: 0;
  padding: 0.5rem 0.5rem 1.4rem;
  background: var(--farbe-weiss);
  box-shadow: var(--schatten-zettel);
  rotate: -2deg;
}

.bildfeld__polaroid img {
  display: block;
  width: 8rem;
  height: 6rem;
  object-fit: cover;
}

.bildfeld__knoepfe {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-2xs);
}

.bildfeld__knopf,
.bildfeld__weg {
  padding: 0.45rem 0.9rem;
  border: 1.5px solid var(--farbe-lila);
  border-radius: var(--radius-m);
  background: var(--farbe-weiss);
  color: var(--farbe-lila);
  font: inherit;
  cursor: pointer;
}

.bildfeld__knopf:focus-within,
input:focus-visible + .bildfeld__knopf {
  outline: 3px solid var(--farbe-fokus);
}

.bildfeld__weg {
  border-color: transparent;
  background: none;
  text-decoration: underline;
}

.bildfeld__hinweis {
  margin: 0;
  color: var(--vh-gedaempft);
  font-size: var(--groesse-xs);
}
</style>
