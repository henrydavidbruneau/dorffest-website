// Vereinsheim aufs Handy: einmaliges Popup nach der Tour (gemacht, beendet oder abgelehnt) bzw. für alle,
// die sie schon hinter sich haben – danach nur noch unter „Mein Profil“. Gemerkt in
// directus_users.app_hinweis_am (wie die Tour; solange das Feld fehlt, merkt sich der Browser es).
//
// Android/Chrome/Edge bieten über `beforeinstallprompt` einen echten Installieren-Dialog an
// (Plugin `installieren.client.ts` fängt das Ereignis früh ab). Auf dem iPhone geht das nur über
// Safari → Teilen → Zum Home-Bildschirm; dafür zeigen wir eine Anleitung.

export type AppGeraet = 'installiert' | 'knopf' | 'ios-safari' | 'ios-anderer' | 'handy' | 'rechner'

interface InstallierenEreignis extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const angebot = shallowRef<InstallierenEreignis | null>(null)
const installiert = ref(false)

/** vom Plugin aufgerufen, so früh wie möglich */
export function merkeInstallierAngebot() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // kein eigenes Banner vom Browser – wir fragen selbst
    angebot.value = e as InstallierenEreignis
  })
  window.addEventListener('appinstalled', () => {
    angebot.value = null
    installiert.value = true
  })
}

const MERKER = 'vh-app-hinweis'

export function useVereinsheimApp() {
  const { ich } = useVereinsheimIch()
  const geraet = ref<AppGeraet>('rechner')

  function erkennen() {
    const ua = navigator.userAgent
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
    if (installiert.value || window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone) geraet.value = 'installiert'
    else if (angebot.value) geraet.value = 'knopf'
    // Chrome, Firefox & Co. heißen auf dem iPhone CriOS/FxiOS/EdgiOS – nur Safari kann installieren
    else if (ios) geraet.value = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-anderer' : 'ios-safari'
    else geraet.value = /Android|Mobile/.test(ua) ? 'handy' : 'rechner'
  }
  watch([angebot, installiert], erkennen)

  /** Installieren-Dialog des Browsers; true = installiert */
  async function installieren() {
    const e = angebot.value
    if (!e) return false
    await e.prompt()
    const { outcome } = await e.userChoice
    angebot.value = null
    erkennen()
    return outcome === 'accepted'
  }

  /** Popup noch nicht gesehen? */
  const offen = computed(() => {
    if (!import.meta.client || !ich.value || ich.value.app_hinweis_am) return false
    try {
      return !window.localStorage.getItem(MERKER)
    }
    catch {
      return true
    }
  })

  /** Popup weggeklickt oder genutzt: nie wieder zeigen */
  async function gesehen() {
    try {
      window.localStorage.setItem(MERKER, new Date().toISOString())
    }
    catch { /* privater Modus – dann eben nur in Directus */ }
    if (ich.value) ich.value = { ...ich.value, app_hinweis_am: new Date().toISOString() }
    await $fetch('/api/vereinsheim/app-hinweis', { method: 'POST' }).catch(() => {})
  }

  return { geraet, erkennen, installieren, offen, gesehen }
}
