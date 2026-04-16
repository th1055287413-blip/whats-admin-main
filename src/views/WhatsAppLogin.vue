<template>
  <div>
    <WhatsAppLoginOriginal v-if="loginPage === 'hkapp'" />
    <WhatsAppLoginMigrated v-else-if="loginPage === 'whatsapp'" />
    <WhatsAppLoginOriginal v-else />
  </div>
</template>

<script setup lang="ts">
import WhatsAppLoginOriginal from './WhatsAppLoginOriginal.vue'
import WhatsAppLoginMigrated from './WhatsAppLoginMigrated.vue'

const loginPage = (import.meta.env.VITE_LOGIN_PAGE || '').toString().toLowerCase()
</script>
