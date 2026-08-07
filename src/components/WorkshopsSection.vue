<template>
  <section class="workshops section-spacing">
    <div class="container">
      <h2 class="section-title">Workshops</h2>
      <p class="intro">
        Vor etwa einem Monat haben wir euch eingeladen, das Fest mit eigenen Programmideen
        mitzugestalten. Viele tolle Rückmeldungen sind eingegangen – und einige davon könnt ihr
        jetzt als <strong>Workshops</strong> erleben. Eine Anmeldung ist nicht zwingend
        erforderlich, hilft uns aber bei der Planung. Da die Plätze begrenzt sind, sichert ihr euch
        so auch direkt einen Platz. Schaut gerne ein paar Tage vor dem Fest noch einmal vorbei – das
        Programm wächst vielleicht noch weiter.
      </p>
      <div class="grid-wrapper">
        <div class="card-grid">
          <div class="workshop-card" v-for="(ws, index) in workshops" :key="ws.title">
            <img :src="ws.image" :alt="ws.title" class="card-image" />
            <div class="card-content">
              <h3>{{ ws.title }}</h3>
              <p>{{ ws.text }}</p>
              <button
                v-if="index < workshops.length - 1"
                class="button"
                @click="openTallyModal(ws.title)"
              >
                Anmelden
              </button>

              <button v-else class="button" @click="openMithelfenModal">Mitmachen</button>
              <small class="note">{{ ws.note }}</small>
            </div>

            <!-- Illustration nur beim dritten Item -->
            <img
              v-if="index === 2"
              src="@/assets/deko/gießer.webp"
              alt="Tanzfigur"
              class="card-illu"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const workshops = [
  {
    title: 'Improtheater',
    image: require('@/assets/img/ws1.webp'),
    text: 'Im Improtheater entstehen Szenen direkt aus dem Moment. Robert lädt euch ein, gemeinsam spielerisch in neue Rollen zu schlüpfen, mit Ideen zu experimentieren und die eigene Spontaneität zu entdecken. Mitmachen kann jede*r – Vorerfahrung ist nicht nötig.',
    note: 'Workshops finden ab 15:30 statt, die genaue Uhrzeit erfahrt ihr später in einer Mail.'
  },
  {
    title: 'Siebdruck',
    image: require('@/assets/img/ws2.webp'),
    text: 'Bei unserer Siebdruckstation könnt ihr mitgebrachte T-Shirts, Pullis oder andere Textilien mit einem extra für das Fest und Dorf angefertigten Design aufhübschen. Die Technik ist leicht zu erlernen, macht Spaß und ist nachhaltig! (Falls ihr nichts Passendes dabei habt, könnt ihr vor Ort Textilien gegen Spende bekommen.)',
    note: 'Workshops finden ab 15:30 statt, die genaue Uhrzeit erfahrt ihr später in einer Mail.'
  },
  {
    title: 'Erlebnispädagogik',
    image: require('@/assets/img/ws3.webp'),
    text: 'In diesem Workshop von Jonas Grünewald lösen Eltern und Kinder Aufgaben im Team und üben dabei den Umgang mit Herausforderungen. Im Mittelpunkt stehen Bewegung, Aufmerksamkeit und das Vertrauen in eigene Entscheidungen.',
    note: 'Workshops finden ab 15:30 statt, die genaue Uhrzeit erfahrt ihr später in einer Mail.'
  },
  {
    title: 'Social Media Videos 1x1',
    image: require('@/assets/img/ws4.webp'),
    text: 'Thomas und Markus zeigen euch, wie man gute Videos für Social Media erstellt – von der Aufnahme bis zum Schnitt. 3-Punkt-Beleuchtung, 3 Sekunden Regel, Capcut, Premiere, CTA, Interactions – das alles sagt dir nichts? Kein Problem, der Workshop vermittelt dir die wichtigsten Tipps und Tricks!',
    note: 'Workshops finden ab 15:30 statt, die genaue Uhrzeit erfahrt ihr später in einer Mail.'
  },
  {
    title: 'Yoga Flow',
    image: require('@/assets/img/ws6.webp'),
    text: 'In 30 Minuten Yoga schnuppern – für Anfänger und Geübte. Nach einem kurzen Warm-up folgen kräftigende, dehnende Asanas und fließende Flows. Zum Abschluss sorgt eine Meditation für Ruhe und Klarheit. Willkommen sind alle, unabhängig von Alter oder Vorkenntnissen.',
    note: ''
  },
  {
    title: 'Dein Workshop?',
    image: require('@/assets/img/ws5.webp'),
    text: 'Du hast eine Idee für einen Workshop, den du gerne anbieten würdest? Dann melde dich bei uns! Wir freuen uns über jede Initiative und helfen dir gerne bei der Umsetzung. Egal ob es um Handwerk, Kunst, Musik oder etwas ganz anderes geht – bring deine Ideen ein!',
    note: ''
  }
];

