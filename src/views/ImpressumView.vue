<template>
  <section class="impressum-section">
    <div class="impressum-box">
      <h1>Impressum</h1>

      <p>Verantwortlich für den Inhalt dieser Website gemäß § 5 TMG:</p>

      <p>
        Bruno Balscheit<br />
        Baumschulenstraße 28<br />
        50226 Frechen
      </p>

      <router-link to="/" class="back-button"> Zurück zur Startseite </router-link>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ImpressumView'
});
</script>

<style scoped>
.impressum-section {
  background-color: #f7f7f7;
  min-height: 100vh;
  padding: 4rem 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.impressum-box {
  background-color: white;
  padding: 2rem;
  border-radius: 1.5rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
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
