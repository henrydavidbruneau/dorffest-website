<script setup lang="ts">
// Mein Profil: Name, Profilbild, Passwort, Vereinsheim aufs Handy, Benachrichtigungen, die Tour zum Wiederholen und Abmelden
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Mein Profil · Vereinsheim', robots: 'noindex, nofollow' })

const { ich, laden } = useVereinsheimIch()
const { zeige, fehler } = useVereinsheimMeldung()
const name = reactive({ first_name: ich.value?.first_name ?? '', last_name: ich.value?.last_name ?? '' })
const pw = reactive({ alt: '', neu: '', nochmal: '' })
const sendet = ref(false)
const tour = useVereinsheimTour()

// ---------- Profilbild (rund, klein oben in der Navigation) ----------
const bildLaedt = ref(false)
async function bildHochladen(e: Event) {
  const eingabe = e.target as HTMLInputElement
  const datei = eingabe.files?.[0]
  if (!datei) return
  bildLaedt.value = true
  try {
    const klein = await fotoVerkleinern(datei, 600)
    const id = await vh.hochladen(klein, 'profilbild.jpg', 'profilbilder')
    await $fetch('/api/vereinsheim/konto', { method: 'PATCH', body: { avatar: id } })
    await laden()
    zeige('Profilbild gespeichert.')
  }
  catch (err) {
    fehler(err)
  }
  bildLaedt.value = false
  eingabe.value = ''
}

async function bildEntfernen() {
  try {
    await $fetch('/api/vereinsheim/konto', { method: 'PATCH', body: { avatar: null } })
    await laden()
    zeige('Profilbild entfernt.')
  }
  catch (err) {
    fehler(err)
  }
}

