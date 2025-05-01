<template>
  <section class="spenden-section section-spacing" id="spenden">
    <div class="flexwrapper">
      <div class="flexwrapper__column flexwrapper__text">
        <div class="flexwrapper__textblock">
          <h1>Unterstützt das Fest!</h1>
          <p>
            Auch wenn wir das Fest mit viel Eigeninitiative stemmen, gibt es ein paar Kosten, die
            wir nicht umgehen können: Technik, Infrastruktur und Grundausstattung. Wenn ihr das
            Dorffest gerne unterstützen möchtet, freuen wir uns über jede Spende.
          </p>
          <p>Jeder Betrag hilft. Vielen Dank für eure Unterstützung und euer Vertrauen!</p>
        </div>
      </div>

      <div class="flexwrapper__column flexwrapper__form">
        <div class="spenden-wrapper">
          <!-- Hier das externe Spendenformular einbetten -->
          <iframe
            src="https://spendenplattform.example.com/form"
            loading="lazy"
            width="100%"
            height="300"
            frameborder="0"
            title="Spendenformular"
          ></iframe>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SpendenSection'
});
</script>

<style lang="scss" scoped>
.spenden-section {
  background-color: lighten($color-primary, 27%);
}
.flexwrapper {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;

  flex-direction: column;
  align-items: center;
  gap: $space-lg;

  @media (min-width: $bp-md) {
    flex-direction: row;
    justify-content: center;
  }

  &__column {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__textblock {
    max-width: 800px;
    text-align: left;
    font-size: clamp(1rem, 2.5vw, 1.5rem);

    h1 {
      font-size: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 500;
    }

    p {
      font-size: $font-s;
      font-weight: 400;
      margin-bottom: $space-md;
      line-height: 1.4;
    }
  }

  &__form {
    .spenden-wrapper {
      width: 100%;
      max-width: 500px;
    }
  }
}
</style>
