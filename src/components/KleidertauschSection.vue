<template>
  <section class="kleidertausch-section section-spacing">
    <div class="container">
      <h2 class="section-title">Kleidertausch</h2>
      <img src="@/assets/kleidertausch.jpg" alt="Kleidertausch Poster" class="poster" />
    </div>
  </section>
</template>

<script setup>
// keine Logik notwendig
</script>

<style scoped lang="scss">
.kleidertausch-section {
  background-color: #ffdfe5; // weichrosa aus Vorlage

  .section-title {
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

  .poster {
    display: block;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  }
}
</style>
