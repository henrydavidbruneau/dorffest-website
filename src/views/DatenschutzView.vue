<template>
  <section class="datenschutz-section">
    <router-link to="/" class="back-button"> Zurück zur Startseite </router-link>
    <div class="datenschutz-box">
      <h1>Datenschutzerklärung</h1>

      <p>
        Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre
        Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TMG).
      </p>

      <h2>Kontakt mit uns</h2>
      <p>
        Wenn Sie per E-Mail Kontakt mit uns aufnehmen, werden Ihre angegebenen Daten zwecks
        Bearbeitung der Anfrage und für den Fall von Anschlussfragen sechs Monate bei uns
        gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
      </p>

      <h2>Spenden</h2>
      <p>
        Wenn Sie uns eine Spende zukommen lassen, werden Ihre Zahlungsdaten von dem jeweiligen
        Zahlungsdienstleister (z.B. PayPal) verarbeitet. Wir selbst speichern keine Kontodaten. Die
        Verarbeitung erfolgt ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung) oder Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
      </p>

      <h2>Ihre Rechte</h2>
      <p>
        Ihnen stehen grundsätzlich die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung,
        Datenübertragbarkeit, Widerruf und Widerspruch zu. Wenn Sie glauben, dass die Verarbeitung
        Ihrer Daten gegen das Datenschutzrecht verstößt oder Ihre datenschutzrechtlichen Ansprüche
        sonst in einer Weise verletzt worden sind, können Sie sich bei der Aufsichtsbehörde
        beschweren.
      </p>

      <h2>Verantwortlich</h2>
      <p>
        Bruno Balscheit<br />
        Baumschulenstraße 28<br />
        50226 Frechen
      </p>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DatenschutzView'
});
</script>

<style scoped>
.datenschutz-section {
  background-color: #f7f7f7;
  min-height: 100vh;
  padding: 4rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 2rem;
}

.datenschutz-box {
  background-color: white;
  padding: 2rem;
  border-radius: 1.5rem;
  max-width: 700px;
  width: 80%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.3rem;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}

p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.back-button {
  display: inline-block;
  margin-top: 2rem;
  background-color: #eb7e44;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 0.75rem;
  font-weight: bold;
  text-decoration: none;
}

.back-button:hover {
  background-color: #d96d35;
}
</style>
