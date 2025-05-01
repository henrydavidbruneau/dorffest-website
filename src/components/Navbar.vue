<template>
  <header :class="['navbar', { scrolled }]">
    <div class="navbar__left">
      <img
        :src="scrolled ? logoMobile : logoDesktop"
        alt="Logo"
        class="navbar__logo navbar__logo--desktop"
      />
      <img src="@/assets/logo_mobile.svg" alt="Logo" class="navbar__logo navbar__logo--mobile" />
      <nav class="navbar__desktop-links">
        <a href="#start">Start</a>
        <a href="#mithelfen">Mithelfen</a>
        <a href="#ueber-uns">Über Uns</a>
        <a href="#spenden">Spenden</a>
      </nav>
    </div>

    <!-- Burger Button (nur mobil sichtbar) -->
    <button class="navbar__burger" @click="toggleMenu" aria-label="Menü öffnen">☰</button>

    <!-- CTA-Button rechts (nur Desktop) -->
    <div class="navbar__right">
      <a href="#mithelfen" class="navbar__cta">MITMACHEN</a>
    </div>

    <!-- Overlay (mobil) -->
    <transition name="fade">
      <div v-if="isMenuOpen" class="navbar__overlay" @click="closeMenu"></div>
    </transition>

    <!-- Mobile Slide-In Menü -->
    <transition name="slide">
      <nav v-if="isMenuOpen" class="navbar__mobile">
        <button class="navbar__close" @click="closeMenu" aria-label="Menü schließen">×</button>
        <a href="#start" @click="closeMenu">Start</a>
        <a href="#mithelfen" @click="closeMenu">Mithelfen</a>
        <a href="#ueber-uns" @click="closeMenu">Über Uns</a>
        <a href="#spenden" @click="closeMenu">Spenden</a>
        <a href="#mithelfen" class="navbar__cta" @click="closeMenu">MITMACHEN</a>
      </nav>
    </transition>
  </header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import logoDesktop from '@/assets/logo.svg';
import logoMobile from '@/assets/logo_mobile.svg';

export default defineComponent({
  name: 'Navbar',
  setup() {
    const scrolled = ref(false);
    const handleScroll = () => {
      scrolled.value = window.scrollY > 50;
    };
    onMounted(() => {
      window.addEventListener('scroll', handleScroll);
    });
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });
    const isMenuOpen = ref(false);
    const toggleMenu = () => (isMenuOpen.value = !isMenuOpen.value);
    const closeMenu = () => (isMenuOpen.value = false);
    return { isMenuOpen, toggleMenu, closeMenu, scrolled, logoMobile, logoDesktop };
  }
});
</script>

<style lang="scss" scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: $space-md $space-xl;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  background-color: transparent;

  &__logo {
    height: 130px;
    transition: all 0.3s ease;
  }

  &__logo--mobile {
    display: block;
    height: 50px;
    transform: scale(1.2);

    @media (min-width: $bp-md) {
      display: none;
    }
  }

  &__logo--desktop {
    display: none;
    filter: drop-shadow(5px 10px 5px rgba(0, 0, 0, 0.3));
    @media (min-width: $bp-md) {
      display: block;
      margin-right: 2rem;
      transform: rotate(-3deg) translateY(20px);
    }
  }

  &.scrolled {
    background-color: $color-primary;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    .navbar__logo {
      height: 48px;
      transform: rotate(0deg) scale(1.3);
      filter: none;
      &--mobile {
        transform: rotate(0deg) scale(1.15);
      }
    }
  }

  &__burger {
    font-size: 2.4rem;
    backdrop-filter: blur(4px);
    padding: $space-xs $space-sm;
    border-radius: $radius-sm;
    cursor: pointer;
    border: none;
    background-color: transparent;
    color: white;
    @media (min-width: $bp-md) {
      display: none;
    }
  }

  &__desktop {
    display: none;

    @media (min-width: $bp-md) {
      display: flex;
      align-items: center;
      gap: $space-lg;
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: $space-lg;

    .navbar__desktop-links {
      display: none;

      @media (min-width: $bp-md) {
        margin-left: 4rem;
        display: flex;
        gap: 3rem;

        a {
          font-family: $font-family-secondary;
          text-decoration: none;
          font-weight: 400;
          font-size: $font-lg;
          color: $color-light;

          &:hover {
            color: $color-dark;
          }
        }
      }
    }
  }

  &__right {
    display: none;

    @media (min-width: $bp-md) {
      display: block;

      .navbar__cta {
        @include button-base;
        background-color: $color-light;
        color: $color-dark;
        @include transition(background-color);

        &:hover {
          background-color: darken($color-dark, 10%);
          color: white;
        }
      }
    }
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background-color: $color-overlay;
    backdrop-filter: blur(4px);
    z-index: 999;
  }

  &__mobile {
    position: fixed;
    top: 0;
    right: 0;
    width: 75%;
    height: 100%;
    background: $color-light;
    padding: $space-lg $space-md;
    display: flex;
    flex-direction: column;
    gap: $space-lg;
    z-index: 1000;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);

    @media (min-width: $bp-md) {
      display: none !important;
    }

    a {
      font-weight: bold;
      font-size: $font-lg;
      text-decoration: none;
      color: $color-dark;

      &:hover {
        color: $color-primary;
      }

      &.navbar__cta {
        @include button-base;
        background-color: $color-dark;
        color: $color-light;
      }
    }
  }

  &__close {
    position: absolute;
    top: $space-md;
    right: $space-md;
    font-size: $font-xl;
    background: none;
    border: none;
    cursor: pointer;
  }
}

/* Animations */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