async function nameSpeichern() {
  try {
    await $fetch('/api/vereinsheim/konto', { method: 'PATCH', body: { ...name } })
    await laden()
    zeige('Name gespeichert.')
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
    zeige('Passwort geändert.')
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = false
}

// ---------- Vereinsheim aufs Handy (installierbare Web-App) ----------
const app = useVereinsheimApp()
onMounted(() => app.erkennen())

async function appInstallieren() {
  if (await app.installieren()) zeige('Installiert – das Vereinsheim liegt jetzt auf deinem Startbildschirm.')
  push.pruefen()
}

// ---------- Benachrichtigungen auf diesem Gerät ----------
const push = useVereinsheimPush()
onMounted(() => push.pruefen())

async function pushEin() {
  try {
    const r = await push.einschalten()
    if (r) zeige(r.post ? 'Benachrichtigungen an – auch für neue Post.' : 'Benachrichtigungen an.')
  }
  catch (e) {
    fehler(e)
  }
}

async function pushAus() {
  try {
    await push.ausschalten()
    zeige('Benachrichtigungen auf diesem Gerät aus.')
  }
  catch (e) {
    fehler(e)
  }
}

async function pushProbe() {
  try {
    await push.probe()
    zeige('Probe ist unterwegs.')
  }
  catch (e) {
    fehler(e)
  }
}

// Abmelden: Sitzung beenden, dann neu laden – so ist auch alles Gemerkte (Post, Profil) aus dem Browser weg
const meldetAb = ref(false)
async function abmelden() {
  meldetAb.value = true
  try {
    await $fetch('/api/vereinsheim/logout', { method: 'POST' })
    window.location.href = '/vereinsheim/tuer'
  }
  catch (e) {
    fehler(e)
    meldetAb.value = false
  }
}
</script>

<template>
  <div class="konto">
    <VereinsheimKopf titel="Mein" hervorhebung="Profil" />
    <div class="konto__zettel">
      <div class="vh-karte konto__karte">
        <h2>Profilbild</h2>
        <div class="konto__bild">
          <img v-if="ich?.avatar" :src="vh.bild(ich.avatar, 240)" alt="Dein Profilbild" class="konto__avatar" width="112" height="112">
          <span v-else class="konto__avatar konto__avatar--leer" aria-hidden="true"><VereinsheimIcon name="konto" /></span>
          <div class="konto__bild-knoepfe">
            <input id="profilbild" type="file" accept="image/jpeg,image/png,image/webp" class="nur-screenreader" :disabled="bildLaedt" @change="bildHochladen">
            <label for="profilbild" class="konto__hochladen">{{ bildLaedt ? 'Lädt hoch …' : ich?.avatar ? 'Anderes Bild' : 'Bild hochladen' }}</label>
            <button v-if="ich?.avatar" type="button" class="vh-aktion vh-aktion--gefahr" @click="bildEntfernen">Bild entfernen</button>
            <small>Erscheint rund oben in der Navigation. Am besten ein Foto, auf dem man dich erkennt.</small>
          </div>
        </div>
      </div>

      <div class="vh-karte konto__karte">
        <h2>Vereinsheim aufs Handy</h2>
        <VereinsheimAppAnleitung :geraet="app.geraet.value" class="konto__tour-text" />
        <BasisKnopf v-if="app.geraet.value === 'knopf'" variante="outline" @click="appInstallieren">Installieren</BasisKnopf>
      </div>

      <div class="vh-karte konto__karte">
        <h2>Benachrichtigungen</h2>
        <p class="konto__info konto__tour-text">
          {{ ich?.vorstand ? 'Bei neuer Post im Kontakt-Postfach und neuen Wünschen auf einer Wunschliste (z.B. Songwünsche) meldet sich dein Handy oder Rechner sofort.' : 'Bei neuen Wünschen auf einer Wunschliste (z.B. Songwünsche) meldet sich dein Handy oder Rechner sofort.' }}
          Gilt nur für dieses Gerät.
        </p>
        <template v-if="push.zustand.value === 'an'">
          <p class="konto__info konto__tour-text"><strong>An auf diesem Gerät.</strong></p>
          <div class="konto__knoepfe">
            <BasisKnopf variante="outline" @click="pushProbe">Probe schicken</BasisKnopf>
            <button type="button" class="vh-aktion" :disabled="push.arbeitet.value" @click="pushAus">Ausschalten</button>
          </div>
        </template>
        <BasisKnopf v-else-if="push.zustand.value === 'aus'" variante="outline" :disabled="push.arbeitet.value" @click="pushEin">{{ push.arbeitet.value ? 'Schaltet ein …' : 'Einschalten' }}</BasisKnopf>
        <p v-else-if="push.zustand.value === 'erst-installieren'" class="konto__info">
          Auf dem {{ push.ios.value ? 'iPhone' : 'Handy' }} geht das nur mit dem Vereinsheim als App:
          in Safari unten auf <strong>Teilen</strong> tippen → <strong>Zum Home-Bildschirm</strong>.
          Dann das Vereinsheim über das neue Symbol öffnen und hier einschalten.
        </p>
        <p v-else-if="push.zustand.value === 'blockiert'" class="konto__info">
          Benachrichtigungen sind für diese Seite blockiert. Erlauben kannst du sie in den Einstellungen deines Browsers
          {{ push.ios.value ? '(iPhone: Einstellungen → Mitteilungen → Vereinsheim)' : '(Schloss-Symbol neben der Adresse)' }}.
        </p>
        <p v-else-if="push.zustand.value === 'nicht-eingerichtet'" class="konto__info">Auf dem Server noch nicht eingerichtet – sag dem Vorstand Bescheid.</p>
        <p v-else-if="push.zustand.value === 'nicht-moeglich'" class="konto__info">Dieser Browser kann leider keine Benachrichtigungen.</p>
      </div>

      <div class="vh-karte konto__karte">
        <h2>Tour durchs Vereinsheim</h2>
        <p class="konto__info konto__tour-text">Noch mal zeigen lassen, wo was ist? Die Tour dauert etwa zwei Minuten.</p>
        <BasisKnopf variante="outline" @click="tour.starten()">Tour starten</BasisKnopf>
      </div>

      <div class="vh-karte konto__karte">
        <h2>Name</h2>
        <form @submit.prevent="nameSpeichern">
          <BasisFeld v-model="name.first_name" label="Vorname" name="first_name" autocomplete="given-name" required />
          <BasisFeld v-model="name.last_name" label="Nachname" name="last_name" autocomplete="family-name" />
          <p class="konto__info">
            Benutzername: <strong>{{ ich?.benutzername ?? '–' }}</strong><br>
            E-Mail: <strong>{{ echteMail(ich?.email) ?? 'keine (Anmeldung mit Benutzername)' }}</strong><br>
            <small>Benutzername oder E-Mail ändern? Sag dem Vorstand Bescheid.</small>
          </p>
          <BasisKnopf type="submit" variante="outline">Speichern</BasisKnopf>
        </form>
      </div>

      <div class="vh-karte konto__karte">
        <h2>Passwort</h2>
        <form @submit.prevent="passwortAendern">
          <BasisFeld v-model="pw.alt" label="Bisheriges Passwort" name="alt" type="password" autocomplete="current-password" required />
          <BasisFeld v-model="pw.neu" label="Neues Passwort" name="neu" type="password" autocomplete="new-password" required hinweis="mindestens 10 Zeichen – ein Satz geht auch gut" />
          <BasisFeld v-model="pw.nochmal" label="Neues Passwort nochmal" name="nochmal" type="password" autocomplete="new-password" required />
          <BasisKnopf type="submit" :disabled="sendet">{{ sendet ? 'Wird geändert …' : 'Passwort ändern' }}</BasisKnopf>
        </form>
      </div>

      <div class="vh-karte konto__karte">
        <h2>Abmelden</h2>
        <p class="konto__info konto__tour-text">Am fremden Rechner oder geteilten Handy? Dann hier abmelden. Sonst bleibst du 7 Tage angemeldet.</p>
        <BasisKnopf variante="outline" :disabled="meldetAb" @click="abmelden">{{ meldetAb ? 'Meldet ab …' : 'Abmelden' }}</BasisKnopf>
      </div>
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
}

.konto__tour-text {
  margin: 0 0 var(--abstand-m);
}

.konto__bild {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-m);
}

.konto__avatar {
  display: grid;
  place-items: center;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
  object-fit: cover;
}

.konto__avatar--leer {
  background: var(--farbe-pfirsich);
  color: var(--farbe-lila);
}

.konto__avatar--leer :deep(svg) {
  width: 4rem;
  height: 4rem;
}

.konto__bild-knoepfe {
  display: flex;
  flex: 1 1 12rem;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--abstand-xs);
}

.konto__bild-knoepfe small {
  color: var(--vh-gedaempft);
}

.konto__hochladen {
  padding: 0.45rem 0.9rem;
  border: 1.5px solid var(--farbe-lila);
  border-radius: var(--radius-m);
  background: var(--farbe-weiss);
  color: var(--farbe-lila);
  cursor: pointer;
}

input:focus-visible + .konto__hochladen,
.konto__hochladen:focus-within {
  outline: 3px solid var(--farbe-fokus);
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

.konto__knoepfe {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--abstand-s);
}

.konto__info {
  margin: 0;
  font-size: var(--groesse-xs);
}
</style>
