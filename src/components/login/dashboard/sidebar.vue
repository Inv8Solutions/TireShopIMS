<script setup lang="ts">
defineOptions({ name: 'DashboardSidebar' })

import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'desktop' | 'mobile'
    open?: boolean
  }>(),
  {
    variant: 'desktop',
    open: false,
  },
)

const emit = defineEmits<{ (e: 'close'): void }>()

type NavItem = {
  label: string
  to: string
  icon: 'list' | 'grid'
}

const route = useRoute()

const items = computed<NavItem[]>(() => [
  { label: 'Product Listing', to: '/dashboard/products', icon: 'list' },
  { label: 'Master List', to: '/dashboard/master', icon: 'grid' },
])

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function linkClass(to: string) {
  return [
    'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
    isActive(to)
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  ].join(' ')
}

const asideClass = computed(() => {
  if (props.variant === 'mobile') {
    return [
      'md:hidden fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw]',
      'p-4 pt-5',
      'transition-transform duration-200 ease-out',
      props.open ? 'translate-x-0' : '-translate-x-full',
    ].join(' ')
  }

  return 'hidden md:block w-60 lg:w-72 shrink-0 p-4 lg:p-6'
})

function onNavigate() {
  if (props.variant === 'mobile') emit('close')
}
</script>

<template>
  <aside :class="asideClass" aria-label="Sidebar navigation">
    <div class="h-full rounded-2xl border border-slate-200 bg-white p-3">
      <div v-if="variant === 'mobile'" class="mb-2 flex items-center justify-between px-1">
        <div class="text-sm font-semibold text-slate-900">Menu</div>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label="Close sidebar"
          @click="emit('close')"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <nav class="space-y-1">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          :class="linkClass(item.to)"
          @click="onNavigate"
        >
          <span
            class="grid h-9 w-9 place-items-center rounded-xl"
            :class="isActive(item.to) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
          >
            <svg
              v-if="item.icon === 'list'"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </aside>
</template>

<style scoped></style>
