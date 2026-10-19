<script setup lang="ts">
// Eingang zum Vereinsheim: schlichte Anmeldekarte auf lila Grund (Benutzername oder E-Mail + Passwort)
definePageMeta({ layout: false })
useSeoMeta({ title: 'Vereinsheim', robots: 'noindex, nofollow' })

const route = useRoute()
const { ich, laden } = useVereinsheimIch()
const verein = useVerein()
const form = reactive({ kennung: '', passwort: '', turnstile: '' })
const status = ref<'bereit' | 'sendet' | 'fehler'>('bereit')
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
    await navigateTo(weiter.value)
  }
  catch (e) {
    fehler.value = vhFehlertext(e)
    status.value = 'fehler'
    turnstileZuruecksetzen()
  }
}
</script>

<template>
  <main class="login">
    <div class="login__karte">
      <header class="login__kopf">
        <img src="/logo-mobil.svg" alt="Königsdorf rückt zusammen" width="512" height="245" class="login__logo">
        <h1 class="login__titel">Vereinsheim</h1>
        <p class="login__text">Der interne Bereich für Mitglieder: Termine, Dorfanzeiger, Kasse und mehr.</p>
      </header>

      <form class="login__form" novalidate @submit.prevent="reinkommen">
        <BasisFeld v-model="form.kennung" label="Benutzername oder E-Mail" name="kennung" autocomplete="username" required />
        <BasisFeld v-model="form.passwort" label="Passwort" type="password" name="passwort" autocomplete="current-password" required />
        <BasisTurnstile v-model="form.turnstile" />
        <p v-if="status === 'fehler'" class="login__fehler" role="alert">{{ fehler }}</p>
        <BasisKnopf type="submit" class="login__knopf" :disabled="status === 'sendet'">
          {{ status === 'sendet' ? 'Anmelden …' : 'Anmelden' }}
        </BasisKnopf>
      </form>

      <p class="login__hilfe">
        Passwort vergessen oder noch kein Zugang? Schreib dem Vorstand:<br>
        <a :href="`mailto:${verein.kontakt_email}`">{{ verein.kontakt_email }}</a>
      </p>
    </div>
    <NuxtLink to="/" class="login__zurueck">← zurück zur Website</NuxtLink>
  </main>
</template>

<style scoped>
.login {
  --farbe-fokus: var(--farbe-gelb);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--abstand-m);
  min-height: 100svh;
  padding: var(--abstand-l) var(--seitenrand);
  background: var(--farbe-lila);
}

.login__karte {
  --farbe-fokus: var(--farbe-lila);
  width: min(26rem, 100%);
  padding: clamp(1.5rem, 5vw, 2.5rem);
  border-radius: 1.25rem;
  background: var(--farbe-creme);
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.3);
}

.login__kopf {
  margin-bottom: var(--abstand-m);
  text-align: center;
}

.login__logo {
  display: block;
  width: 7rem;
  margin-inline: auto;
  height: auto;
}

.login__titel {
  margin: var(--abstand-s) 0 0;
  font-size: clamp(2.25rem, 7vw, 2.75rem);
  line-height: 1;
  color: var(--farbe-lila);
}

.login__text {
  margin: var(--abstand-xs) 0 0;
  font-size: var(--groesse-xs);
  color: #6b6259;
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

/* Felder wie im Vereinsheim: durchgezogener, heller Rahmen */
.login__form :deep(.feld__label) {
  font-family: var(--schrift-text);
  font-weight: var(--gewicht-text-mittel);
  font-size: var(--groesse-xs);
  text-transform: none;
}

.login__form :deep(.feld__optional) {
  display: none;
}

.login__form :deep(.feld__eingabe) {
  border: 1.5px solid #c9bfb0;
  border-radius: 0.6rem;
  background: var(--farbe-weiss);
}

.login__form :deep(.feld__eingabe:focus) {
  border-color: var(--farbe-lila);
  outline: none;
  box-shadow: 0 0 0 3px rgb(122 42 126 / 0.18);
}

.login__knopf {
  width: 100%;
  margin-top: var(--abstand-2xs);
}

.login__fehler {
  margin: 0;
  padding: var(--abstand-xs) var(--abstand-s);
  border-left: 4px solid #a1260d;
  background: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
}

.login__hilfe {
  margin: var(--abstand-m) 0 0;
  padding-top: var(--abstand-s);
  border-top: 1px solid #e4dccf;
  color: #6b6259;
  font-size: var(--groesse-xs);
  text-align: center;
}

.login__hilfe a {
  color: var(--farbe-lila);
  overflow-wrap: anywhere;
}

.login__zurueck {
  color: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
}
</style>
