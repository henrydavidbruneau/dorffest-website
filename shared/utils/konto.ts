// Vereinsheim-Konten ohne eigene E-Mail: Directus meldet nur per E-Mail an. Fehlt sie, bekommt
// das Konto beim ersten Login eine Platzhalter-Adresse (kein echtes Postfach) – angemeldet
// wird trotzdem nur mit dem Benutzernamen. An Platzhalter geht nie eine Mail.
export const PLATZHALTER_MAIL_DOMAIN = 'ohne-mail.koenigsdorf-rueckt-zusammen.de'

export const platzhalterMail = (benutzername: string) => `${benutzername}@${PLATZHALTER_MAIL_DOMAIN}`

export const istPlatzhalterMail = (email: string | null | undefined) => !!email?.toLowerCase().endsWith(`@${PLATZHALTER_MAIL_DOMAIN}`)

/** echte E-Mail oder null */
export const echteMail = (email: string | null | undefined) => (email && !istPlatzhalterMail(email) ? email : null)
