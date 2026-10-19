// Tour durchs Vereinsheim: wird auf dem Dashboard vorgeschlagen, bis man sie gemacht oder abgelehnt hat.
// Gemerkt wird das im eigenen Profil (directus_users.tour_erledigt_am); solange das Feld in Directus
// noch fehlt, merkt sich der Browser es. Im Konto lässt sich die Tour jederzeit wiederholen.
// Die Schritte zeigen auf Elemente mit `data-tour="…"`; fehlt eins (z.B. mobil im zugeklappten Menü),
// steht die Erklärung einfach in der Mitte.

export interface TourSchritt {
  /** Seite, auf der der Schritt spielt */
  seite: string
  /** Ziel: data-tour-Wert (leer = Erklärung in der Mitte) */
  ziel?: string
  titel: string
  text: string
  /** nur für den Vorstand */
  vorstand?: boolean
  /** nur für Mitglieder ohne Vorstand */
  ohneVorstand?: boolean
}

const SCHRITTE: TourSchritt[] = [
  { seite: '/vereinsheim', titel: 'Willkommen im Vereinsheim!', text: 'In zwei Minuten zeigen wir dir, wo du was findest. Mit „Weiter“ geht’s los – „Beenden“ geht jederzeit.' },
  { seite: '/vereinsheim', ziel: 'post', titel: 'Was gerade reinkommt', text: 'Hier siehst du neue Post: Mails ans Kontakt-Postfach. Die Liste aktualisiert sich jede Minute von selbst.', vorstand: true },
  { seite: '/vereinsheim', ziel: 'post', titel: 'Deine Einreichungen', text: 'Hier siehst du, was du in der Kasse eingereicht hast und ob es schon ausgezahlt ist.', ohneVorstand: true },
  { seite: '/vereinsheim', ziel: 'kacheln', titel: 'Alle Bereiche auf einen Blick', text: 'Jede Kachel führt in einen Bereich – mit einem Satz, was dort gerade los ist. Hier kommst du von überall schnell wieder hin: mit „Dashboard“ oben in der Navigation.' },
  { seite: '/vereinsheim', ziel: 'nav-termine', titel: 'Termine', text: 'Feste und Treffen anlegen, Anmeldungen ansehen, als CSV laden oder ausdrucken und allen Angemeldeten eine Mail schicken.' },
  { seite: '/vereinsheim/termine', ziel: 'termin-neu', titel: 'Neuen Termin anlegen', text: 'Ein Klick hier – dann Titel, Datum und Ort eintragen. Erst „Veröffentlichen“ macht den Termin auf der Website sichtbar.' },
  { seite: '/vereinsheim', ziel: 'nav-dorfanzeiger', titel: 'Dorfanzeiger', text: 'Artikel schreiben – der neueste steht auf der Website groß oben –, Kleinanzeigen, Leserbriefe und Gastbeiträge von außen prüfen.' },
  { seite: '/vereinsheim/dorfanzeiger/artikel/neu', ziel: 'formular-haupt', titel: 'Schreiben', text: 'Links steht der Text. Die Knöpfe über dem Textfeld machen fett, Überschriften, Links und Zitate – „Vorschau“ zeigt, wie es aussieht.' },
  { seite: '/vereinsheim/dorfanzeiger/artikel/neu', ziel: 'formular-rand', titel: 'Einordnen', text: 'Rechts kommen Ressort, Autor*in, Datum und Bild hin. Selten Gebrauchtes ist eingeklappt.' },
  { seite: '/vereinsheim/dorfanzeiger/artikel/neu', ziel: 'formular-leiste', titel: 'Speichern & veröffentlichen', text: 'Die Leiste bleibt immer unten: speichern (Entwurf), veröffentlichen oder die Vorschau im Zeitungslook ansehen. Keine Sorge – dieser Artikel wird nicht angelegt.' },
  { seite: '/vereinsheim', ziel: 'nav-kasse', titel: 'Kasse', text: 'Etwas für den Verein bezahlt? Hier mit Foto vom Kassenbon einreichen, der Vorstand überweist es dir zurück.' },
  { seite: '/vereinsheim', ziel: 'nav-post', titel: 'Post', text: 'Das Kontakt-Postfach des Vereins: Mails lesen, beantworten und neue schreiben.', vorstand: true },
  { seite: '/vereinsheim', ziel: 'nav-diverses', titel: 'Diverses', text: 'Seltener gebraucht: die Ideensammlung, die Stimmen und Fragen für „Über uns“ – und für den Vorstand die Mitglieder.' },
  { seite: '/vereinsheim', ziel: 'profil', titel: 'Dein Profil', text: 'Name, Profilbild und Passwort änderst du hier. Dort kannst du auch diese Tour wiederholen.' },
  { seite: '/vereinsheim', titel: 'Fertig – schön, dass du da bist!', text: 'Wenn was hakt oder fehlt: sag im Plenum Bescheid. Wer zuletzt geht, macht das Licht aus.' },
]

const MERKER = 'vh-tour-erledigt'
const SPAETER = 'vh-tour-spaeter'

function speicher(art: 'local' | 'session') {
  try {
    return art === 'local' ? window.localStorage : window.sessionStorage
  }
  catch {
    return null
  }
}

export function useVereinsheimTour() {
  const { ich } = useVereinsheimIch()
  const aktiv = useState<boolean>('vh-tour-aktiv', () => false)
  const nr = useState<number>('vh-tour-nr', () => 0)
  const vorschlagWeg = useState<boolean>('vh-tour-vorschlag-weg', () => false)

  const route = useRoute()
  const schritte = computed(() => SCHRITTE.filter(s => (s.vorstand ? !!ich.value?.vorstand : s.ohneVorstand ? !ich.value?.vorstand : true)))
  const schritt = computed(() => schritte.value[nr.value] ?? null)

  /** Soll die Tour vorgeschlagen werden? */
  const vorschlagen = computed(() => {
    if (!import.meta.client || !ich.value || aktiv.value || vorschlagWeg.value) return false
    if (ich.value.tour_erledigt_am) return false
    if (speicher('local')?.getItem(MERKER)) return false
    return !speicher('session')?.getItem(SPAETER)
  })

  async function zuSchritt(i: number) {
    nr.value = Math.max(0, Math.min(i, schritte.value.length - 1))
    const seite = schritte.value[nr.value]?.seite
    if (seite && route.path !== seite) await navigateTo(seite)
  }

  async function starten() {
    vorschlagWeg.value = true
    aktiv.value = true
    await zuSchritt(0)
  }

  /** gemacht oder abgelehnt: nicht mehr vorschlagen */
  async function erledigt() {
    vorschlagWeg.value = true
    speicher('local')?.setItem(MERKER, new Date().toISOString())
    if (ich.value && !ich.value.tour_erledigt_am) {
      const r = await $fetch<{ gespeichert: boolean }>('/api/vereinsheim/tour', { method: 'POST' }).catch(() => ({ gespeichert: false }))
      if (r.gespeichert && ich.value) ich.value = { ...ich.value, tour_erledigt_am: new Date().toISOString() }
    }
  }

  /** nur für diesen Besuch wegklicken */
  function spaeter() {
    vorschlagWeg.value = true
    speicher('session')?.setItem(SPAETER, '1')
  }

  async function beenden() {
    aktiv.value = false
    await erledigt()
    if (route.path !== '/vereinsheim') await navigateTo('/vereinsheim')
  }

  return { aktiv, nr, schritt, schritte, vorschlagen, starten, beenden, erledigt, spaeter, zuSchritt }
}