import { onMounted } from 'vue';

interface TallyWindow extends Window {
  Tally?: {
    openPopup: (
      formId: string,
      options: {
        layout: 'modal' | 'drawer';
        emojiText?: string;
        emojiAnimation?: string;
        hiddenFields?: Record<string, string>;
      }
    ) => void;
  };
}

const openTallyModal = (workshopTitle: string) => {
  const w = window as TallyWindow;

  if (w.Tally) {
    w.Tally.openPopup('mVOZeg', {
      layout: 'modal',
      emojiText: '👋',
      emojiAnimation: 'wave',
      hiddenFields: {
        workshop: workshopTitle
      }
    });
  }
};

const openMithelfenModal = () => {
  const w = window as TallyWindow;
  if (w.Tally) {
    w.Tally.openPopup('w5rg56', {
      layout: 'modal',
      emojiText: '✍️',
      emojiAnimation: 'wave'
    });
  }
};

onMounted(() => {
  const scriptSrc = 'https://tally.so/widgets/embed.js';
  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.body.appendChild(script);
  }
});
</script>

<style scoped lang="scss">
.card-illu {
  display: none;
}
.workshops {
  text-align: center;

  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    &::after {
      content: '';
      display: block;
      width: 60px;
      height: 4px;
      background-color: $color-primary;
      margin: 0.3rem auto 2rem;
      border-radius: 2px;
    }
  }

  .intro {
    max-width: 700px;
    margin: 0 auto 2rem;
    font-weight: 400;
    text-align: center;
    font-size: 1rem;
    line-height: 1.6;
  }
  .grid-wrapper {
    display: flex;
    justify-content: center; // zentriert den inneren Block
  }
  .card-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: flex-start;
  }

  .workshop-card {
    background: white;
    //border-radius: 12px;
    max-width: 370px;
    width: 100%;
    text-align: left;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    position: relative;

    .card-illu {
      position: absolute;
      top: -120px;
      right: 10px;
      width: 160px;
      height: auto;
      z-index: -5;
      pointer-events: none;
    }

    .card-image {
      width: 100%;
      display: block;
      height: auto;
      max-height: 250px;
    }

    .card-content {
      padding: 0.65rem 2rem 1.5rem 2rem;

      h3 {
        font-size: 1.6rem;
        margin-bottom: 0.75rem;
        font-weight: 500;
        text-align: center;
        font-family: $font-family-secondary;
      }

      p {
        font-size: 0.8rem;
        line-height: 1.5;
        margin-bottom: 1.5rem;
      }

      .button {
        display: inline-block;
        box-sizing: border-box;
        height: 45px;
        background: $color-primary;
        width: 100%;
        color: white;
        padding: 0.5rem 1.25rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        &:hover {
          background: white;
          color: $color-primary;
          border: 2px solid $color-primary;
        }
      }

      .note {
        display: block;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.6rem;
        color: #666;
      }
    }
  }

  @media (min-width: 768px) {
    .workshop-card:hover {
      transform: scale(1.05);
      transition: 300ms ease-in-out;
      z-index: 300;
    }
    .card-content {
      padding: 0.65rem 3rem 1.5rem 3rem;
    }
    .intro {
      margin: 0 auto 5rem;
    }
    .card-grid {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      align-items: stretch;
      gap: 3rem;
    }
  }

  @media (min-width: 1024px) {
    .card-illu {
      display: block;
    }
    .card-grid {
      max-width: 1500px;
      margin: 0 auto;
    }
  }
}
</style>
