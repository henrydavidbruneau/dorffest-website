<template>
  <section class="spenden-section section-spacing" id="spenden">
    <div class="flexwrapper">
      <div class="flexwrapper__column flexwrapper__text">
        <div class="flexwrapper__textblock">
          <h1>Fördere das Fest!</h1>
          <p>
            Auch wenn wir das Fest mit viel Eigeninitiative stemmen, gibt es ein paar Kosten, die
            wir nicht umgehen können: Technik, Infrastruktur und Grundausstattung. Wenn ihr das
            Dorffest gerne unterstützen möchtet, freuen wir uns über jeden Beitrag.
          </p>
          <p>Jeder Betrag hilft. Vielen Dank für eure Unterstützung und euer Vertrauen!</p>
        </div>
      </div>

      <div class="flexwrapper__column flexwrapper__form">
        <div class="spenden-wrapper">
          <div class="spenden-box">
            <h2>Dein Beitrag für das Fest</h2>
            <a
              class="spenden-button"
              href="https://www.paypal.com/donate/?hosted_button_id=S8KM7LWR77NYY"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
                data-slot="icon"
                class="mr-2 h-6 w-6 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                ></path>
              </svg>
              Jetzt unterstützen
            </a>
            <p class="spenden-hinweis">
              Wichtig: Auch wenn PayPal von "Spenden" schreibt, handelt es sich hierbei um
              freiwillige Schenkungen an unsere Kampagne, nicht um Spenden.
            </p>
            <p id="alternativ">Alternativ du auch per Überweisung:</p>
            <p class="iban">
              <strong>IBAN:</strong> DE97110101015738722835<br />
              <strong>Kontoinhaber:</strong> Bruno Balscheit <br />
              <strong>Verwendungszweck:</strong> Dorffest
            </p>
            <p class="hinweis">
              Die Schenkungen werden aktuell privat auf einem dafür eingerichteten Konto gesammelt
              und ausschließlich für das Dorffest verwendet. Aktuell können keine Spendenquittungen
              ausgestellt werden.
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
      const paypalLink = `https://paypal.me/dorffest0709?country.x=DE&locale.x=de_DE/${amount}`;
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
  padding: 3.5rem 0 3.5rem 0;
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

    .spenden-hinweis {
      font-size: 0.7rem;
      width: 80%;
      margin: 0.8rem auto 0 auto;
    }

    svg {
      height: 1.5rem;
      width: 1.5rem;
    }

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
      padding: 0.75rem 0;
      border-radius: 0.75rem;
      font-size: 1.1rem;
      border: none;
      cursor: pointer;
      justify-content: center;
      display: inline-flex;
      flex-shrink: 0;
      flex-wrap: wrap;
      gap: 0.5rem;
      width: 100%;
      align-items: center;
      text-align: center;
      text-decoration: none;

      &:hover {
        background-color: #d96d35;
      }
    }

    .iban {
      background-color: #f9f9f9;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.95rem;
      margin: 0 0 1rem 0;
      word-break: break-word;
    }

    .hinweis {
      font-size: 0.7rem;
      color: #555;
      margin-top: 1rem;
    }
    #alternativ {
      margin: 30px 0 15px 0;
    }
  }
}
</style>
