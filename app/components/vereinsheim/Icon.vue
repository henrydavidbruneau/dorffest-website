<script setup lang="ts">
// Strichzeichnungen für die Kacheln im Vereinsheim (wie mit dem Filzstift gemalt)
defineProps<{ name: 'termine' | 'dorfanzeiger' | 'ideen' | 'ueber' | 'kasse' | 'mitglieder' | 'neu' | 'post' | 'konto' }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'termine'">
      <rect x="7" y="10" width="34" height="31" rx="4" />
      <path d="M7 19h34M16 6v8M32 6v8" />
      <path d="M15 27h4M22 27h4M29 27h4M15 33h4M22 33h4" />
    </template>
    <template v-else-if="name === 'dorfanzeiger'">
      <path d="M9 9h26v30H12a3 3 0 0 1-3-3z" />
      <path d="M35 17h4v19a3 3 0 0 1-6 0" />
      <path d="M14 15h16M14 21h7M14 27h7M14 33h16" />
      <rect x="24" y="21" width="6" height="7" />
    </template>
    <template v-else-if="name === 'ideen'">
      <path d="M24 6a12 12 0 0 0-7 21.7c1.3 1 2 2.4 2 4V34h10v-2.3c0-1.6.7-3 2-4A12 12 0 0 0 24 6z" />
      <path d="M19 39h10M21 43h6M24 34v-8l-3-3M24 26l3-3" />
    </template>
    <template v-else-if="name === 'ueber'">
      <circle cx="17" cy="16" r="5" />
      <circle cx="32" cy="18" r="4" />
      <path d="M7 38c0-6 4.5-10 10-10s10 4 10 10M27 30c1.4-1.3 3-2 5-2 4.4 0 8 3.4 8 9" />
    </template>
    <template v-else-if="name === 'kasse'">
      <path d="M10 14h28a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z" />
      <path d="M13 14l17-6 3 6M41 23h-8a3 3 0 0 0 0 6h8" />
    </template>
    <template v-else-if="name === 'mitglieder'">
      <rect x="6" y="11" width="36" height="26" rx="3" />
      <circle cx="17" cy="22" r="4" />
      <path d="M11 32c.8-3 3.3-5 6-5s5.2 2 6 5M27 20h9M27 26h9" />
    </template>
    <template v-else-if="name === 'neu'">
      <circle cx="24" cy="24" r="17" />
      <path d="M24 16v16M16 24h16" />
    </template>
    <template v-else-if="name === 'post'">
      <rect x="6" y="12" width="36" height="25" rx="3" />
      <path d="M7 14l17 13 17-13" />
    </template>
    <template v-else>
      <circle cx="24" cy="17" r="7" />
      <path d="M10 40c1-8 7-12 14-12s13 4 14 12" />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  width: 3rem;
  height: 3rem;
}
</style>
