<script setup lang="ts">
import { computed, ref } from 'vue'

type Product = {
  name: string
  brand: string
  category: string
  size: string
  available: number
  price: number
}

const query = ref('')

const products = ref<Product[]>([
  {
    name: 'Michelin Pilot Sport 4',
    brand: 'Michelin',
    category: 'Performance',
    size: '225/45R17',
    available: 45,
    price: 185.99,
  },
  {
    name: 'Bridgestone Turanza T005',
    brand: 'Bridgestone',
    category: 'Touring',
    size: '205/55R16',
    available: 12,
    price: 142.5,
  },
  {
    name: 'Goodyear Eagle F1',
    brand: 'Goodyear',
    category: 'Performance',
    size: '245/40R18',
    available: 8,
    price: 210.0,
  },
  {
    name: 'Continental PremiumContact 6',
    brand: 'Continental',
    category: 'Touring',
    size: '195/65R15',
    available: 35,
    price: 128.75,
  },
  {
    name: 'Pirelli Scorpion Verde',
    brand: 'Pirelli',
    category: 'SUV',
    size: '235/55R19',
    available: 5,
    price: 195.0,
  },
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter((p) => {
    return [p.name, p.brand, p.category, p.size].some((v) => v.toLowerCase().includes(q))
  })
})

function statusFor(available: number) {
  if (available <= 0) return { label: 'Out of Stock', pill: 'bg-rose-100 text-rose-700' }
  if (available <= 10) return { label: 'Low Stock', pill: 'bg-rose-100 text-rose-700' }
  return { label: 'In Stock', pill: 'bg-emerald-100 text-emerald-700' }
}

function formatPrice(v: number) {
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Product Listing</h1>
      <p class="mt-1 text-sm text-slate-500">Browse available tire products</p>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>

        <input
          v-model="query"
          type="text"
          placeholder="Search products..."
          class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div class="w-40">
        <input
          type="text"
          placeholder=""
          class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-slate-50">
            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th class="px-5 py-3">Product Name</th>
              <th class="px-5 py-3">Brand</th>
              <th class="px-5 py-3">Category</th>
              <th class="px-5 py-3">Size</th>
              <th class="px-5 py-3">Available</th>
              <th class="px-5 py-3">Price</th>
              <th class="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="p in filtered" :key="p.name" class="text-sm text-slate-700">
              <td class="px-5 py-4 font-medium text-slate-900">{{ p.name }}</td>
              <td class="px-5 py-4">{{ p.brand }}</td>
              <td class="px-5 py-4">{{ p.category }}</td>
              <td class="px-5 py-4">{{ p.size }}</td>
              <td class="px-5 py-4">
                <div class="leading-tight">
                  <div class="font-medium text-slate-900">{{ p.available }}</div>
                  <div class="text-xs text-slate-500">units</div>
                </div>
              </td>
              <td class="px-5 py-4">
                <a href="#" class="font-semibold text-blue-600 hover:text-blue-700">
                  {{ formatPrice(p.price) }}
                </a>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  :class="statusFor(p.available).pill"
                >
                  {{ statusFor(p.available).label }}
                </span>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="7" class="px-5 py-10 text-center text-sm text-slate-500">
                No products found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-xs text-slate-500">Showing {{ filtered.length }} of {{ products.length }} products</div>
  </div>
</template>
