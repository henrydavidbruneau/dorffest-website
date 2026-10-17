// v-einblenden: setzt einmalig die Klasse "ist-sichtbar", sobald das Element ins Bild scrollt.
// Die eigentlichen Animationen stehen im CSS der Sektionen (Startzustand nur mit html.js).
export default defineNuxtPlugin((nuxtApp) => {
  let beobachter: IntersectionObserver | undefined

  nuxtApp.vueApp.directive<HTMLElement>('einblenden', {
    getSSRProps: () => ({}),
    mounted(el) {
      if (!('IntersectionObserver' in window)) {
        el.classList.add('ist-sichtbar')
        return
      }
      beobachter ??= new IntersectionObserver((eintraege) => {
        for (const e of eintraege) {
          if (e.isIntersecting) {
            e.target.classList.add('ist-sichtbar')
            beobachter?.unobserve(e.target)
          }
        }
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 })
      beobachter.observe(el)
    },
    unmounted(el) {
      beobachter?.unobserve(el)
    },
  })
})
