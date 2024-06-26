<template>
  <div>
    <i-frame v-model:src="url"></i-frame>
  </div>
</template>

<script lang="ts" setup>
const url = ref(import.meta.env.VITE_APP_MONITRO_ADMIN);
</script>
