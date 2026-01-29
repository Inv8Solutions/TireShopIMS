<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query as fsQuery, orderBy, doc, updateDoc, deleteDoc, addDoc, increment } from 'firebase/firestore'
import { setPersistence, browserSessionPersistence, onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../../firebase'

defineOptions({ name: 'ProductMasterList' })

type Product = {
  id: string
  brand: string
  size: string
  type: string
  dot: string
  location: string
  plyRating?: string | number
  quantity: number
  purchaseCost: number
  retailPrice: number
}

type NewProduct = {
  brand: string
  size: string
  type: string
  dot: string
  location: string
  plyRating?: string
  quantity: number
  purchaseCost: number
  retailPrice: number
}

const query = ref('')
const products = ref<Product[]>([])
const unsubscribe = ref<(() => void) | null>(null)
const loading = ref(true)

// Auth state
const userEmail = ref<string>('')

// Modal state
const isModalOpen = ref(false)
const selectedProduct = ref<Product | null>(null)
const soldQuantity = ref(0)

// Delete modal state
const isDeleteModalOpen = ref(false)
const productToDelete = ref<Product | null>(null)

// Success indicator state
const showSuccess = ref(false)
const successMessage = ref('')

// Add product modal state
const isAddModalOpen = ref(false)
const newProduct = ref<NewProduct>({
  brand: '',
  size: '',
  type: '',
  dot: '',
  location: '',
  plyRating: '',
  quantity: 0,
  purchaseCost: 0,
  retailPrice: 0
})

onMounted(async () => {
  // Set up Firebase Auth persistence
  try {
    await setPersistence(auth, browserSessionPersistence)
  } catch (error) {
    console.error('Error setting persistence:', error)
  }

  // Monitor auth state changes
  onAuthStateChanged(auth, (user) => {
    userEmail.value = user ? (user.email || '') : ''
  })

  // Set up Firestore listener
  unsubscribe.value = onSnapshot(
    fsQuery(collection(db, 'products'), orderBy('brand')),
    (snapshot) => {
      products.value = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          brand: data.brand ?? '',
          size: data.size ?? '',
              plyRating: data.plyRating ?? '',
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
  const q = query.value.trim().toLowerCase()

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

function onAddProduct() {
  isAddModalOpen.value = true
}

function openEditModal(product: Product) {
  selectedProduct.value = product
  soldQuantity.value = 0
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  selectedProduct.value = null
  soldQuantity.value = 0
}

async function saveQuantity() {
  if (!selectedProduct.value) return

  const sold = Math.max(0, Math.floor(soldQuantity.value || 0))
  if (sold === 0) {
    closeModal()
    return
  }

  const available = typeof selectedProduct.value.quantity === 'number' ? selectedProduct.value.quantity : Number(selectedProduct.value.quantity) || 0
  const actualSold = Math.min(sold, available)
  const newQuantity = Math.max(0, available - actualSold)

  try {
    await updateDoc(doc(db, 'products', selectedProduct.value.id), {
      quantity: newQuantity,
      quantitySold: increment(actualSold)
    })
    successMessage.value = `${actualSold} item(s) recorded as sold`
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
    closeModal()
  } catch (error) {
    console.error('Error updating quantity:', error)
  }
}

function openDeleteModal(product: Product) {
  productToDelete.value = product
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  productToDelete.value = null
}


async function deleteProduct() {
  if (!productToDelete.value) return

  try {
    await deleteDoc(doc(db, 'products', productToDelete.value.id))
    closeDeleteModal()
  } catch (error) {
    console.error('Error deleting product:', error)
  }
}

function closeAddModal() {
  isAddModalOpen.value = false
  // Reset form
  newProduct.value = {
    brand: '',
    size: '',
    type: '',
    dot: '',
    location: '',
    plyRating: '',
    quantity: 0,
    purchaseCost: 0,
    retailPrice: 0
  }
}

// Input sanitization functions
function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ') // Trim and normalize whitespace
}

function sanitizeNumber(value: number): number {
  return isNaN(value) || value < 0 ? 0 : Math.round(value * 100) / 100 // Ensure positive number with 2 decimal places
}

function validateForm(): boolean {
  const brand = sanitizeText(newProduct.value.brand)
  const size = sanitizeText(newProduct.value.size)
  const type = sanitizeText(newProduct.value.type)
  const dot = sanitizeText(newProduct.value.dot)
  const ply = sanitizeText(String(newProduct.value.plyRating || ''))
  const location = sanitizeText(newProduct.value.location)

  if (!brand || brand.length < 2) {
    alert('Brand must be at least 2 characters long')
    return false
  }

  if (!size || size.length < 3) {
    alert('Size must be at least 3 characters long')
    return false
  }

  if (!type || type.length < 2) {
    alert('Type must be at least 2 characters long')
    return false
  }

  if (!dot || dot.length < 1) {
    alert('DOT is required')
    return false
  }

  if (!ply) {
    alert('Ply Rating is required')
    return false
  }

  if (!location || location.length < 1) {
    alert('Location is required')
    return false
  }

  if (newProduct.value.quantity < 0) {
    alert('Quantity cannot be negative')
    return false
  }

  if (newProduct.value.purchaseCost == null || newProduct.value.purchaseCost < 0) {
    alert('Purchase cost is required and cannot be negative')
    return false
  }

  if (newProduct.value.retailPrice == null || newProduct.value.retailPrice < 0) {
    alert('Retail price is required and cannot be negative')
    return false
  }

  return true
}

async function addProduct() {
  if (!validateForm()) return

  // Sanitize all inputs before saving
  const sanitizedProduct = {
    brand: sanitizeText(newProduct.value.brand),
    size: sanitizeText(newProduct.value.size),
    plyRating: sanitizeText(String(newProduct.value.plyRating || '')),
    type: sanitizeText(newProduct.value.type),
    dot: sanitizeText(newProduct.value.dot).toUpperCase(), // DOT codes are typically uppercase
    location: sanitizeText(newProduct.value.location),
    quantity: Math.max(0, Math.floor(newProduct.value.quantity)), // Ensure non-negative integer
    purchaseCost: sanitizeNumber(newProduct.value.purchaseCost),
    retailPrice: sanitizeNumber(newProduct.value.retailPrice)
  }

  try {
    await addDoc(collection(db, 'products'), sanitizedProduct)
    closeAddModal()
  } catch (error) {
    console.error('Error adding product:', error)
    alert('Failed to add product. Please try again.')
  }
}

// Export userEmail for use in header component
defineExpose({
  userEmail
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Product Master List</h1>
        <p class="mt-1 text-sm text-slate-500">Add, edit, or remove products</p>
      </div>
      <!-- Success toast (centered) -->
      <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div class="pointer-events-auto rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-lg max-w-md mx-4 text-center">
          {{ successMessage }}
        </div>
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
        @input="searchTableRows"
      />
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
            <div class="mt-1 text-xs text-slate-500">{{ p.size }} • {{ p.plyRating ?? '' }} • {{ p.type }} • {{ p.location }}</div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="tooltip grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-blue-600 hover:bg-slate-50 hover:text-blue-700"
              data-tooltip="Edit Quantity"
              @click="openEditModal(p)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              class="tooltip grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-600 hover:bg-slate-50 hover:text-rose-700"
              data-tooltip="Delete Product"
              @click="openDeleteModal(p)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              :class="statusFor(p.quantity).pill"
            >
              {{ statusFor(p.quantity).label }}
            </span>
          </div>
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
              <th class="px-5 py-3">Ply Rating</th>
              <th class="px-5 py-3">Type</th>
              <th class="px-5 py-3">DOT</th>
              <th class="px-5 py-3">Location</th>
              <th class="px-5 py-3">Quantity</th>
              <th class="px-5 py-3">Purchase Cost</th>
              <th class="px-5 py-3">Retail Price</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-if="loading">
              <td colspan="10" class="px-5 py-10 text-center text-sm text-slate-500">
                Loading products...
              </td>
            </tr>
            <tr v-for="p in products" :key="p.id" class="text-sm text-slate-700" data-product-row>
              <td class="px-5 py-4 font-medium text-slate-900">{{ p.brand }}</td>
              <td class="px-5 py-4">{{ p.size }}</td>
              <td class="px-5 py-4">{{ p.plyRating ?? '' }}</td>
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
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    class="tooltip text-blue-600 hover:text-blue-700"
                    data-tooltip="Edit Quantity"
                    @click="openEditModal(p)"
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
                    class="tooltip text-rose-600 hover:text-rose-700"
                    data-tooltip="Delete Product"
                    @click="openDeleteModal(p)"
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

            <tr v-if="!loading && products.length === 0">
              <td colspan="10" class="px-5 py-10 text-center text-sm text-slate-500">
                No products found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="text-xs text-slate-500" data-product-count>Showing {{ products.length }} of {{ products.length }} products</div>
  </div>

  <!-- Edit Quantity Modal -->

  <div v-if="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-25" @click="closeModal"></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">Edit Quantity</h3>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600"
            @click="closeModal"
          >
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <div v-if="selectedProduct" class="space-y-4">
          <div>
            <div class="text-sm font-medium text-slate-900">{{ selectedProduct.brand }}</div>
            <div class="text-sm text-slate-500">{{ selectedProduct.size }} • {{ selectedProduct.type }}</div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Quantity Sold</label>
            <input
              v-model.number="soldQuantity"
              type="number"
              :max="selectedProduct.quantity"
              min="0"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
              placeholder="Enter number sold"
            />
            <div class="mt-2 text-xs text-slate-500">Current stock: {{ selectedProduct.quantity }} units</div>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              @click="saveQuantity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-25" @click="closeDeleteModal"></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900">Delete Product</h3>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600"
            @click="closeDeleteModal"
          >
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <div v-if="productToDelete" class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="grid h-12 w-12 place-items-center rounded-full bg-rose-100">
              <svg class="h-6 w-6 text-rose-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div>
              <div class="text-sm font-medium text-slate-900">{{ productToDelete.brand }}</div>
              <div class="text-sm text-slate-500">{{ productToDelete.size }} • {{ productToDelete.type }}</div>
            </div>
          </div>

          <p class="text-sm text-slate-600">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="closeDeleteModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              @click="deleteProduct"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Product Modal -->
  <div v-if="isAddModalOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-25" @click="closeAddModal"></div>

      <!-- Modal -->
      <div class="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-slate-900">Add New Product</h3>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600"
            @click="closeAddModal"
          >
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <form @submit.prevent="addProduct" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Brand</label>
              <input
                v-model="newProduct.brand"
                type="text"
                required
                minlength="2"
                maxlength="50"
                pattern="[a-zA-Z0-9\s\-&.]+"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="Enter brand"
                title="Brand name (2-50 characters, letters, numbers, spaces, hyphens, ampersands, and periods only)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Size</label>
              <input
                v-model="newProduct.size"
                type="text"
                required
                minlength="3"
                maxlength="20"
                pattern="[0-9/\-RZ\s]+"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="e.g., 225/45R17"
                title="Tire size (3-20 characters, numbers, slash, hyphen, R, Z only)"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <input
                v-model="newProduct.type"
                type="text"
                required
                maxlength="30"
                pattern="[a-zA-Z0-9\s\-]+"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="e.g., All-Season, Winter"
                title="Tire type (up to 30 characters, letters, numbers, spaces, hyphens only)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">DOT</label>
              <input
                v-model="newProduct.dot"
                type="text"
                required
                maxlength="15"
                pattern="[A-Z0-9]+"
                style="text-transform: uppercase"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="e.g., DOT1234"
                title="DOT code (up to 15 characters, uppercase letters and numbers only)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Ply Rating</label>
              <input
                v-model="newProduct.plyRating"
                type="text"
                required
                maxlength="10"
                pattern="[0-9A-Za-z\s]+"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="e.g., 6 or 6 Ply"
                title="Ply rating (numbers or short text)"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              v-model="newProduct.location"
              type="text"
              required
              maxlength="50"
              pattern="[a-zA-Z0-9\s\-#.]+"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
              placeholder="e.g., Warehouse A, Shelf B-3"
              title="Storage location (up to 50 characters, letters, numbers, spaces, hyphens, hash, periods only)"
            />
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
              <input
                v-model.number="newProduct.quantity"
                type="number"
                min="0"
                max="99999"
                  required
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="0"
                title="Quantity in stock (0-99999)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Purchase Cost</label>
              <input
                v-model.number="newProduct.purchaseCost"
                type="number"
                  min="0"
                max="99999.99"
                step="0.01"
                  required
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="0.00"
                title="Purchase cost per unit ($0.00-$99999.99)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Retail Price</label>
              <input
                v-model.number="newProduct.retailPrice"
                type="number"
                min="0"
                  max="99999.99"
                step="0.01"
                  required
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="0.00"
                title="Retail price per unit ($0.00-$99999.99)"
              />
            </div>
          </div>

          <div class="flex gap-3 pt-6">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="closeAddModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  position: relative;
}

.tooltip::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 4px 8px;
  font-size: 12px;
  color: white;
  background-color: #1f2937;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  white-space: nowrap;
  z-index: 50;
}

.tooltip:hover::before {
  opacity: 1;
}
</style>
