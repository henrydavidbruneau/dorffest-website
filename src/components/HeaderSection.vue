<template>
  <section class="header-section section-spacing" id="start">
    <div class="header-section__column header-section__text">
      <div class="header-section__textblock">
        <h1>Ein echtes Dorffest</h1>
        <p>– von uns, für uns!</p>
      </div>
    </div>

    <div class="header-section__column header-section__image">
      <div class="image_wrapper" :class="{ 'is-wiggling': isWiggling }">
        <img
          src="@/assets/postit.svg"
          alt="07.09.2025 – Post-it mit Datum"
          class="header-section__postit"
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';

export default defineComponent({
  name: 'HeaderSection',
  setup() {
    const isWiggling = ref(true);
    setTimeout(() => {
      isWiggling.value = false;
    }, 2000);

    onMounted(() => {
      setInterval(() => {
        isWiggling.value = true;
        setTimeout(() => {
          isWiggling.value = false;
        }, 2000); // Dauer der Animation (muss mit SCSS übereinstimmen)
      }, Math.random() * 5000 + 5000); // Alle 10–20 Sekunden
    });
    return { isWiggling };
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
      font-size: 2em; // 2 × Basisgröße
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
      display: flex;
      justify-content: center;
      &.is-wiggling {
        animation: wiggle 2s ease-in-out;
      }
    }

    img {
      width: 100%;
      height: auto;
      max-width: 100%;
      object-fit: contain;
      filter: drop-shadow(5px 10px 8px rgba(0, 0, 0, 0.2));
      @media (min-width: $bp-md) {
        transform: rotate(4.4deg) scale(1.1) translateY(50px);
      }
    }
  }
}
</style>
