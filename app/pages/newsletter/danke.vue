<script setup lang="ts">
// Ziel des Bestätigungslinks aus der Newsletter-Mail (/api/newsletter/bestaetigen):
// „Geklappt!“ und was man sonst noch tun kann. ?link=ungueltig, wenn der Link nicht passte.
import { links } from '~/navigation'

const route = useRoute()
const ungueltig = computed(() => route.query.link === 'ungueltig')

useSeoMeta({ title: () => (ungueltig.value ? 'Link ungültig' : 'Du bist dabei'), robots: 'noindex' })

const WEGE = [
  { titel: 'Komm zum Plenum', text: 'Einmal im Monat entscheiden wir gemeinsam, was als Nächstes passiert. Jede*r kann dazukommen.', to: '/mitmachen#plenum', linktext: 'Zum Plenum', farbe: 'pfirsich', drehung: 0 },
  { titel: 'Schau, was kommt', text: 'Feste, Treffen, Kleidertausch – alle Termine auf einen Blick.', to: '/#was-kommt', linktext: 'Zu den Terminen', farbe: 'gelb', drehung: 0 },
  { titel: 'Infochannel', text: 'Kurze Infos aufs Handy, wenn es mal schnell gehen muss.', to: links.infochannel, linktext: 'Zum WhatsApp-Kanal', farbe: 'weiss', drehung: 0 },
  { titel: 'Werd Mitglied', text: 'Fördermitgliedschaften helfen uns enorm dabei, unsere Feste und Aktionen möglich zu machen.', to: links.mitgliedWerden, linktext: 'Mitglied werden', farbe: 'pfirsich', drehung: 0 },
] as const
</script>

<template>
  <div class="danke">
    <div class="danke__band">
      <section class="danke__kopf inhalt">
        <BasisNotizzettel farbe="pfirsich" tape="mitte" tape-farbe="flieder" :drehung="-2" class="danke__zettel">
          <p class="danke__gross">{{ ungueltig ? 'Hm…' : 'Geklappt!' }}</p>
          <p class="danke__zusatz handschrift">{{ ungueltig ? 'der Link passt leider nicht' : 'ab jetzt bekommst du unseren Rundbrief!' }}</p>
        </BasisNotizzettel>

        <div>
          <h1 class="danke__titel">
            <template v-if="ungueltig">Der Link hat nicht <BasisHervorhebung>geklappt</BasisHervorhebung></template>
            <template v-else>Du bist <BasisHervorhebung>dabei!</BasisHervorhebung></template>
          </h1>
          <p class="danke__text">
            {{ ungueltig
              ? 'Vielleicht ist er unvollständig angekommen. Trag dich einfach noch mal ein – dann schicken wir dir einen neuen.'
              : 'Danke, dass du deine Adresse bestätigt hast. Abmelden geht jederzeit über den Link in jeder Mail.' }}
          </p>
          <BasisNewsletterBox v-if="ungueltig" class="danke__neu" variante="lila" />
        </div>
      </section>
    </div>

    <section class="danke__wege inhalt" aria-labelledby="wege-titel">
      <h2 id="wege-titel" class="danke__wege-titel">Wie du sonst noch <BasisHervorhebung>mitmachen</BasisHervorhebung> kannst</h2>
      <ul class="danke__liste">
        <li v-for="w in WEGE" :key="w.titel">
          <BasisNotizzettel :farbe="w.farbe" :drehung="w.drehung" tape="mitte" class="weg">
            <h3 class="weg__titel">{{ w.titel }}</h3>
            <p class="weg__text">{{ w.text }}</p>
            <NuxtLink :to="w.to" class="weg__link handlink" :target="w.to.startsWith('http') ? '_blank' : undefined" :rel="w.to.startsWith('http') ? 'noopener' : undefined">→ {{ w.linktext }}</NuxtLink>
          </BasisNotizzettel>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.danke {
  padding-bottom: var(--abstand-sektion);
}

/* oberer Teil auf Lila wie das Kopfband der Terminseiten */
.danke__band {
  --farbe-fokus: var(--farbe-gelb);
  background: var(--farbe-lila);
  color: var(--farbe-creme);
}

.danke__kopf {
  padding-block: clamp(2.5rem, 5vw, 4.5rem) clamp(3rem, 6vw, 5.5rem);
  display: grid;
  gap: var(--abstand-xl);
  align-items: center;
}

.danke__zettel {
  justify-self: center;
  padding: 2rem 2.5rem 1.5rem;
  text-align: center;
}

.danke__zettel p {
  margin: 0;
}

.danke__gross {
  font-family: var(--schrift-display);
  font-weight: var(--gewicht-display);
  font-size: clamp(3.5rem, 8vw, 6rem);
  line-height: 0.9;
  text-transform: uppercase;
  color: var(--farbe-orange);
}

.danke__zusatz {
  margin-top: 0.4rem !important;
  color: var(--farbe-lila);
}

.danke__titel {
  font-size: var(--groesse-h2);
  color: var(--farbe-pfirsich);
}

.danke__text {
  max-width: 34rem;
  margin: var(--abstand-m) 0 0;
  font-size: var(--groesse-l);
  line-height: 1.6;
}

.danke__neu {
  max-width: 32rem;
  margin-top: var(--abstand-l);
}

.danke__wege {
  margin-top: var(--abstand-sektion);
}

.danke__wege-titel {
  font-size: var(--groesse-h3);
  text-align: center;
}

.danke__liste {
  display: grid;
  gap: var(--abstand-l);
  margin: var(--abstand-xl) 0 0;
  padding: 0;
  list-style: none;
}

.weg {
  height: 100%;
  padding: 2rem 1.5rem 1.5rem;
}

.weg__titel {
  margin: 0;
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.weg__text {
  margin: var(--abstand-xs) 0 var(--abstand-s);
  font-size: var(--groesse-s);
  line-height: 1.55;
}

.weg__link {
  color: var(--farbe-lila);
}

@media (min-width: 40rem) {
  .danke__liste {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 56rem) {
  .danke__kopf {
    grid-template-columns: auto 1fr;
  }
}

@media (min-width: 72rem) {
  .danke__liste {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
