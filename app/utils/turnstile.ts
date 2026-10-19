// Cloudflare-Turnstile-Skript einmal laden und alle Widgets der Seite verwalten.
// Ein Token gilt nur einmal: nach jedem Absenden setzt useFormular/usePinnwand die Widgets zurück.

interface TurnstileApi {
  render: (el: HTMLElement, optionen: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let laden: Promise<TurnstileApi> | null = null
const widgets = new Map<string, () => void>()

export function ladeTurnstile(): Promise<TurnstileApi> {
  laden ??= new Promise((fertig, fehler) => {
    if (window.turnstile) return fertig(window.turnstile)
    const skript = document.createElement('script')
    skript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    skript.async = true
    skript.onload = () => (window.turnstile ? fertig(window.turnstile) : fehler(new Error('Turnstile fehlt')))
    skript.onerror = () => fehler(new Error('Turnstile konnte nicht geladen werden'))
    document.head.appendChild(skript)
  })
  return laden
}

export function registriereTurnstile(id: string, leeren: () => void) {
  widgets.set(id, leeren)
}

export function entferneTurnstile(id: string) {
  widgets.delete(id)
  window.turnstile?.remove(id)
}

/** alle Widgets zurücksetzen (neues Token) */
export function turnstileZuruecksetzen() {
  for (const [id, leeren] of widgets) {
    leeren()
    window.turnstile?.reset(id)
  }
}
