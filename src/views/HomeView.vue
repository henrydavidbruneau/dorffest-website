<template>
  <div>
    <Loader v-if="loaderVisible" :active="loaderActive" />
    <Navbar />
    <HeaderSection />
    <InfoSection />
    <MithelfenSection />
    <UeberSection />
    <FooterSection />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import Loader from '@/components/Loader.vue';
import Navbar from '@/components/Navbar.vue';
import HeaderSection from '@/components/HeaderSection.vue';
import InfoSection from '@/components/InfoSection.vue';
import MithelfenSection from '@/components/MithelfenSection.vue';
import UeberSection from '@/components/UeberSection.vue';
import FooterSection from '@/components/FooterSection.vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    Loader,
    Navbar,
    HeaderSection,
    InfoSection,
    MithelfenSection,
    UeberSection,
    FooterSection
  },
  setup() {
    const loaderVisible = ref(true); // steuert v-if
    const loaderActive = ref(true); // steuert CSS-Klasse fade-out

    onMounted(() => {
      setTimeout(() => {
        loaderActive.value = false; // → .fade-out wird gesetzt
        setTimeout(() => {
          loaderVisible.value = false; // → Loader wird entfernt
        }, 300); // muss zur CSS-Transition passen
      }, 1000);
    });

    return {
      loaderVisible,
      loaderActive
    };
  }
});
</script>
