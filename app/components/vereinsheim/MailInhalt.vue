<script setup lang="ts">
// Inhalt einer geöffneten Mail: HTML-Mails in einem abgeschotteten iframe (keine Skripte, eigenes CSS,
// Links öffnen in einem neuen Tab), reine Textmails mit klickbaren Links. Darunter die Anhänge,
// Bilder als Vorschau. Bilder von fremden Servern erst nach Klick (Zählpixel verraten sonst, wer wann liest).
const props = defineProps<{ mail: PostMail, ordner: PostOrdner, webmail?: string }>()

const bilderFrei = ref(false)
watch(() => `${props.ordner}:${props.mail.uid}`, () => (bilderFrei.value = false))

const anhangUrl = (nr: number, laden = false) => `/api/vereinsheim/post/${props.mail.uid}/anhang/${nr}?ordner=${props.ordner}${laden ? '&laden=1' : ''}`
const istBild = (typ: string) => /^image\/(png|jpe?g|gif|webp|avif|bmp)$/i.test(typ)
const anhaenge = computed(() => props.mail.anhaenge.filter(a => !(props.mail.html && a.imText)))
const bilder = computed(() => anhaenge.value.filter(a => istBild(a.typ) && !a.zuGross))
const kb = (b: number) => (b > 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1000))} kB`)

// ---------- HTML ----------
const rahmen = ref<HTMLIFrameElement | null>(null)
const hoehe = ref(200)

const srcdoc = computed(() => {
  if (!props.mail.html) return ''
  const eigene = import.meta.client ? window.location.origin : ''
  const bilderQuelle = bilderFrei.value ? `${eigene} https: http: data:` : `${eigene} data:`
  return `<!doctype html><html><head><meta charset="utf-8">`
    + `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${bilderQuelle}; style-src 'unsafe-inline'; font-src ${bilderFrei.value ? 'https: data:' : 'data:'}">`
    + `<base target="_blank">`
    + `<style>html,body{margin:0;padding:0;background:#fff}body{font:15px/1.5 system-ui,sans-serif;color:#2b2233;overflow-wrap:anywhere}`
    + `img{max-width:100%;height:auto}table{max-width:100%}a{color:#7a2a7e}pre{white-space:pre-wrap}blockquote{margin:0 0 0 .6em;padding-left:.8em;border-left:3px solid #e4dccf;color:#5b5162}</style>`
    + `</head><body>${props.mail.html}</body></html>`
})

let beobachter: ResizeObserver | null = null
function angekommen() {
  beobachter?.disconnect()
  const doc = rahmen.value?.contentDocument
  if (!doc?.documentElement) return
  const messen = () => (hoehe.value = Math.max(80, doc.documentElement.scrollHeight))
  messen()
  beobachter = new ResizeObserver(messen)
  beobachter.observe(doc.body ?? doc.documentElement)
  // nachladende Bilder ändern die Höhe
  doc.querySelectorAll('img').forEach(img => img.addEventListener('load', messen))
}
onBeforeUnmount(() => beobachter?.disconnect())

// ---------- Text mit Links ----------
type Stueck = { text: string, href?: string }
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"]+|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/gi

