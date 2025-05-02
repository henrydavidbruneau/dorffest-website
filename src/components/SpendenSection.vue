<template>
  <section class="spenden-section section-spacing" id="spenden">
    <div class="flexwrapper">
      <div class="flexwrapper__column flexwrapper__text">
        <div class="flexwrapper__textblock">
          <h1>Fördere das Fest!</h1>
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
          <div class="spenden-box">
            <h2>Dein Beitrag für das Fest</h2>
            <div class="betrag-buttons">
              <button :class="{ active: selectedAmount === 10 }" @click="setAmount(10)">10€</button>

              <button :class="{ active: selectedAmount === 30 }" @click="setAmount(30)">30€</button>

              <button :class="{ active: selectedAmount === 100 }" @click="setAmount(100)">
                100€
              </button>
            </div>

            <input
              type="number"
              placeholder="Anderer Betrag"
              v-model.number="customAmount"
              class="betrag-input"
            />

            <button class="spenden-button" @click="spenden">Spenden</button>

            <p class="hinweis">
              Die Spenden werden aktuell privat gesammelt und ausschließlich für das Dorffest
              verwendet.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'SpendenSection',
  setup() {
    const customAmount = ref<number | null>(null);
    const selectedAmount = ref<number | null>(null);

    const setAmount = (amount: number) => {
      selectedAmount.value = amount;
      customAmount.value = amount;
    };

    const spenden = () => {
      const amount = customAmount.value || 10;
      const paypalLink = `https://paypal.me/deinname/${amount}`;
      window.open(paypalLink, '_blank');
    };

    return {
      customAmount,
      setAmount,
      spenden,
      selectedAmount
    };
  }
});
</script>

<style lang="scss" scoped>
.spenden-section {
  background-color: lighten($color-primary, 27%);
}
.flexwrapper {
  max-width: 1300px;
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
    max-width: 450px;
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
  .spenden-box {
    background-color: white;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    max-width: 400px;

    display: flex;
    flex-direction: column;

    h2 {
      font-size: 1.7rem;
      font-weight: 400;
      margin-bottom: 1.5rem;
      font-family: 'Londrina Solid', sans-serif;
    }

    .betrag-buttons {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 1rem;

      button {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid #999;
        border-radius: 0.75rem;
        background-color: white;
        font-weight: bold;
        cursor: pointer;

        &:hover {
          background-color: #eee;
        }
        &.active {
          background-color: #eb7e44;
          color: white;
          border-color: #eb7e44;
        }
      }
    }

    .betrag-input {
      padding: 0.75rem;
      border: 2px solid #999;
      border-radius: 0.75rem;
      text-align: center;
      font-weight: bold;
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    .spenden-button {
      width: 100%;
      background-color: #eb7e44;
      color: white;
      font-weight: bold;
      padding: 0.75rem;
      border-radius: 0.75rem;
      font-size: 1.1rem;
      border: none;
      cursor: pointer;

      &:hover {
        background-color: #d96d35;
      }
    }

    .hinweis {
      font-size: 0.85rem;
      margin-top: 1.5rem;
      color: #333;
    }
  }
}
</style>
