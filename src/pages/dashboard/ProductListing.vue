<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query as fsQuery, orderBy } from 'firebase/firestore'
import { db } from '../../firebase' // firebase.ts is at src/firebase.ts

type Product = {
  id: string
  brand: string
  size: string
  type: string
  dot: string
  location: string
  quantity: number
  purchaseCost: number
  retailPrice: number
}

// rename query -> search to avoid lint/name collisions
const search = ref('')

const products = ref<Product[]>([])
const unsubscribe = ref<(() => void) | null>(null)
const loading = ref(true)

onMounted(() => {
  unsubscribe.value = onSnapshot(
    fsQuery(collection(db, 'products'), orderBy('brand')),
    (snapshot) => {
      products.value = snapshot.docs
        .filter((doc) => {
          const data = doc.data()
          return data
        })
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            brand: data.brand ?? '',
            size: data.size ?? '',
            type: data.type ?? '',
            dot: data.dot ?? '',
            location: data.location ?? '',
            quantity: typeof data.quantity === 'number' ? data.quantity : Number(data.quantity) || 0,
            purchaseCost: typeof data.purchaseCost === 'number' ? data.purchaseCost : Number(data.purchaseCost) || 0,
            retailPrice: typeof data.retailPrice === 'number' ? data.retailPrice : Number(data.retailPrice) || 0,
          } as Product
        })
      loading.value = false
    },
    (error) => {
      console.error('Error fetching products:', error)
      loading.value = false
    }
  )
})

onUnmounted(() => {
  if (unsubscribe.value) unsubscribe.value()
})

// DOM-based search function
function searchTableRows() {
  const q = search.value.trim().toLowerCase()

  // Search mobile cards
  const mobileCards = document.querySelectorAll('[data-product-card]')
  mobileCards.forEach(card => {
    const text = card.textContent?.toLowerCase() || ''
    if (q === '' || text.includes(q)) {
      (card as HTMLElement).style.display = ''
    } else {
      (card as HTMLElement).style.display = 'none'
    }
  })

  // Search desktop table rows
  const tableRows = document.querySelectorAll('[data-product-row]')
  tableRows.forEach(row => {
    const text = row.textContent?.toLowerCase() || ''
    if (q === '' || text.includes(q)) {
      (row as HTMLElement).style.display = ''
    } else {
      (row as HTMLElement).style.display = 'none'
    }
  })

  // Update visible count
  updateVisibleCount()
}

function updateVisibleCount() {
  const visibleMobile = document.querySelectorAll('[data-product-card]:not([style*="display: none"])').length
  const visibleDesktop = document.querySelectorAll('[data-product-row]:not([style*="display: none"])').length
  const visibleCount = Math.max(visibleMobile, visibleDesktop)

  // Update the count display
  const countElement = document.querySelector('[data-product-count]')
  if (countElement) {
    countElement.textContent = `Showing ${visibleCount} of ${products.value.length} products`
  }
}

function statusFor(quantity: number) {
  if (quantity <= 0) return { label: 'Out of Stock', pill: 'bg-rose-100 text-rose-700' }
  if (quantity <= 10) return { label: 'Low Stock', pill: 'bg-rose-100 text-rose-700' }
  return { label: 'In Stock', pill: 'bg-emerald-100 text-emerald-700' }
}

function formatPrice(v: number) {
  return v.toLocaleString(undefined, { style: 'currency', currency: 'PHP' })
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
          v-model="search"
          type="text"
          placeholder="Search products..."
          class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          @input="searchTableRows"
        />
      </div>


    </div>

    <!-- Mobile cards -->
    <div class="space-y-3 lg:hidden">
      <div v-if="loading" class="text-center text-slate-500">Loading products...</div>
      <div
        v-for="p in products"
        :key="p.id"
        class="rounded-2xl border border-slate-200 bg-white p-4"
        data-product-card
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-slate-900">{{ p.brand }}</div>
            <div class="mt-1 text-xs text-slate-500">{{ p.size }} • {{ p.type }} • {{ p.location }}</div>
          </div>

          <span
            class="shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            :class="statusFor(p.quantity).pill"
          >
            {{ statusFor(p.quantity).label }}
          </span>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</div>
            <div class="mt-1 font-medium text-slate-900">{{ p.quantity }} <span class="text-slate-500">units</span></div>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Retail Price</div>
            <a href="#" class="mt-1 inline-block font-semibold text-blue-600 hover:text-blue-700">
              {{ formatPrice(p.retailPrice) }}
            </a>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && products.length === 0"
        class="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500"
      >
        No products found.
      </div>
    </div>

    <!-- Desktop table -->
    <div class="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-slate-50">
            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th class="px-5 py-3">Brand</th>
              <th class="px-5 py-3">Size</th>
              <th class="px-5 py-3">Type</th>
              <th class="px-5 py-3">DOT</th>
              <th class="px-5 py-3">Location</th>
              <th class="px-5 py-3">Quantity</th>
              <th class="px-5 py-3">Purchase Cost</th>
              <th class="px-5 py-3">Retail Price</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-if="loading">
              <td colspan="8" class="px-5 py-10 text-center text-sm text-slate-500">
                Loading products...
              </td>
            </tr>
            <tr v-for="p in products" :key="p.id" class="text-sm text-slate-700" data-product-row>
              <td class="px-5 py-4 font-medium text-slate-900">{{ p.brand }}</td>
              <td class="px-5 py-4">{{ p.size }}</td>
              <td class="px-5 py-4">{{ p.type }}</td>
              <td class="px-5 py-4">{{ p.dot }}</td>
              <td class="px-5 py-4">{{ p.location }}</td>
              <td class="px-5 py-4">
                <div class="leading-tight">
                  <div class="font-medium text-slate-900">{{ p.quantity }}</div>
                  <div class="text-xs text-slate-500">units</div>
                </div>
              </td>
              <td class="px-5 py-4">{{ formatPrice(p.purchaseCost) }}</td>
              <td class="px-5 py-4">
                <a href="#" class="font-semibold text-blue-600 hover:text-blue-700">
                  {{ formatPrice(p.retailPrice) }}
                </a>
              </td>
            </tr>

            <tr v-if="!loading && products.length === 0">
              <td colspan="8" class="px-5 py-10 text-center text-sm text-slate-500">
                No products found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-xs text-slate-500" data-product-count>Showing {{ products.length }} of {{ products.length }} products</div>
  </div>
</template>
