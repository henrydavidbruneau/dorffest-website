<template>
  <section class="programm-header">
    <div class="container">
      <div class="title-wrapper">
        <h1 class="headline-xl">Programm</h1>
        <img
          src="@/assets/deko/Disco.webp"
          alt="Illustration mit Figur"
          class="header-illustration"
        />
      </div>
    </div>
  </section>
</template>

<script setup></script>

<style scoped lang="scss">
.programm-header {
  background-image: linear-gradient(to top, $color-primary, #f88e54);
  position: relative;
  padding: 7rem 1rem 1.5rem 1rem;

  .container {
    text-align: center;
  }

  .title-wrapper {
    display: inline-block;
    position: relative;
  }

  h1 {
    font-size: 3rem;
    font-weight: 500;
    color: white;
    margin: 0;
  }

  .header-illustration {
    position: absolute;
    top: -0.85rem;
    left: calc(75% - 0.5rem);
    width: 80px;
    z-index: 2;
    pointer-events: none;
  }

  @media (min-width: 768px) {
    padding: 8rem 1rem 4rem 1rem;

    h1 {
      font-size: 5rem;
    }

    .header-illustration {
      width: 140px;
      top: -1rem;
      left: calc(100% - 1rem);
    }
  }

  @media (min-width: 1024px) {
    padding: 10rem 1rem 4rem 1rem;

    h1 {
      font-size: 7rem;
    }

    .header-illustration {
      width: 170px;
      top: -1.5rem;
      left: calc(74% - 0.3rem);
    }
  }
}
</style>
