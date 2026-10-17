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

  // Schriften werden in Phase 2 nach den Figma-Angaben eingetragen
  fonts: {
    defaults: {
      weights: [400, 700],
    },
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
