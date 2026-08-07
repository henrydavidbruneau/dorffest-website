<template>
  <div class="loader-wrapper" :class="{ 'fade-out': !active }">
    <div class="loader-graphic">
      <img src="@/assets/loader.svg" alt="Loader Illustration" />
      <div class="fill-animation"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
defineProps<{ active: boolean }>();
</script>

<style scoped lang="scss">
.loader-wrapper {
  position: fixed;
  inset: 0;
  background: $color-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.3s ease-out;
  pointer-events: all;
}

.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loader-graphic {
  position: relative;
  width: 150px;
  height: 150px;

  img {
    width: 100%;
    height: auto;
    display: block;
    position: relative;
    z-index: 2;
  }

  .fill-animation {
    position: absolute;
    top: 10px;
    left: 12px;
    width: 70%;
    height: 70%;
    background: rgb(255, 255, 255);
    animation: fillBox 1s ease-in-out forwards;
    z-index: 1;
  }
}

@keyframes fillBox {
  0% {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  100% {
    transform: scaleY(1);
    transform-origin: bottom;
  }
}
</style>
