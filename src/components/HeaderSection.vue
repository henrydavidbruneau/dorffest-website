<template>
  <section class="header-section section-spacing" id="start">
    <div class="header-section__column header-section__text">
      <div class="header-section__textblock">
        <h1>Ein echtes Dorffest</h1>
        <p>– von uns, für uns!</p>
      </div>
    </div>

    <div class="header-section__column header-section__image">
      <div class="image_wrapper" :class="{ 'is-wiggling': isWiggling }" @click="toggleCalendar">
        <div class="postit-combined">
          <img
            ref="postitImage"
            src="@/assets/postit.svg"
            alt="07.09.2025 – Post-it mit Datum"
            class="header-section__postit"
          />

          <!-- Standard-Datum -->
          <transition name="fade">
            <div
              v-if="!showCalendarOptions"
              class="date-overlay"
              :style="{
                transform: `translate(-50%, -50%) scale(${scaleFactor})`
                //opacity: scaleFactor > 0.1 ? 1 : 0
              }"
            >
              <h4>07.09.2025</h4>
              <p>Wo: JuMa</p>
            </div>
          </transition>

          <!-- Kalenderoptionen -->
          <transition name="fade">
            <div
              v-if="showCalendarOptions"
              class="date-overlay calendar-overlay"
              :style="{ transform: `translate(-50%, -50%) scale(${scaleFactor})` }"
            >
              <h2 class="calendar-heading">Trag dir den Termin in deinen Kalender ein</h2>
              <ul class="calendar-list">
                <li>
                  <a
                    href="https://www.google.com/calendar/render?action=TEMPLATE&text=Königsdorf+rückt+zusammen&dates=20250907T140000Z/20250907T220000Z&details=Dorffest+im+JuMa&location=JuMa+Frechen-Königsdorf"
                    target="_blank"
                  >
                    <button class="calendar-button">Google Kalender</button>
                  </a>
                </li>
                <li>
                  <a href="/downloads/dorffest.ics" download>
                    <button class="calendar-button">Apple / Outlook (.ics)</button>
                  </a>
                </li>
                <li>
                  <a href="https://calndr.link/event/your-event-id" target="_blank">
                    <button class="calendar-button">Andere Kalender</button>
                  </a>
                </li>
              </ul>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';

export default defineComponent({
  name: 'HeaderSection',
  setup() {
    const isWiggling = ref(false);
    const postitImage = ref<HTMLImageElement | null>(null);
    const scaleFactor = ref(1);
    let interval: number;

    const showCalendarOptions = ref(false);
    const toggleCalendar = () => {
      showCalendarOptions.value = !showCalendarOptions.value;
    };

    const updateScale = () => {
      if (postitImage.value) {
        const currentWidth = postitImage.value.clientWidth;
        const baseWidth = 500; // Ausgangsgröße des Designs
        scaleFactor.value = Math.max(currentWidth / baseWidth, 0.1);
      }
    };

    onMounted(() => {
      if (postitImage.value?.complete) {
        updateScale();
      } else {
        postitImage.value?.addEventListener('load', updateScale);
      }
      window.addEventListener('resize', updateScale);

      // Wiggle alle 10–15 Sekunden
      interval = window.setInterval(() => {
        isWiggling.value = true;
        setTimeout(() => {
          isWiggling.value = false;
        }, 2000);
      }, Math.random() * 2000 + 10000);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateScale);
      postitImage.value?.removeEventListener('load', updateScale);
      clearInterval(interval);
    });

    return {
      isWiggling,
      postitImage,
      scaleFactor,
      toggleCalendar,
      showCalendarOptions
    };
  }
});
</script>

<style lang="scss" scoped>
@keyframes wiggle {
  0% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-2deg);
  }
  40% {
    transform: rotate(2deg);
  }
  60% {
    transform: rotate(-1deg);
  }
  80% {
    transform: rotate(1deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.header-section {
  display: flex;
  background-image: linear-gradient(to top, $color-primary, #f88e54);
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $space-lg;
  padding-top: 110px;
  max-height: 50vh;
  min-height: 350px;

  @media (min-width: $bp-md) {
    flex-direction: row;
  }

  &__column {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }

  &__textblock {
    max-width: 800px;
    font-size: clamp(1rem, 2.5vw, 2rem);
    color: white;

    h1 {
      font-size: 2em;
      font-weight: 500;
      margin-bottom: 5px;
    }

    p {
      font-size: 1.2em;
      font-weight: 400;
      margin: 0;
    }

    @media (min-width: $bp-md) {
      text-align: left;
    }
  }

  &__image {
    .image_wrapper {
      width: 100%;
      max-width: 500px;
      position: relative;

      &.is-wiggling {
        animation: wiggle 2s ease-in-out;
      }
    }

    .postit-combined {
      cursor: pointer;
      position: relative;
      @media (min-width: $bp-md) {
        transform: rotate(4.4deg) scale(1.1) translateY(50px);
      }
    }

    .header-section__postit {
      width: 100%;
      display: block;
      filter: drop-shadow(5px 10px 8px rgba(0, 0, 0, 0.2));
    }

    .date-overlay {
      position: absolute;
      top: 55%;
      left: 50%;
      transform-origin: center;
      text-align: center;
      color: black;
      z-index: 2;
      font-family: 'Reenie Beanie';

      h4 {
        margin: 0;
        font-size: 6.5rem; // Basisgröße bei 500px Bildbreite
        line-height: 0.5;
        font-weight: 500;
      }
      p {
        margin: 0;
        font-size: 4rem; // Basisgröße bei 500px Bildbreite
        font-weight: 300;
      }
    }
    .calendar-overlay {
      pointer-events: auto;
      width: 100%;
      max-width: 70%;
    }

    .calendar-heading {
      font-size: 1em;
      margin-bottom: 1em;
      font-family: 'Poppins';
    }

    .calendar-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6em;
    }

    .calendar-button {
      @include button-base;
      transition: background-color 0.2s ease;
      border: none;
      background-color: white;

      &:hover {
        background-color: #005f47;
      }
    }
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.4s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
