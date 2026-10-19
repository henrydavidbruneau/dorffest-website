<script setup lang="ts">
// Neuer Rundbrief (nur Vorstand): an alle, die den Newsletter bestätigt haben (Brevo-Liste).
// Links schreiben, rechts sieht man die Mail so, wie sie ankommt.
definePageMeta({ layout: 'vereinsheim', middleware: 'vereinsheim' })
useSeoMeta({ title: 'Rundbrief · Vereinsheim', robots: 'noindex, nofollow' })

interface Verschickt { id: number, betreff: string, am: string | null, zugestellt: number | null, geoeffnet: number | null }
interface Stand { eingerichtet: boolean, abonnenten: number, verschickt: Verschickt[] }

const { zeige, fehler } = useVereinsheimMeldung()
const { data, refresh } = useAsyncData('vh-rundbrief', () => $fetch<Stand>('/api/vereinsheim/rundbrief'), { server: false })

const VORLAGE = 'Hallo liebe Nachbar*innen,\n\n# Neues aus dem ==Dorf!==\n\n'
const brief = reactive({ betreff: '', text: VORLAGE })
const sendet = ref<'' | 'test' | 'alle'>('')

// Vorschau = dasselbe HTML wie beim Versand (Logo von dieser Seite, Abmelde-Link nur angedeutet)
const vorschau = computed(() => mailHtml(`${brief.text.trim() || '…'}\n\n${GRUSS}`, {
  basis: import.meta.client ? window.location.origin : '',
  rubrik: 'Rundbrief',
  abmelden: '#',
}))

const fertig = computed(() => !!brief.betreff.trim() && brief.text.trim().length >= 10)

async function schicken(test: boolean) {
  if (!test && !window.confirm(`Rundbrief „${brief.betreff}“ jetzt an ${data.value?.abonnenten ?? 0} Abonnent*innen schicken?`)) return
  sendet.value = test ? 'test' : 'alle'
  try {
    const r = await $fetch<{ an?: string }>('/api/vereinsheim/rundbrief', { method: 'POST', body: { ...brief, test } })
    if (test) {
      zeige(`Test ist unterwegs an ${r.an}.`)
    }
    else {
      zeige('Ab in die Post! Brevo verschickt den Rundbrief jetzt.')
      brief.betreff = ''
      brief.text = VORLAGE
      await refresh()
    }
  }
  catch (e) {
    fehler(e)
  }
  sendet.value = ''
}
</script>

<template>
  <div class="rb">
    <VereinsheimKopf titel="Neuer" hervorhebung="Rundbrief" :zusatz="data?.eingerichtet ? `an ${data.abonnenten} Abonnent*innen des Newsletters` : 'an alle, die den Newsletter bestätigt haben'" :zurueck="{ to: '/vereinsheim/post', text: 'Zur Post' }" />

    <div v-if="data && !data.eingerichtet" class="vh-karte rb__fehlt">
      Brevo ist noch nicht eingerichtet: Auf Netlify fehlen <code>NUXT_BREVO_API_KEY</code> oder <code>NUXT_BREVO_NEWSLETTER_LISTE</code>.
      Einen Test an dich kannst du trotzdem schicken.
    </div>

    <div class="rb__raster">
      <form class="vh-karte rb__form" @submit.prevent="schicken(false)">
        <BasisFeld v-model="brief.betreff" label="Betreff" name="betreff" required :maxlength="200" />
        <VereinsheimMarkdownFeld
          v-model="brief.text"
          label="Text"
          art="mail"
          bild-ordner="rundbrief"
          pflicht
          hinweis="erste Zeile „Hallo …“ wird handschriftlich · # Überschrift · ==Hervorhebung== · Gruß und Abmelde-Link kommen automatisch dazu."
        />
        <div class="rb__aktionen">
          <BasisKnopf variante="outline" groesse="klein" :disabled="!fertig || !!sendet" @click="schicken(true)">{{ sendet === 'test' ? 'Schickt …' : 'Test an mich' }}</BasisKnopf>
          <BasisKnopf type="submit" :disabled="!fertig || !!sendet || !data?.eingerichtet">
            {{ sendet === 'alle' ? 'Wird verschickt …' : `An ${data?.abonnenten ?? 0} schicken` }}
          </BasisKnopf>
        </div>
      </form>

      <section class="rb__vorschau" aria-label="Vorschau">
        <p class="rb__vorschau-kopf"><span>Betreff:</span> {{ brief.betreff || '…' }}</p>
        <iframe :srcdoc="vorschau" title="Vorschau des Rundbriefs" class="rb__mail" sandbox="" />
      </section>
    </div>

    <section v-if="data?.verschickt.length" class="vh-karte rb__verschickt" aria-labelledby="verschickt-titel">
      <h2 id="verschickt-titel">Schon verschickt</h2>
      <ul>
        <li v-for="v in data.verschickt" :key="v.id">
          <strong>{{ v.betreff }}</strong>
          <span>{{ v.am ? datumLang(v.am) : '' }}{{ v.zugestellt !== null ? ` · ${v.zugestellt} zugestellt` : '' }}{{ v.geoeffnet !== null ? ` · ${v.geoeffnet} geöffnet` : '' }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.rb__fehlt {
  margin-bottom: var(--abstand-m);
  font-size: var(--groesse-s);
}

.rb__raster {
  display: grid;
  gap: var(--abstand-l);
  align-items: start;
}

@media (min-width: 64rem) {
  .rb__raster {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .rb__vorschau {
    position: sticky;
    top: var(--abstand-m);
  }
}

.rb__form {
  display: flex;
  flex-direction: column;
  gap: var(--abstand-s);
}

.rb__aktionen {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--abstand-xs);
}

.rb__vorschau-kopf {
  margin: 0 0 var(--abstand-2xs);
  font-size: var(--groesse-xs);
}

.rb__vorschau-kopf span {
  color: var(--vh-gedaempft);
}

.rb__mail {
  display: block;
  width: 100%;
  height: min(75vh, 46rem);
  border: 1px solid var(--vh-rand);
  border-radius: var(--vh-radius);
  background: var(--farbe-lila);
}

.rb__verschickt {
  margin-top: var(--abstand-xl);
}

.rb__verschickt h2 {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-h4);
  color: var(--farbe-lila);
}

.rb__verschickt ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rb__verschickt li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem var(--abstand-s);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--vh-rand);
  font-size: var(--groesse-s);
}

.rb__verschickt li span {
  color: var(--vh-gedaempft);
}
</style>
