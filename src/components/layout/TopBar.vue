<script setup lang="ts">
defineOptions({ name: 'AppTopBar' })

const emit = defineEmits<{ (e: 'toggle-sidebar'): void }>()

const userName = 'Admin User'
const userRole = 'Admin'

const logoUrl = new URL('../../assets/BasicVenturesLogo.png', import.meta.url).href
</script>

<template>
  <header class="h-16 w-full border-b border-slate-200 bg-white">
    <div class="mx-auto flex h-full max-w-350 items-center justify-between px-4 sm:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="md:hidden grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label="Open sidebar"
          @click="emit('toggle-sidebar')"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <img
          :src="logoUrl"
          alt="Basic Ventures logo"
          class="h-10 w-auto shrink-0"
          loading="eager"
        />

        <div class="min-w-0 leading-tight">
          <div class="truncate text-sm font-semibold text-slate-900">Basic Ventures Tireshop</div>
          <div class="hidden sm:block text-xs text-slate-500">Inventory Management System</div>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-4">
        <div class="hidden sm:block text-right leading-tight">
          <div class="text-sm font-medium text-slate-900">{{ userName }}</div>
          <div class="text-xs text-slate-500">{{ userRole }}</div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Logout"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 16l-4-4m0 0l4-4m-4 4h10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M14 7a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>
