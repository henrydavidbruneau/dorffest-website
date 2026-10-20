<script setup lang="ts">
// Rechtsklick-Menü (z.B. an Mails in „Post“): erscheint an der Mausposition, bleibt im Fenster,
// per Tastatur bedienbar (Pfeile, Pos1/Ende, Enter, Esc). Gruppen werden durch Linien getrennt.
import type { KontextEintrag } from '~/utils/kontextmenue'

const props = defineProps<{ x: number, y: number, gruppen: KontextEintrag[][], label?: string }>()
const emit = defineEmits<{ schliessen: [] }>()

const menue = ref<HTMLElement | null>(null)
const pos = ref({ left: props.x, top: props.y })

const knoepfe = () => [...(menue.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]

onMounted(async () => {
  await nextTick()
  const el = menue.value
  if (!el) return
  // nicht über den Fensterrand hinaus
  const { width, height } = el.getBoundingClientRect()
  pos.value = {
    left: Math.max(8, Math.min(props.x, window.innerWidth - width - 8)),
    top: Math.max(8, Math.min(props.y, window.innerHeight - height - 8)),
  }
  knoepfe()[0]?.focus()
  document.addEventListener('pointerdown', draussen, true)
  window.addEventListener('scroll', schliessen, true)
  window.addEventListener('resize', schliessen)
  window.addEventListener('blur', schliessen)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', draussen, true)
  window.removeEventListener('scroll', schliessen, true)
  window.removeEventListener('resize', schliessen)
  window.removeEventListener('blur', schliessen)
})

function schliessen() {
  emit('schliessen')
}

function draussen(e: PointerEvent) {
  if (!menue.value?.contains(e.target as Node)) schliessen()
}

function waehlen(eintrag: KontextEintrag) {
  schliessen()
  eintrag.aktion()
}

function taste(e: KeyboardEvent) {
  const liste = knoepfe()
  const i = liste.indexOf(document.activeElement as HTMLButtonElement)
  const ziel = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: liste.length - 1 }[e.key]
  if (ziel !== undefined) {
    e.preventDefault()
    liste[(ziel + liste.length) % liste.length]?.focus()
  }
  else if (e.key === 'Escape' || e.key === 'Tab') {
    e.preventDefault()
    schliessen()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="menue"
      class="kontext"
      role="menu"
      :aria-label="label ?? 'Aktionen'"
      :style="{ left: `${pos.left}px`, top: `${pos.top}px` }"
      @keydown="taste"
      @contextmenu.prevent
    >
      <template v-for="(gruppe, g) in gruppen.filter(x => x.length)" :key="g">
        <hr v-if="g > 0" class="kontext__linie">
        <button
          v-for="eintrag in gruppe"
          :key="eintrag.text"
          type="button"
          role="menuitem"
          class="kontext__eintrag"
          :class="{ 'kontext__eintrag--gefahr': eintrag.gefahr }"
          tabindex="-1"
          @click="waehlen(eintrag)"
        >
          {{ eintrag.text }}
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.kontext {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  min-width: 13rem;
  padding: 0.35rem;
  border: 1px solid var(--vh-rand);
  border-radius: 0.7rem;
  background: var(--farbe-weiss);
  box-shadow: 0 10px 30px rgb(22 20 15 / 0.18);
  font-family: var(--schrift-text);
}

.kontext__eintrag {
  padding: 0.5rem 0.8rem;
  border: 0;
  border-radius: 0.45rem;
  background: none;
  color: var(--farbe-schwarz);
  font: inherit;
  font-size: var(--groesse-s);
  text-align: left;
  cursor: pointer;
}

.kontext__eintrag:hover,
.kontext__eintrag:focus-visible {
  background: var(--farbe-pfirsich);
  outline: none;
}

.kontext__eintrag--gefahr {
  color: #a1260d;
}

.kontext__linie {
  margin: 0.3rem 0.4rem;
  border: 0;
  border-top: 1px solid var(--vh-rand);
}
</style>
