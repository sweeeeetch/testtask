<script setup lang="ts"></script>

<template>
  <v-alert
    type="info"
    variant="tonal"
    density="compact"
    class="mb-4">
    <template #prepend>
      <v-icon>mdi-information</v-icon>
    </template>
    <div class="text-body-2">Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;</div>
  </v-alert>
</template>

<style scoped>
.v-alert {
  border-radius: 8px;
}
</style>
