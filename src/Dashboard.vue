<script setup lang="ts">
defineOptions({ name: 'DashboardLayout' })

import Sidebar from './components/login/dashboard/sidebar.vue'
import TopBar from './components/layout/TopBar.vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const hasChildRoute = computed(() => route.matched.length > 1)

const mobileSidebarOpen = ref(false)

function toggleMobileSidebar() {
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <TopBar @toggle-sidebar="toggleMobileSidebar" />

    <!-- Mobile overlay -->
    <div
      v-if="mobileSidebarOpen"
      class="md:hidden fixed inset-0 z-30 bg-slate-900/40"
      aria-hidden="true"
      @click="closeMobileSidebar"
    />

    <div class="mx-auto flex max-w-350">
      <!-- Desktop sidebar -->
      <Sidebar variant="desktop" />

      <!-- Mobile drawer sidebar -->
      <Sidebar variant="mobile" :open="mobileSidebarOpen" @close="closeMobileSidebar" />

      <main class="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-6">
          <RouterView v-if="hasChildRoute" />
          <div v-else class="text-sm text-slate-500">Select a module from the sidebar.</div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped></style>
