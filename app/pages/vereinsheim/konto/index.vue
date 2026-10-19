<script setup lang="ts">
// Mein Konto: Name und Passwort
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Mein Konto · Vereinsheim', robots: 'noindex, nofollow' })

const { ich, laden } = useVereinsheimIch()
const { zeige, fehler } = useVereinsheimMeldung()
const name = reactive({ first_name: ich.value?.first_name ?? '', last_name: ich.value?.last_name ?? '' })
const pw = reactive({ alt: '', neu: '', nochmal: '' })
const sendet = ref(false)

async function nameSpeichern() {
  try {
    await $fetch('/api/vereinsheim/konto', { method: 'PATCH', body: { ...name } })
    await laden()
    zeige('Neues Namensschild hängt!')
  }
  catch (e) {
    fehler(e)
  }
}

async function passwortAendern() {
  if (pw.neu !== pw.nochmal) return fehler({ statusMessage: 'Die beiden neuen Passwörter sind nicht gleich.' })
  sendet.value = true
  try {
    await $fetch('/api/vereinsheim/passwort', { method: 'POST', body: { alt: pw.alt, neu: pw.neu } })
    Object.assign(pw, { alt: '', neu: '', nochmal: '' })
    zeige('Neuer Schlüssel ist nachgemacht!')
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}
</script>

<template>
  <div class="konto">
    <VereinsheimKopf titel="Mein Konto" />
    <div class="konto__zettel">
      <BasisNotizzettel farbe="creme" befestigung="pin" :drehung="-1" class="konto__karte">
        <h2>Namensschild</h2>
        <form @submit.prevent="nameSpeichern">
          <BasisFeld v-model="name.first_name" label="Vorname" name="first_name" autocomplete="given-name" required />
          <BasisFeld v-model="name.last_name" label="Nachname" name="last_name" autocomplete="family-name" />
          <p class="konto__info">
            Benutzername: <strong>{{ ich?.benutzername ?? '–' }}</strong><br>
            E-Mail: <strong>{{ ich?.email ?? '–' }}</strong><br>
            <small>Benutzername oder E-Mail ändern? Sag dem Vorstand Bescheid.</small>
          </p>
          <BasisKnopf type="submit" variante="outline">Speichern</BasisKnopf>
        </form>
      </BasisNotizzettel>

      <BasisNotizzettel farbe="gelb" befestigung="pin" :drehung="1" class="konto__karte">
        <h2>Neuer Schlüssel</h2>
        <form @submit.prevent="passwortAendern">
          <BasisFeld v-model="pw.alt" label="Bisheriges Passwort" name="alt" type="password" autocomplete="current-password" required />
          <BasisFeld v-model="pw.neu" label="Neues Passwort" name="neu" type="password" autocomplete="new-password" required hinweis="mindestens 10 Zeichen – ein Satz geht auch gut" />
          <BasisFeld v-model="pw.nochmal" label="Neues Passwort nochmal" name="nochmal" type="password" autocomplete="new-password" required />
          <BasisKnopf type="submit" :disabled="sendet">{{ sendet ? 'Wird nachgemacht …' : 'Passwort ändern' }}</BasisKnopf>
        </form>
      </BasisNotizzettel>
    </div>
  </div>
</template>

<style scoped>
.konto {
  max-width: 62rem;
  margin-inline: auto;
}

.konto__zettel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  gap: var(--abstand-xl) var(--abstand-l);
}

.konto__karte {
  padding: 2.8rem var(--abstand-l) var(--abstand-l);
}

.konto__karte h2 {
  margin: 0 0 var(--abstand-s);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.konto__karte form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.konto__info {
  margin: 0;
  font-size: var(--groesse-xs);
}
</style>
