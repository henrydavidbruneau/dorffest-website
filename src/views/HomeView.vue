<template>
  <div>
    <Navbar />
    <HeaderSection />
    <InfoSection />
    <MithelfenSection />
    <UeberSection />
    <SpendenSection />
    <FooterSection />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navbar from '@/components/Navbar.vue';
import HeaderSection from '@/components/HeaderSection.vue';
import InfoSection from '@/components/InfoSection.vue';
import MithelfenSection from '@/components/MithelfenSection.vue';
import UeberSection from '@/components/UeberSection.vue';
import SpendenSection from '@/components/SpendenSection.vue';
import FooterSection from '@/components/FooterSection.vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    Navbar,
    HeaderSection,
    InfoSection,
    MithelfenSection,
    UeberSection,
    SpendenSection,
    FooterSection
  }
});
</script>
