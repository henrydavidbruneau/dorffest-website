// Push-Benachrichtigungen auf diesem Gerät (Mein Profil). Das Vereinsheim ist dafür eine installierbare
// Web-App (public/app/manifest.webmanifest + public/sw.js). Auf iPhone/iPad gibt es Push nur, wenn sie über
// „Teilen → Zum Home-Bildschirm“ installiert ist – im normalen Safari-Tab nicht.

export type PushZustand = 'pruefe' | 'nicht-moeglich' | 'nicht-eingerichtet' | 'erst-installieren' | 'blockiert' | 'aus' | 'an'

/** Manifest und App-Icons fürs Handy (Layout `vereinsheim` und die Tür) */
export function useVereinsheimAppKopf() {
  useHead({
    link: [
      { rel: 'manifest', href: '/app/manifest.webmanifest' },
      { rel: 'apple-touch-icon', href: '/app/apple-touch-icon.png' },
    ],
    meta: [
      { name: 'theme-color', content: '#7a2a7e' },
      { name: 'apple-mobile-web-app-title', content: 'Vereinsheim' },
      { name: 'mobile-web-app-capable', content: 'yes' },
    ],
  })
}

function istIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

function istInstalliert() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

/** „iPhone · Safari“ – damit man in Directus sieht, welches Gerät gemeint ist */
function geraetName() {
  const ua = navigator.userAgent
  const geraet = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Gerät'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  return `${geraet} · ${browser}${istInstalliert() ? ' (App)' : ''}`
}

function schluesselBytes(base64: string) {
  const roh = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(roh, z => z.charCodeAt(0))
}

export function useVereinsheimPush() {
  const { public: { vapidPublicKey } } = useRuntimeConfig()
  const zustand = ref<PushZustand>('pruefe')
  const ios = ref(false)
  const arbeitet = ref(false)

  async function registrierung() {
    return navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => navigator.serviceWorker.ready)
  }

  async function melden(abo: PushSubscription) {
    return $fetch<{ post: boolean }>('/api/vereinsheim/push', { method: 'POST', body: { ...abo.toJSON(), geraet: geraetName() } })
  }

  /** Stand auf diesem Gerät; ist Push schon an, beim Server auffrischen (z.B. neu im Vorstand → auch Post) */
  async function pruefen() {
    ios.value = istIos()
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      zustand.value = ios.value && !istInstalliert() ? 'erst-installieren' : 'nicht-moeglich'
      return
    }
    if (!vapidPublicKey) {
      zustand.value = 'nicht-eingerichtet'
      return
    }
    try {
      const abo = await (await registrierung()).pushManager.getSubscription()
      if (abo) {
        zustand.value = 'an'
        melden(abo).catch(() => {})
      }
      else zustand.value = Notification.permission === 'denied' ? 'blockiert' : 'aus'
    }
    catch {
      zustand.value = 'nicht-moeglich'
    }
  }

  /** muss direkt aus einem Klick kommen (sonst fragt Safari nicht) */
  async function einschalten() {
    arbeitet.value = true
    try {
      const erlaubnis = await Notification.requestPermission()
      if (erlaubnis !== 'granted') {
        zustand.value = erlaubnis === 'denied' ? 'blockiert' : 'aus'
        return null
      }
      const reg = await registrierung()
      const abo = await reg.pushManager.getSubscription()
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: schluesselBytes(vapidPublicKey) })
      const r = await melden(abo)
      zustand.value = 'an'
      return r
    }
    finally {
      arbeitet.value = false
    }
  }

  async function ausschalten() {
    arbeitet.value = true
    try {
      const abo = await (await registrierung()).pushManager.getSubscription()
      if (abo) {
        await $fetch('/api/vereinsheim/push', { method: 'DELETE', body: { endpoint: abo.endpoint } })
        await abo.unsubscribe()
      }
      zustand.value = 'aus'
    }
    finally {
      arbeitet.value = false
    }
  }

  async function probe() {
    const abo = await (await registrierung()).pushManager.getSubscription()
    if (!abo) throw new Error('Auf diesem Gerät sind Benachrichtigungen noch nicht an.')
    await $fetch('/api/vereinsheim/push/probe', { method: 'POST', body: { endpoint: abo.endpoint } })
  }

  return { zustand, ios, arbeitet, pruefen, einschalten, ausschalten, probe }
}
