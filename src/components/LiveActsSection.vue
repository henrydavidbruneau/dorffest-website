<template>
  <section class="live-acts section-spacing">
    <div class="container">
      <h2 class="section-title">Live</h2>

      <div class="collage-wrapper">
        <div
          class="live-act"
          v-for="act in acts"
          :key="act.name"
          @click="toggleOverlay(act.name)"
          :class="{ active: activeAct === act.name }"
        >
          <img :src="act.image" :alt="act.name" class="collage-img" />
          <div class="act-overlay" @click.stop>
            <a
              v-if="act.spotify"
              :href="act.spotify"
              target="_blank"
              rel="noopener"
              class="icon spotify"
              aria-label="Spotify"
            >
              <img src="@/assets/icons/spotify.png" alt="Spotify" />
            </a>
            <a
              v-if="act.instagram"
              :href="act.instagram"
              target="_blank"
              rel="noopener"
              class="icon instagram"
              aria-label="Instagram"
            >
              <img src="@/assets/icons/instagram.png" alt="Instagram" />
            </a>
          </div>
        </div>

        <!-- Optional: Illustrationen -->
        <img src="@/assets/deko/dance.webp" class="illu tanz" alt="" />
        <img src="@/assets/deko/note.webp" class="illu note" alt="" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeAct = ref<string | null>(null);

function toggleOverlay(name: string) {
  activeAct.value = activeAct.value === name ? null : name;
}

const acts = [
  {
    name: 'Falcke',
    image: require('@/assets/live/falcke.webp'),
    spotify:
      'https://open.spotify.com/intl-de/artist/2mnJSF6QbV1jn2QB4QARuf?si=4GyrEG4YQ3SwBftjJ_6mKg',
    instagram: 'https://instagram.com/falckefalcke'
  },
  {
    name: 'Icecream at the alligator park',
    image: require('@/assets/live/icatap.webp'),
    spotify:
      'https://open.spotify.com/intl-de/artist/5f77g3eZ2V5tdnoUfxJSYv?si=hRZoNWKsQU-ZlTuVfwe27w',
    instagram: 'https://instagram.com/icecreamatthealligatorpark'
  },
  {
    name: 'Bruneau X Mondmann',
    image: require('@/assets/live/bruneauXmondmann.webp'),
    spotify: 'https://open.spotify.com/intl-de/track/2ZeT7WDR9ncPvwfIpV82RD?si=c70a3d9f33c64750',
    instagram: 'https://instagram.com/okbruneau'
  },
  {
    name: '5vor12',
    image: require('@/assets/live/5vor12.webp'),
    spotify:
      'https://open.spotify.com/intl-de/artist/2RcbX48b4gpjDAGNgNQDSt?si=3eCxIcFqRxOWoViIfE0B1A',
    instagram: 'https://instagram.com/5vor12band'
  },
  {
    name: 'THE ŞAHİNS',
    image: require('@/assets/live/thesahins.webp'),
    instagram: 'https://instagram.com/diejane2.0'
  },
  {
    name: 'weißpfennige',
    image: require('@/assets/live/weisspfennige.webp'),
    instagram: 'https://instagram.com/@tanzcorps_weisspfennige'
  }
];
</script>

<style scoped lang="scss">
.live-acts {
  text-align: center;

  .section-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 3rem;
    position: relative;

    &::after {
      content: '';
      display: block;
      width: 60px;
      height: 4px;
      background-color: $color-primary;
      margin: 0.5rem auto 0;
      border-radius: 2px;
    }
  }

  .collage-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    position: relative;

    .live-act {
      position: relative;
      width: 90%;
      max-width: 400px;
      cursor: pointer;

      &:hover {
        transform: scale(1.05);
        transition: transform 0.3s ease;
      }

      .collage-img {
        width: 100%;
        display: block;
        height: auto;
        border-radius: 8px;
      }

      .act-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.307);
        opacity: 0;
        display: none;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        transition: opacity 0.3s ease;
        pointer-events: none;

        .icon {
          width: 70px;
          height: 70px;
          background: #ffffff;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;

          img {
            width: 50px;
            height: 50px;
          }
        }
      }

      &.active .act-overlay,
      &:hover .act-overlay {
        display: flex;
        opacity: 1;
        pointer-events: auto;
      }
    }

    .illu {
      display: none;
    }
  }

  @media (min-width: 768px) {
    max-width: 1400px;
    margin: auto;

    .collage-wrapper {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2.5rem;
      padding: 0 2rem;

      .illu {
        display: block;
        position: absolute;
        pointer-events: none;

        &.tanz {
          top: 0%;
          right: 0%;
          width: 130px;
          z-index: -1;
        }

        &.note {
          bottom: 8%;
          left: 12%;
          width: 40px;
        }
      }
    }
  }
}
</style>
