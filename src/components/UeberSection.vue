<template>
  <section class="ueberuns-section section-spacing" id="ueber-uns">
    <div class="ueberuns-section__text">
      <h1>Über uns</h1>
      <p class="fliesstext">
        Wir sind eine bunt gemischte, unabhängige Gruppe Menschen in Königsdorf und offen für alle,
        die mitwirken möchten! Wie viele andere, sind wir sehr bewegt vom aktuellen Weltgeschehen
        und glauben, dass es gerade jetzt umso wichtiger ist zusammenzuhalten und Momente der
        Gemeinschaft zu erleben. Wenn der Blick in die Zukunft mit Ungewissheit und Sorgen getrübt
        ist, dann lohnt es sich, sich im Hier und Jetzt für ein
        <strong>lebenswertes & solidarisches Zusammenleben</strong> einzusetzen und anderen zu
        zeigen, dass sie diese Zeiten nicht alleine durchstehen müssen.
      </p>
    </div>
    <h2>Ein paar Gesichter</h2>
    <div class="ueberuns-section__slider">
      <div class="slider-wrapper">
        <button class="swiper-nav prev">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="#6b4e41"
            viewBox="0 0 16 16"
          >
            <path d="M11 1L3 8l8 7" stroke="#ffffff" stroke-width="3" fill="none" />
          </svg>
        </button>
        <Swiper
          :modules="modules"
          :slides-per-view="3"
          :space-between="30"
          :auto-height="true"
          :breakpoints="{
            0: { slidesPerView: 1, slidesPerGroup: 1 },
            768: { slidesPerView: 2, slidesPerGroup: 1 },
            1024: { slidesPerView: 3, slidesPerGroup: 1 }
          }"
          :navigation="navigationOptions"
          class="custom-swiper"
        >
          <SwiperSlide v-for="(person, index) in team" :key="index" class="person-card">
            <div class="person-card__content">
              <img :src="person.image" :alt="'Foto von ' + person.name" />
              <h3>{{ person.name }}</h3>
              <div class="highlight-bar"></div>
              <p>{{ person.description }}</p>
            </div>
          </SwiperSlide>
          <!-- Abschluss-Slide -->
          <SwiperSlide class="person-card info-slide">
            <div class="person-card__content">
              <img src="/images/team/default.jpg" alt="Standardfoto" />
              <h3>Und du?</h3>
              <div class="highlight-bar"></div>
              <p>
                Es beteiligen sich noch einige weitere Menschen bei der Planung. Wir organisieren
                uns über eine Whatsapp-Gruppe. Füll unser Mitmachen-Formular aus, wenn du Lust hast,
                mitzumachen. Wir freuen uns über jede Unterstützung!
              </p>
            </div>
          </SwiperSlide>
        </Swiper>
        <button class="swiper-nav next">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="#6b4e41"
            viewBox="0 0 16 16"
          >
            <path d="M5 1l8 7-8 7" stroke="#ffffff" stroke-width="3" fill="none" />
          </svg>
        </button>
      </div>
    </div>
    <div class="ueberuns-section__text">
      <p class="fliesstext">
        Jeder & jede kann mitmachen, aber um das an dieser Stelle ganz deutlich zu sagen, dieses
        <strong>Fest ist auf jeden Fall:</strong>
      </p>
    </div>

    <div class="ueberuns-section__image">
      <img src="@/assets/keinort.svg" alt="Kein Ort für Rassismus" />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export default defineComponent({
  name: 'UeberSection',
  components: {
    Swiper,
    SwiperSlide
  },
  setup() {
    const navigationOptions = {
      prevEl: '.swiper-nav.prev',
      nextEl: '.swiper-nav.next'
    };
    const team = [
      {
        name: 'Vivian',
        description:
          '"Im Jugendzentrum Königsdorf habe ich früh gelernt, wie wichtig Beteiligung und offene Gespräche sind. Diese Erfahrung motiviert mich bis heute – und deshalb ist es für mich selbstverständlich, mich auch beim Dorffest einzubringen."',
        image: '/images/team/vivian.jpg'
      },
      {
        name: 'Bruno',
        description:
          '"2015 habe ich mich das erste Mal hier im Ort ehrenamtlich engagiert. Ich war schwer beeindruckt davon, was für eine saubere Arbeit die Geflüchtetenhilfe hier leistet. Seitdem weiß ich, was Gemeinschaft schaffen kann – und hoffe, dass wir darauf auch künftig stolz sein können."',
        image: '/images/team/bruno.jpg'
      },
      {
        name: 'Ele',
        description:
          '"Königsdorf ist seit 18 Jahren unser Zuhause – hier sind meine Kinder groß geworden, hier habe ich mit Freunden, bei den Sternensingern und in der Geflüchtetenhilfe echte Gemeinschaft erlebt. Für mich zählt, dass wir einander mit Respekt begegnen und gemeinsam anpacken – auf der ganzen Welt und genau hier, wo wir leben."',
        image: '/images/team/ele.jpg'
      },
      {
        name: 'Kathie',
        description:
          '"Ich bin in Königsdorf aufgewachsen und mit dem Ort tief verwurzelt. Darum möchte ich dazu beitragen, dass die vielen schönen Seiten unseres Königsdorfs noch sichtbarer und erlebbarer werden."',
        image: '/images/team/kathie.jpg'
      },
      {
        name: 'Fredde',
        description:
          '"Ich hab Königsdorf immer als weltoffenen Ort erlebt. Als ehemalige Pfadfinderleiterin der DPSG im Dorf und heute auf Bundesebene für die Inklusion von benachteiligten Gruppen – etwa Menschen mit Behinderungen und queere Menschen – setze ich mich für eine Gesellschaft ein, die trotz ausgrenzender politischer Tendenzen in Migration und Vielfalt menschlich bleibt."',
        image: '/images/team/fredde.jpg'
      },
      {
        name: 'Jochen',
        description:
          '"Vor über 20 Jahren bin ich mit meiner Familie in Königsdorf gelandet. Unsere Kinder sind hier groß geworden und waren immer gut in der Dorfgemeinschaft integriert. Das wünsche ich mir für alle Königsdorfer."',
        image: '/images/team/jochen.jpg'
      },
      {
        name: 'Markus',
        description:
          '"Als Start-Up Gründer findet mein Alltag fast nur digital statt. Deshalb ist es eine erfrischende Abwechslung den Menschen in meinem Heimatdorf einen analogen Ort des Zusammenkommens zu anzubieten."',
        image: '/images/team/markus.jpg'
      },
      {
        name: 'Nicola',
        description:
          '"Ich bin begeisterte Grundschullehrerin und setze mich (nicht nur beruflich) für diese Werte ein: Menschenwürde, das Leben, Innere Sicherheit, Individuelle Freiheit, Rechtliche Gleichheit, Soziale Gerechtigkeit, Volkssouveränität und Demokratie."',
        image: '/images/team/nicola.jpg'
      }
    ];

    const modules = [Navigation];

    return { team, modules, navigationOptions };
  }
});
</script>

