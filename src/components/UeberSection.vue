<template>
  <section class="ueberuns-section section-spacing" id="ueber-uns">
    <div class="ueberuns-section__text">
      <h1>Über uns</h1>
      <p class="fliesstext">
        Wir sind eine bunt gemischte Gruppe Menschen in Königsdorf. Wie viele andere, sind wir sehr
        bewegt vom aktuellen Weltgeschehen und glauben, dass es gerade jetzt umso wichtiger ist,
        zusammenzuhalten und Momente der Gemeinschaft zu erleben. Wenn der Blick in die Zukunft mit
        Ungewissheit und Sorgen getrübt ist, dann lohnt es sich, sich im Hier und Jetzt für ein
        <strong>lebenswertes & solidarisches Zusammenleben</strong> einzusetzen und anderen zu
        zeigen, dass sie diese Zeiten nicht alleine durchstehen müssen.
      </p>
      <p class="fliesstext">
        Jeder & jede kann mitmachen, aber um das an dieser Stelle ganz deutlich zu sagen, dieses
        <strong>Fest ist auf jeden Fall:</strong>
      </p>
    </div>

    <div class="ueberuns-section__image">
      <img src="@/assets/keinort.svg" alt="Kein Ort für Rassismus" />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UeberSection'
});
</script>

<style lang="scss" scoped>
.ueberuns-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-lg;

  &__text {
    max-width: 700px;
    text-align: left;

    h2 {
      font-size: $font-xl;
      margin-bottom: $space-sm;
    }

    p {
      margin-bottom: $space-md;
      line-height: 1.6;
    }
  }

  &__image {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 40px;

    img {
      max-width: 500px;
      width: 100%;
      height: auto;
      display: block;
    }
  }
}
</style>
