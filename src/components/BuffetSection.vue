<template>
  <section class="buffet-section section-spacing">
    <div class="container">
      <div class="intro">
        <h2>
          Wir feiern, wir tanzen und<br />
          wir <mark>essen</mark> zusammen
        </h2>
        <p>
          Was wäre ein Dorffest ohne gutes Essen? Und für das gute Essen sorgen wir alle gemeinsam:
          Schnibbelt mit beim <strong>Dorfsüppchen</strong> oder bringt euer Lieblingsgericht mit
          zum <strong>großen Dorfbuffet</strong> – egal ob Familienklassiker, Geheimrezepte von Oma
          oder neue Lieblingsgerichte. So entsteht ein Fest, das nach Zuhause schmeckt.
        </p>
      </div>

      <div class="form-content">
        <img src="@/assets/img/buffet.webp" alt="Buffet" class="buffet-image" />
        <div class="form-wrapper">
          <h3>Dein Beitrag zum Dorfbuffet:</h3>
          <iframe
            data-tally-src="https://tally.so/embed/mKKM98?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            frameborder="0"
            marginheight="0"
            marginwidth="0"
            title="Dein Beitrag für das Dorfbuffet"
            style="width: 100%; height: 100%; min-height: 411px; border: none; overflow: visible"
          ></iframe>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, onMounted } from 'vue';

export default defineComponent({
  name: 'BuffetSection',
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

<style scoped lang="scss">
.buffet-section {
  background: $color-bg-light;

  .intro {
    text-align: center;
    margin-bottom: 3rem;

    h2 {
      font-size: 2rem;
      font-family: $font-family-secondary;
      font-weight: 700;
      line-height: 1.4;

      mark {
        background: $color-primary;
        color: white;
        padding: 0 0.25em;
        border-radius: 0.15em;
      }
    }

    p {
      max-width: 700px;
      margin: 1rem auto 0;
      font-size: 1rem;
      line-height: 1.6;

      a {
        font-weight: 600;
        text-decoration: underline;
        color: black;
      }
    }
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;

    .buffet-image {
      width: 100%;
      max-width: 450px;
      height: auto;
      border-radius: 12px;
    }

    .form-wrapper {
      width: 100%;
      max-width: 450px;

      h3 {
        text-align: left;
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }

      iframe {
        border: none;
        width: 100%;
        height: 500px;
        border-radius: 6px;
        overflow: hidden;
      }
    }
  }

  @media (min-width: 768px) {
    .intro h2 {
      font-size: 4rem;
    }
    .form-content {
      flex-direction: row;
      justify-content: center;
      align-items: flex-start;
      gap: 3rem;
      max-width: 1200px;
      margin: 10px auto 10px auto;

      .buffet-image,
      .form-wrapper {
        flex: 1 1 50%;
      }
    }
    h3 {
      text-align: left;
    }
  }
}
</style>
