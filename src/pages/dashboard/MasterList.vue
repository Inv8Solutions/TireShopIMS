<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'ProductMasterList' })

type Product = {
  name: string
  category: string
  brand: string
  size: string
  quantity: number
  minStock: number
  price: number
  cost: number
  supplier: string
}

const query = ref('')

const products = ref<Product[]>([
  {
    name: 'Michelin Pilot Sport 4',
    category: 'Performance',
    brand: 'Michelin',
    size: '225/45R17',
    quantity: 45,
    minStock: 20,
    price: 185.99,
    cost: 125.0,
    supplier: 'Michelin Distributor',
  },
  {
    name: 'Bridgestone Turanza T005',
    category: 'Touring',
    brand: 'Bridgestone',
    size: '205/55R16',
    quantity: 12,
    minStock: 15,
    price: 142.5,
    cost: 95.0,
    supplier: 'Bridgestone Corp',
  },
  {
    name: 'Goodyear Eagle F1',
    category: 'Performance',
    brand: 'Goodyear',
    size: '245/40R18',
    quantity: 8,
    minStock: 10,
    price: 210.0,
    cost: 145.0,
    supplier: 'Goodyear Supply Co',
  },
  {
    name: 'Continental PremiumContact 6',
    category: 'Touring',
    brand: 'Continental',
    size: '195/65R15',
    quantity: 35,
    minStock: 20,
    price: 128.75,
    cost: 85.0,
    supplier: 'Continental Direct',
  },
  {
    name: 'Pirelli Scorpion Verde',
    category: 'SUV',
    brand: 'Pirelli',
    size: '235/55R19',
    quantity: 5,
    minStock: 12,
    price: 195.0,
    cost: 130.0,
    supplier: 'Pirelli Wholesale',
  },
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter((p) => {
    return [p.name, p.category, p.brand, p.size, p.supplier].some((v) => v.toLowerCase().includes(q))
  })
})

function qtyPill(quantity: number, minStock: number) {
  if (quantity <= minStock) return { bg: 'bg-rose-100', fg: 'text-rose-700' }
  return { bg: 'bg-emerald-100', fg: 'text-emerald-700' }
}

function formatMoney(v: number) {
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function onAddProduct() {
  // UI-only for now
}

function onEditProduct(product: Product) {
  void product
}

function onDeleteProduct(product: Product) {
  void product
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Product Master List</h1>
        <p class="mt-1 text-sm text-slate-500">Add, edit, or remove products</p>
      </div>

      <button
        type="button"
        class="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
        @click="onAddProduct"
      >
        <span class="grid h-6 w-6 place-items-center rounded-lg bg-white/15">
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        Add Product
      </button>
    </div>

    <div class="relative">
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

    <!-- Mobile cards -->
    <div class="space-y-3 md:hidden">
      <div v-for="p in filtered" :key="p.name" class="rounded-2xl border border-slate-200 bg-white p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-slate-900">{{ p.name }}</div>
            <div class="mt-1 text-xs text-slate-500">{{ p.category }} • {{ p.brand }} • {{ p.size }}</div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700"
              title="Edit"
              @click="onEditProduct(p)"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 20h9"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-rose-600 hover:bg-slate-50 hover:text-rose-700"
              title="Delete"
              @click="onDeleteProduct(p)"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 6h18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 6V4h8v2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M19 6l-1 14H6L5 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M10 11v6M14 11v6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</div>
            <div class="mt-1 flex items-center gap-2">
              <span
                class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                :class="[qtyPill(p.quantity, p.minStock).bg, qtyPill(p.quantity, p.minStock).fg]"
              >
                {{ p.quantity }}
              </span>
              <span class="text-slate-500">(min {{ p.minStock }})</span>
            </div>
          </div>

          <div class="text-right">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</div>
            <div class="mt-1 font-medium text-slate-900">{{ formatMoney(p.price) }}</div>
          </div>

          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cost</div>
            <div class="mt-1 font-medium text-slate-900">{{ formatMoney(p.cost) }}</div>
          </div>

          <div class="text-right">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</div>
            <div class="mt-1 truncate text-slate-700">{{ p.supplier }}</div>
          </div>
        </div>
      </div>

      <div
        v-if="filtered.length === 0"
        class="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500"
      >
        No products found.
      </div>
    </div>

    <!-- Desktop table -->
    <div class="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-slate-50">
            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th class="px-5 py-3">Product Name</th>
              <th class="px-5 py-3">Category</th>
              <th class="px-5 py-3">Brand</th>
              <th class="px-5 py-3">Size</th>
              <th class="px-5 py-3">Quantity</th>
              <th class="px-5 py-3">Min Stock</th>
              <th class="px-5 py-3">Price</th>
              <th class="px-5 py-3">Cost</th>
              <th class="px-5 py-3">Supplier</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="p in filtered" :key="p.name" class="text-sm text-slate-700">
              <td class="px-5 py-4 font-medium text-slate-900">{{ p.name }}</td>
              <td class="px-5 py-4">{{ p.category }}</td>
              <td class="px-5 py-4">{{ p.brand }}</td>
              <td class="px-5 py-4">{{ p.size }}</td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                  :class="[qtyPill(p.quantity, p.minStock).bg, qtyPill(p.quantity, p.minStock).fg]"
                >
                  {{ p.quantity }}
                </span>
              </td>
              <td class="px-5 py-4">{{ p.minStock }}</td>
              <td class="px-5 py-4">{{ formatMoney(p.price) }}</td>
              <td class="px-5 py-4">{{ formatMoney(p.cost) }}</td>
              <td class="px-5 py-4 text-slate-600">{{ p.supplier }}</td>

              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    class="text-blue-600 hover:text-blue-700"
                    title="Edit"
                    @click="onEditProduct(p)"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 20h9"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="text-rose-600 hover:text-rose-700"
                    title="Delete"
                    @click="onDeleteProduct(p)"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 6h18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M8 6V4h8v2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M19 6l-1 14H6L5 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10 11v6M14 11v6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="10" class="px-5 py-10 text-center text-sm text-slate-500">
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
