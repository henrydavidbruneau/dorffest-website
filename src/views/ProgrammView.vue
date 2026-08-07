<template>
  <main>
    <Navbar />
    <ProgrammHeaderSection />
    <LiveActsSection />
    <BuffetSection />
    <WorkshopsSection />
    <KleidertauschSection />
    <KinderSection />
    <FooterSection />
  </main>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue';
import FooterSection from '@/components/FooterSection.vue';

import ProgrammHeaderSection from '@/components/ProgrammHeaderSection.vue';
import LiveActsSection from '@/components/LiveActsSection.vue';
import BuffetSection from '@/components/BuffetSection.vue';
import WorkshopsSection from '@/components/WorkshopsSection.vue';
import KleidertauschSection from '@/components/KleidertauschSection.vue';
import KinderSection from '@/components/KinderSection.vue';
</script>
