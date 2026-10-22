// POST /api/eingang/brevo?schluessel=… – Brevo Inbound Parsing: eine neue Mail im Kontakt-Postfach.
// IONOS leitet von jeder eingehenden Mail eine Kopie an NUXT_EINGANG_ADRESSE weiter (Subdomain mit MX bei
// Brevo), Brevo schickt sie hierher. Wir lesen nur Absender und Betreff und schicken dem Vorstand einen Push –
// die Mail selbst bleibt im Postfach und wird im Vereinsheim wie immer per IMAP gelesen.
// Einrichtung: scripts/brevo-eingang.mjs, DIRECTUS.md → „Push-Benachrichtigungen“.
interface Postfach { Address?: string, Name?: string | null }
// Recipients kommt in der Praxis als Liste von Adressen (Text), laut Doku-Tabelle als Postfach-Objekte – beides annehmen
interface EingangMail { MessageId?: string, From?: Postfach, Recipients?: (string | Postfach)[], Subject?: string, SpamScore?: number, Spam?: { Score?: number } }

// rspamd: ab etwa 6 Punkten markiert IONOS selbst als Spam
const SPAM_AB = 6

export default defineEventHandler(async (event) => {
  const { eingangSchluessel, eingangAdresse } = useRuntimeConfig()
  const schluessel = String(getQuery(event).schluessel ?? '')
  if (!eingangSchluessel || !gleich(schluessel, eingangSchluessel)) throw fail(401, 'schluessel', 'Nicht erlaubt')

  const body = await leseBody(event)
  const items = (Array.isArray(body.items) ? body.items : []) as EingangMail[]
  const adresse = eingangAdresse.trim().toLowerCase()
  // nur Kopien an die (geheime) Weiterleitungs-Adresse, keine Mails, die jemand direkt an die Subdomain schickt
  const neue = items.filter(m => (m.Recipients ?? []).some(r => (typeof r === 'string' ? r : r?.Address)?.trim().toLowerCase() === adresse)
    && (m.SpamScore ?? m.Spam?.Score ?? 0) < SPAM_AB)
  if (!neue.length) return { gesendet: 0 }

  const abos = await directusServer<PushAbo[]>('/items/push_abos', {
    query: { fields: 'id,endpoint,p256dh,auth', filter: { post: { _eq: true }, user_created: { _nnull: true } }, limit: -1 },
  })
  if (!abos.length) return { gesendet: 0 }

  let gesendet = 0
  for (const m of neue) {
    const von = text(m.From?.Name, 60) || text(m.From?.Address, 80) || 'Unbekannt'
    const messageId = text(m.MessageId, 300)
    gesendet += await sendePush(abos, {
      titel: `Neue Mail von ${von}`,
      text: text(m.Subject, 120) || '(ohne Betreff)',
      url: messageId ? `/vereinsheim/post?mail=${encodeURIComponent(messageId)}` : '/vereinsheim/post',
      kennung: messageId || undefined,
    })
  }
  return { gesendet }
})
