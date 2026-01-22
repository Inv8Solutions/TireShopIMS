<script setup lang="ts">
defineOptions({ name: 'AppTopBar' })

const emit = defineEmits<{ (e: 'toggle-sidebar'): void }>()

const userName = 'Admin User'
const userRole = 'Admin'
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

        <div class="grid h-10 w-10 place-items-center rounded-xl bg-blue-600">
          <svg
            class="h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.2 2.2 0 0 1-1.56 3.75 2.2 2.2 0 0 1-1.56-.65l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.64V21a2.2 2.2 0 0 1-4.4 0v-.07a1.8 1.8 0 0 0-1.1-1.64 1.8 1.8 0 0 0-1.98.36l-.05.05a2.2 2.2 0 1 1-3.11-3.11l.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.64-1.1H2.9a2.2 2.2 0 0 1 0-4.4h.07A1.8 1.8 0 0 0 4.7 8.4a1.8 1.8 0 0 0-.36-1.98l-.05-.05a2.2 2.2 0 1 1 3.11-3.11l.05.05a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.5 2.07V2a2.2 2.2 0 0 1 4.4 0v.07a1.8 1.8 0 0 0 1.1 1.64 1.8 1.8 0 0 0 1.98-.36l.05-.05a2.2 2.2 0 1 1 3.11 3.11l-.05.05A1.8 1.8 0 0 0 19.4 9a1.8 1.8 0 0 0 1.64 1.1H21.1a2.2 2.2 0 0 1 0 4.4h-.07A1.8 1.8 0 0 0 19.4 15Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

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