<style lang="scss" scoped>
:deep(.swiper-slide) {
  flex-shrink: 0;
  width: auto;
}
.ueberuns-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-lg;
  h2 {
    font-size: $font-xl;
    margin-bottom: $space-sm;
  }

  &__text {
    max-width: 700px;
    text-align: left;

    p {
      margin-bottom: $space-md;
      line-height: 1.6;
    }
  }

  &__image {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 40px;

    img {
      max-width: 500px;
      width: 100%;
      height: auto;
      display: block;
    }
  }
  .ueberuns-section__slider {
    width: 100%;
    max-width: 1200px;
    margin-bottom: 20px;

    .swiper {
      width: 100%;
      @media (min-width: 1023px) {
        width: 80%;
      }
    }

    .slider-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .custom-swiper {
      overflow: hidden;
      max-width: 1000px;
      order: 0;
    }

    .swiper-button-next,
    .swiper-button-prev {
      background-color: #f1d5ca;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: #fff;
      top: 40%;
      transform: translateY(-50%);
    }

    .swiper-button-next::after,
    .swiper-button-prev::after {
      font-size: 18px;
      color: #6b4e41;
    }

    .person-card {
      background: #fff;
      border-radius: 16px;
      text-align: center;
      //box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      &__content {
        width: 88%;
        margin: auto;
      }

      img {
        max-width: 100%;
        object-fit: cover;
        border-radius: 16px;
        margin-bottom: 10px;
      }

      h3 {
        font-weight: 600;
        margin-bottom: 5px;
        font-size: 1.4em;
      }

      .highlight-bar {
        width: 40px;
        height: 4px;
        background-color: #facc15; // Tailwind's yellow-400
        margin: 10px auto 20px;
        border-radius: 9999px;
      }

      p {
        font-size: 14px;
        color: #555;
        max-width: 90%;
        margin: 0 auto;
      }
    }
    .swiper-nav {
      background-color: #f1d5ca;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      font-size: 1.5rem;
      color: #6b4e41;
      cursor: pointer;

      // DESKTOP-Pfeile
      @media (min-width: 1024px) {
        position: relative;
        order: 0;
      }

      // MOBILE: unten zentriert
      @media (max-width: 1023px) {
        order: 1;
        margin-top: 20px;
      }

      &.prev {
        margin-right: 20px;
      }

      &.next {
        margin-left: 20px;
      }
    }
    .info-slide {
      color: #333;

      h3 {
        font-weight: bold;
        font-size: 1.4rem;
      }

      p {
        font-style: normal;
        color: #444;
        margin: 10px 0 30px 0;
      }
    }
  }
}
</style>