const stuecke = computed<Stueck[]>(() => {
  const text = props.mail.text || '(kein Text)'
  const ergebnis: Stueck[] = []
  let ab = 0
  for (const treffer of text.matchAll(LINK)) {
    let link = treffer[0]
    // Satzzeichen am Ende gehören nicht zum Link (außer schließende Klammer mit öffnender im Link)
    while (/[.,;:!?'»“”)\]]$/.test(link) && !(link.endsWith(')') && link.includes('('))) link = link.slice(0, -1)
    const start = treffer.index!
    if (start > ab) ergebnis.push({ text: text.slice(ab, start) })
    const href = link.includes('@') && !/^(https?:\/\/|www\.)/i.test(link)
      ? `mailto:${link}`
      : /^www\./i.test(link) ? `https://${link}` : link
    ergebnis.push({ text: link, href })
    ab = start + link.length
  }
  if (ab < text.length) ergebnis.push({ text: text.slice(ab) })
  return ergebnis
})
</script>

<template>
  <div class="inhalt">
    <template v-if="mail.html">
      <p v-if="mail.externeBilder && !bilderFrei" class="inhalt__bilder">
        Bilder von fremden Servern sind ausgeblendet.
        <button type="button" @click="bilderFrei = true">Bilder anzeigen</button>
      </p>
      <iframe
        ref="rahmen"
        :key="`${ordner}:${mail.uid}:${bilderFrei}`"
        class="inhalt__html"
        :srcdoc="srcdoc"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerpolicy="no-referrer"
        :style="{ height: `${hoehe}px` }"
        title="Inhalt der Mail"
        @load="angekommen"
      />
    </template>
    <div v-else class="inhalt__text">
      <template v-for="(s, i) in stuecke" :key="i">
        <a v-if="s.href" :href="s.href" target="_blank" rel="noopener noreferrer">{{ s.text }}</a>
        <template v-else>{{ s.text }}</template>
      </template>
    </div>

    <div v-if="anhaenge.length" class="inhalt__anhaenge">
      <h3>📎 {{ anhaenge.length === 1 ? 'Anhang' : `${anhaenge.length} Anhänge` }}</h3>
      <div v-if="bilder.length" class="inhalt__vorschau">
        <a v-for="a in bilder" :key="a.nr" :href="anhangUrl(a.nr)" target="_blank" rel="noopener" :title="a.name">
          <img :src="anhangUrl(a.nr)" :alt="a.name" loading="lazy">
        </a>
      </div>
      <ul>
        <li v-for="a in anhaenge" :key="a.nr">
          <template v-if="a.zuGross">
            {{ a.name }} <span>({{ kb(a.groesse) }}, zu groß –
              <a v-if="webmail" :href="webmail" target="_blank" rel="noopener">im Webmail öffnen</a><template v-else>im Webmail öffnen</template>)</span>
          </template>
          <template v-else>
            <a :href="anhangUrl(a.nr)" target="_blank" rel="noopener">{{ a.name }}</a>
            <span> ({{ kb(a.groesse) }})</span>
            · <a :href="anhangUrl(a.nr, true)" :download="a.name">herunterladen</a>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.inhalt {
  margin-top: var(--abstand-m);
  padding-top: var(--abstand-m);
  border-top: 1px solid var(--vh-rand);
}

.inhalt__text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.inhalt a {
  color: var(--farbe-lila);
}

.inhalt__html {
  display: block;
  width: 100%;
  border: 0;
  background: #fff;
}

.inhalt__bilder {
  margin: 0 0 var(--abstand-s);
  padding: 0.45rem 0.7rem;
  border-radius: 0.5rem;
  background: var(--farbe-pfirsich);
  font-size: var(--groesse-xs);
}

.inhalt__bilder button {
  margin-left: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--farbe-lila);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.inhalt__anhaenge {
  margin-top: var(--abstand-m);
  padding-top: var(--abstand-s);
  border-top: 1px dashed var(--vh-rand);
  font-size: var(--groesse-xs);
}

.inhalt__anhaenge h3 {
  margin: 0 0 var(--abstand-xs);
  font-size: var(--groesse-s);
}

.inhalt__anhaenge ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.inhalt__anhaenge li + li {
  margin-top: 0.25rem;
}

.inhalt__vorschau {
  display: flex;
  flex-wrap: wrap;
  gap: var(--abstand-s);
  margin-bottom: var(--abstand-s);
}

.inhalt__vorschau img {
  display: block;
  max-width: 220px;
  max-height: 180px;
  border: 1px solid var(--vh-rand);
  border-radius: 0.4rem;
  object-fit: cover;
}
</style>
