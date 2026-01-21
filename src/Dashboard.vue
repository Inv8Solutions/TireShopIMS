<script setup lang="ts">
defineOptions({ name: 'DashboardLayout' })

import Sidebar from './components/login/dashboard/sidebar.vue'
import TopBar from './components/layout/TopBar.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const hasChildRoute = computed(() => route.matched.length > 1)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <TopBar />

    <div class="mx-auto flex max-w-350">
      <Sidebar />

      <main class="flex-1 px-6 py-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <RouterView v-if="hasChildRoute" />
          <div v-else class="text-sm text-slate-500">Select a module from the sidebar.</div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped></style>
