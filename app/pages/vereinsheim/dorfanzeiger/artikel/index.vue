<script setup lang="ts">
// Nach dem Speichern/Löschen landet man hier → zurück zum Redaktionstisch
definePageMeta({ middleware: [() => navigateTo('/vereinsheim/dorfanzeiger?reiter=artikel', { replace: true })] })
</script>

<template>
  <div />
</template>
