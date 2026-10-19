// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/image'],

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Königsdorf rückt zusammen e.V.: Nachbar*innen, die Feste, Treffpunkte und Hilfe im Dorf organisieren.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      ],
    },
  },

  // Nur serverseitig lesbar. Werte kommen aus .env (NUXT_DIRECTUS_URL usw.)
  runtimeConfig: {
    directusUrl: '',
    directusToken: '',
    brevoApiKey: '',
    // Brevo-Liste für den Newsletter (Zahl aus Brevo → Kontakte → Listen)
    brevoNewsletterListe: '',
    // Absender bei Brevo (Domain muss dort verifiziert sein)
    mailVon: 'kontakt@koenigsdorf-rueckt-zusammen.de',
    mailVonName: 'Königsdorf rückt zusammen',
    turnstileSecretKey: '',
    // Schlüssel für signierte Bestätigungs-/Abmeldelinks (Plenum-Erinnerung)
    linkSecret: '',
    public: {
      siteUrl: 'https://königsdorf-rückt-zusammen.de',
      turnstileSiteKey: '',
    },
  },

  nitro: {
    preset: 'netlify',
  },

  // Es gibt keine eigene Terminübersicht – alle Termine stehen auf der Startseite unter "Was kommt"
  routeRules: {
    '/termine': { redirect: '/#was-kommt' },
    // Vereinsheim: nur im Browser (Session über httpOnly-Cookies), nie in Suchmaschinen
    '/vereinsheim/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/vereinsheim': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },

  // Schriften aus Figma, von @nuxt/fonts heruntergeladen und lokal ausgeliefert
  fonts: {
    families: [
      { name: 'Londrina Solid', provider: 'google', weights: [400, 900], global: true },
      { name: 'Poppins', provider: 'google', weights: [300, 400, 500, 700], styles: ['normal'], global: true },
      { name: 'Reenie Beanie', provider: 'google', weights: [400], global: true },
    ],
  },

  image: {
    format: ['webp'],
    // Bilder aus Directus: <NuxtImg :src="datei-id" provider="directus"> → /bilder/:id?width=…
    // (Server-Route mit dem Server-Token, siehe server/routes/bilder/[id].get.ts)
    directus: {
      baseURL: '/bilder/',
    },
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
