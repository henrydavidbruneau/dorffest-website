<script setup lang="ts">
// Eingang zum Vereinsheim: Holztür mit Schild, Login auf einem Karteikärtchen.
// Nach dem Anmelden geht die Tür kurz auf (ohne Animation bei reduced motion).
definePageMeta({ layout: false })
useSeoMeta({ title: 'Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const { ich, laden } = useVereinsheimIch()
const form = reactive({ kennung: '', passwort: '', turnstile: '' })
const status = ref<'bereit' | 'sendet' | 'auf' | 'fehler'>('bereit')
const fehler = ref('')

const weiter = computed(() => {
  const ziel = String(route.query.weiter ?? '')
  return ziel.startsWith('/vereinsheim') ? ziel : '/vereinsheim'
})

// Schon drin? Dann direkt rein.
onMounted(async () => {
  if (ich.value || await laden()) navigateTo(weiter.value)
})

async function reinkommen() {
  status.value = 'sendet'
  fehler.value = ''
  try {
    await $fetch('/api/vereinsheim/login', { method: 'POST', body: { ...form } })
    await laden()
    status.value = 'auf'
    const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => navigateTo(weiter.value), ruhig ? 0 : 900)
  }
  catch (e) {
    fehler.value = vhFehlertext(e)
    status.value = 'fehler'
    turnstileZuruecksetzen()
  }
}
</script>

<template>
  <main class="tuer-seite">
    <div class="tuer" :class="{ 'tuer--auf': status === 'auf' }">
      <div class="tuer__licht" aria-hidden="true" />
      <div class="tuer__blatt">
        <div class="tuer__schild">
          <img src="/logo-mobil.svg" alt="Königsdorf rückt zusammen" width="512" height="245" class="tuer__logo">
          <h1 class="tuer__titel">Vereinsheim</h1>
          <p class="tuer__untertitel handschrift">nur für Mitglieder &amp; Freund*innen</p>
        </div>

        <BasisNotizzettel farbe="creme" befestigung="pin" :drehung="-1.5" class="tuer__karte">
          <p v-if="route.query.tschuess && status === 'bereit'" class="tuer__hinweis handschrift" role="status">
            Tschüss! Bis bald im Vereinsheim.
          </p>
          <form class="tuer__form" novalidate @submit.prevent="reinkommen">
            <BasisFeld v-model="form.kennung" label="Benutzername oder E-Mail" name="kennung" autocomplete="username" required />
            <BasisFeld v-model="form.passwort" label="Passwort" type="password" name="passwort" autocomplete="current-password" required />
            <BasisTurnstile v-model="form.turnstile" />
            <p v-if="status === 'fehler'" class="tuer__fehler" role="alert">{{ fehler }}</p>
            <BasisKnopf type="submit" :disabled="status === 'sendet' || status === 'auf'">
              {{ status === 'sendet' ? 'Schlüssel dreht sich …' : status === 'auf' ? 'Komm rein!' : 'Reinkommen' }}
            </BasisKnopf>
          </form>
          <p class="tuer__klein">
            Passwort vergessen oder noch kein Zugang? Schreib dem Vorstand:
            <a href="mailto:kontakt@koenigsdorf-rueckt-zusammen.de">kontakt@koenigsdorf-rueckt-zusammen.de</a>
          </p>
        </BasisNotizzettel>

        <span class="tuer__klinke" aria-hidden="true" />
      </div>
    </div>
    <NuxtLink to="/" class="tuer__zurueck">← zurück zur Website</NuxtLink>
  </main>
</template>

<style scoped>
.tuer-seite {
  --holz: #6e4526;
  --holz-hell: #93603a;
  display: grid;
  place-items: center;
  gap: var(--abstand-m);
  min-height: 100svh;
  padding: var(--abstand-l) var(--seitenrand);
  background:
    linear-gradient(180deg, transparent 82%, rgb(0 0 0 / 0.25) 82%),
    var(--farbe-lila);
}

.tuer {
  position: relative;
  width: min(30rem, 100%);
  perspective: 1600px;
}

/* warmes Licht hinter der Tür, sichtbar wenn sie aufgeht */
.tuer__licht {
  position: absolute;
  inset: 0;
  border-radius: 12rem 12rem 0.5rem 0.5rem;
  background: radial-gradient(circle at 50% 40%, var(--farbe-gelb), var(--farbe-orange));
}

.tuer__blatt {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--abstand-m);
  padding: var(--abstand-l) var(--abstand-m) var(--abstand-xl);
  border: 3px solid #3d2513;
  border-radius: 12rem 12rem 0.5rem 0.5rem;
  background:
    repeating-linear-gradient(90deg, rgb(0 0 0 / 0.07) 0 2px, transparent 2px 3.5rem),
    repeating-linear-gradient(90deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 7px),
    linear-gradient(180deg, var(--holz-hell), var(--holz));
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.35);
  transform-origin: left center;
  transition: transform 0.9s cubic-bezier(0.5, 0, 0.3, 1);
}

.tuer--auf .tuer__blatt {
  transform: rotateY(-75deg);
}

.tuer__schild {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--abstand-s) var(--abstand-m);
  border: 2px solid var(--farbe-schwarz);
  border-radius: var(--radius-m);
  background: var(--farbe-gelb);
  box-shadow: 3px 3px 0 rgb(0 0 0 / 0.35);
  rotate: 1deg;
}

.tuer__logo {
  width: 7rem;
  height: auto;
}

.tuer__titel {
  margin: 0.2rem 0 0;
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1;
  color: var(--farbe-schwarz);
}

.tuer__untertitel {
  margin: 0;
  font-size: var(--groesse-hand-s);
  color: var(--farbe-orange-text);
}

.tuer__karte {
  width: 100%;
  padding: 2.8rem var(--abstand-m) var(--abstand-m);
}

.tuer__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.tuer__hinweis {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-hand-m);
  color: var(--farbe-lila);
}

.tuer__fehler {
  margin: 0;
  color: #a1260d;
  font-weight: var(--gewicht-text-normal);
}

.tuer__klein {
  margin: var(--abstand-s) 0 0;
  font-size: var(--groesse-xs);
}

.tuer__klinke {
  position: absolute;
  right: 1.4rem;
  top: 58%;
  width: 1.1rem;
  height: 2.8rem;
  border-radius: 0.6rem;
  background: linear-gradient(90deg, #c9a14a, #f0d27a, #a77f2c);
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.4);
}

.tuer__zurueck {
  color: var(--farbe-creme);
}

@media (prefers-reduced-motion: reduce) {
  .tuer__blatt {
    transition: none;
  }
}
</style>
