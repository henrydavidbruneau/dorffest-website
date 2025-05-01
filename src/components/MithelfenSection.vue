<template>
  <section class="mithelfen-section section-spacing" id="mithelfen">
    <div class="mithelfen-section__text">
      <div class="mithelfen-section__headline">
        <h1>Helft mit!</h1>
      </div>
      <p>
        Damit das gelingt, brauchen wir euch – die Menschen, die dieses Dorf ausmachen. Ob mit einem
        Spiel für Kinder, einem Kuchenstand eures Vereins, einer Kunstausstellung auf der Wiese,
        einer Bastelaktion oder einfach ein paar helfenden Händen – jede Initiative, jede Idee und
        jeder Beitrag zählt.
      </p>
      <p>
        Und hier ist der Kreativität keine Grenzen gesetzt – geht einen Moment in euch und überlegt,
        ob es irgendetwas gibt, was ihr gut könnt und woran andere Spaß haben könnten.
      </p>
    </div>

    <div class="mithelfen-section__row">
      <div class="mithelfen-section__form">
        <h2>Füll unser Mitmach-Formular aus:</h2>
        <div class="wrapper">
          <iframe
            src="https://tally.so/embed/w5rg56?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="282"
            frameborder="0"
            marginheight="0"
            marginwidth="0"
            title="Füll unser Mitmach-Formular aus:"
          ></iframe>
        </div>
      </div>

      <div class="mithelfen-section__image">
        <img src="@/assets/team.svg" alt="Symbolbild Mithelfen" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, onMounted } from 'vue';

export default defineComponent({
  name: 'MithelfenSection',
  setup() {
    onMounted(() => {
      const d = document;
      const w = 'https://tally.so/widgets/embed.js';
      const v = () => {
        if (typeof (window as any).Tally !== 'undefined') {
          (window as any).Tally.loadEmbeds();
        } else {
          d.querySelectorAll('iframe[data-tally-src]:not([src])').forEach(el => {
            (el as HTMLIFrameElement).src = (el as any).dataset.tallySrc;
          });
        }
      };
      if (typeof (window as any).Tally !== 'undefined') {
        v();
      } else if (!d.querySelector(`script[src="${w}"]`)) {
        const s = d.createElement('script');
        s.src = w;
        s.onload = v;
        s.onerror = v;
        d.body.appendChild(s);
      }
    });
  }
});
</script>

<style lang="scss" scoped>
h1 {
  margin: 15px 0 30px 0;
}

.mithelfen-section {
  display: flex;
  background-color: lighten($color-secondary, 20%);
  flex-direction: column;
  align-items: center;

  &__headline {
    display: flex;
    align-items: center;
    gap: $space-sm;
    flex-direction: column;
  }

  &__text {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;

    p {
      margin-bottom: $space-md;
      line-height: 1.3;
      font-size: 1rem;
      font-weight: 400;
    }
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: $space-lg;
    max-width: 900px;
    width: 100%;
    margin: 40px 0;
  }

  &__form {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    flex: 1;

    .wrapper {
      width: 100%;
      max-width: 600px;
    }
  }

  &__image {
    display: none;

    img {
      max-width: 100%;
      max-width: 300px;
      transform: rotate(3deg) translateY(-10px);
      opacity: 20%;
      height: auto;
      object-fit: contain;
    }
  }
}

@media (min-width: $bp-md) {
  .mithelfen-section {
    gap: $space-lg;
  }

  .mithelfen-section__headline {
    flex-direction: column;
  }

  .mithelfen-section__text p {
    font-size: 1.13rem;
  }

  .mithelfen-section__row {
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .mithelfen-section__image {
    display: flex;
    justify-content: center;
    flex: 1;
  }
}

@media (max-width: $bp-md) {
  h2 {
    text-align: center;
  }
}
</style>
