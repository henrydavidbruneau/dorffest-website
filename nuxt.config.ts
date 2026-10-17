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
    turnstileSecretKey: '',
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
  },

  // Schriften aus Figma, von @nuxt/fonts heruntergeladen und lokal ausgeliefert
  fonts: {
    families: [
      { name: 'Londrina Solid', provider: 'google', weights: [900], global: true },
      { name: 'Poppins', provider: 'google', weights: [300, 400, 500, 700], styles: ['normal'], global: true },
      { name: 'Reenie Beanie', provider: 'google', weights: [400], global: true },
    ],
  },

  image: {
    format: ['webp'],
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
