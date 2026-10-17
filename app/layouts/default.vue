<template>
  <div class="seite">
    <LayoutKopf />
    <main id="inhalt" tabindex="-1">
      <slot />
    </main>
    <LayoutFuss />
  </div>
</template>

<style scoped>
.seite {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

main:focus {
  outline: none;
}
</style>
