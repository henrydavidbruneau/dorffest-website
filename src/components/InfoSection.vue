<template>
  <section class="info-section section-spacing">
    <h2>
      Liebe Nachbarn und Freunde,<br />
      liebes Königsdorf,
    </h2>

    <p class="fliesstext">
      Der Winter ist vorbei, die Sonne kommt raus und mit ihr die Menschen. Ein passender Moment zum
      Durchatmen. Denn viele von uns spüren: Die Welt ist aus dem Gleichgewicht geraten. Kriege,
      Krisen, Unsicherheiten – das alles hinterlässt Spuren. Auch in unserem Alltag. Auch bei uns
      vor Ort. Gerade deshalb ist es jetzt wichtig, dass wir zusammenkommen. Dass wir einander
      sehen, zuhören, Halt geben – als Familien, als Freundeskreise und
      <strong>vor allem als Dorfgemeinschaft.</strong>
    </p>

    <p class="fliesstext">
      Am <strong>Sonntag, den 07.09.</strong> haben wir dazu die Möglichkeit: Gemeinsam wollen wir
      in Königsdorf ein Dorf- & Nachbarschaftsfest feiern – offen für alle,
      generationenübergreifend, gemeinsam gestaltet. Ein Fest, das nicht nur unterhält, sondern
      verbindet.
    </p>

    <h3>Königsdorf rückt zusammen.</h3>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InfoSection'
});
</script>

<style lang="scss" scoped>
.info-section {
  max-width: 700px;
  margin: 0 auto;
  font-size: $font-base;
  color: $color-dark;
  line-height: 1.7;

  @media (min-width: $bp-md) {
    margin-top: 40px;
  }

  p {
    margin-bottom: $space-md;
  }

  h2 {
    font-size: 1.9rem;
    margin-bottom: $space-lg;
    @media (min-width: $bp-md) {
      font-size: 2.6rem;
      margin-bottom: $space-sm;
    }
  }

  h3 {
    font-size: 1.8rem;
  }
}
</style>
