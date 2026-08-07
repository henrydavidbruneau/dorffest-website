<template>
  <section class="kinder-section section-spacing">
    <div class="container">
      <h2 class="section-title">Für die <span class="highlight">Pänz</span></h2>
      <p class="description">
        <strong>Ab 13:00</strong> geht es mit einem bunten Programm für Kinder los: Auf dem
        Mini-Jahrmarkt warten Dosenwerfen, Torwand, Glücksrad und weitere Mitmachaktionen. Kinder
        können sich draußen verkleiden, ein Erinnerungsfoto machen oder unsere gemeinsame Fotowand
        gestalten. Kinderschminken, Basteln mit Recyclingmaterial und das Mitwirken an der „größten
        Girlande Königsdorf“ runden das Programm ab. Währenddessen sind die Erwachsenen eingeladen,
        beim Dorfsüppchen mitzuschibbeln – und dabei ganz entspannt ins Gespräch zu kommen.
      </p>

      <div class="image-wrapper">
        <div><img src="@/assets/img/dosenwerfen.webp" alt="Spielaktion" class="kinder-img" /></div>
        <div class="only-tablet-up">
          <img src="@/assets/img/fischen.webp" alt="Kinder am Buffet" class="kinder-img" />
          <img src="@/assets/deko/kind.png" alt="" class="kinder-illu" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// keine Logik notwendig
</script>

<style scoped lang="scss">
.kinder-section {
  .section-title {
    font-size: 2.5rem;
    font-weight: 500;
    font-family: $font-family-secondary;
    text-align: center;
    margin-bottom: 1.5rem;

    .highlight {
      background: #24d05a;
      color: black;
      padding: 0 0.2em;
      border-radius: 0.2em;
    }
  }

  .description {
    max-width: 800px;
    margin: 0 auto 3rem;
    text-align: center;
    font-size: 1rem;
    line-height: 1.6;

    strong {
      font-weight: 700;
    }
  }

  .image-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
    div:last-child {
      transform: translateY(100px);
    }

    .kinder-img {
      width: 100%;
      max-width: 400px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    }

    .kinder-illu {
      position: absolute;
      top: -40px;
      right: 50%;
      transform: translateX(50%);
      width: 60px;
      pointer-events: none;
      z-index: 2;
    }
  }

  @media (min-width: 768px) {
    .section-title {
      font-size: 4rem;
    }
    .image-wrapper {
      flex-direction: row;
      justify-content: center;
      margin-bottom: 160px;
      padding-top: 50px;

      .kinder-illu {
        top: -120px;
        right: 50%;
        width: 90px;
        z-index: -1;
      }
    }
  }
}

.only-tablet-up {
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
}
</style>
