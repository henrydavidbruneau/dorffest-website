<template>
  <footer class="footer">
    <div class="footer__left">
      <img src="@/assets/logo.svg" alt="Logo" class="footer__logo" />
    </div>
    <div class="footer__right">
      <a href="/impressum" class="footer__link">Impressum</a>
      <a href="/datenschutz" class="footer__link">Datenschutz</a>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FooterSection'
});
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  @media (min-width: $bp-md) {
    justify-content: space-between;
  }
  align-items: center;
  padding: $space-md 4rem;
  background-color: $color-dark;
  color: $color-light;
  flex-wrap: wrap;
  gap: $space-sm;
  background-color: $color-primary;
  overflow: hidden;

  &__logo {
    height: 80px;
    transform: scale(1.2) translateY(10px);
    @media (max-width: $bp-md) {
      display: none;
    }
  }

  &__link {
    font-family: 'Londrina Solid', sans-serif;
    color: $color-light;
    text-decoration: none;
    margin-left: $space-md;
    font-weight: 400;
    font-size: 1.3rem;

    &:hover {
      text-decoration: underline;
    }
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
  }

  &__right {
    gap: $space-md;
    flex-wrap: wrap;
  }
}
</style>
