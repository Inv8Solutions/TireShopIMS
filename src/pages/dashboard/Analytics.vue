<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { collection, onSnapshot, query as fsQuery, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'

defineOptions({ name: 'AnalyticsPage' })

interface FirebaseTimestamp {
  toDate(): Date
}

type SalesEntry = {
  id: string
  productId: string
  productInfo: {
    brand: string
    size: string
    type: string
    dot: string
    location: string
  }
  quantitySold: number
  unitPrice: number
  totalAmount: number
  saleDate: string // YYYY-MM-DD
  timestamp: FirebaseTimestamp | Date | string | number | null
  userEmail: string
  purchaseCost: number
  profit: number
}

type DailySales = {
  date: string
  sales: number
  revenue: number
  profit: number
  topProduct: string
}

const loading = ref(true)
const salesData = ref<SalesEntry[]>([])
const tableData = ref<DailySales[]>([])
const unsubscribe = ref<(() => void) | null>(null)
const selectedPeriod = ref('last30days')

// Sales history filters
const historyPeriodFilter = ref('all')
const historyBrandFilter = ref('')
const historyUserFilter = ref('')
const historyDateFrom = ref('')
const historyDateTo = ref('')
const historySortBy = ref('timestamp')
const historySortOrder = ref('desc')

// Chart data for trend visualization
const chartLabels = ref<string[]>([])
const chartData = ref<number[]>([])

onMounted(() => {
  loadSalesData()
})

onUnmounted(() => {
  if (unsubscribe.value) unsubscribe.value()
})

function loadSalesData() {
  loading.value = true

  // Real-time listener for sales data
  unsubscribe.value = onSnapshot(
    fsQuery(collection(db, 'sales'), orderBy('timestamp', 'desc')),
    (snapshot) => {
      salesData.value = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          productId: data.productId ?? '',
          productInfo: data.productInfo ?? {},
          quantitySold: data.quantitySold ?? 0,
          unitPrice: data.unitPrice ?? 0,
          totalAmount: data.totalAmount ?? 0,
          saleDate: data.saleDate ?? '',
          timestamp: data.timestamp,
          userEmail: data.userEmail ?? '',
          purchaseCost: data.purchaseCost ?? 0,
          profit: data.profit ?? 0
        } as SalesEntry
      })

      processAnalyticsData()
      loading.value = false
    },
    (error) => {
      console.error('Error fetching sales data:', error)
      loading.value = false
    }
  )
}

function processAnalyticsData() {
  const filteredSales = getFilteredSales()

  // Group sales by date
  const dailyMap = new Map<string, {
    sales: number
    revenue: number
    profit: number
    products: Map<string, number>
  }>()

  filteredSales.forEach(sale => {
    const existing = dailyMap.get(sale.saleDate) || {
      sales: 0,
      revenue: 0,
      profit: 0,
      products: new Map()
    }

    existing.sales += sale.quantitySold
    existing.revenue += sale.totalAmount
    existing.profit += sale.profit

    const productKey = `${sale.productInfo.brand} ${sale.productInfo.size}`
    const productCount = existing.products.get(productKey) || 0
    existing.products.set(productKey, productCount + sale.quantitySold)

    dailyMap.set(sale.saleDate, existing)
  })

  // Convert to table data
  tableData.value = Array.from(dailyMap.entries())
    .map(([date, data]) => {
      // Find top product for this day
      let topProduct = 'No sales'
      let maxQuantity = 0
      data.products.forEach((quantity, product) => {
        if (quantity > maxQuantity) {
          maxQuantity = quantity
          topProduct = product
        }
      })

      return {
        date,
        sales: data.sales,
        revenue: data.revenue,
        profit: data.profit,
        topProduct
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date)) // Sort by date descending
    .slice(0, 30) // Show last 30 days

  // Prepare chart data (last 7 days)
  const last7Days = tableData.value.slice(0, 7).reverse()
  chartLabels.value = last7Days.map(item => {
    const date = new Date(item.date + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  chartData.value = last7Days.map(item => item.revenue)
}

function getFilteredSales(): SalesEntry[] {
  const now = new Date()
  const today = now.toISOString().split('T')[0] as string

  switch (selectedPeriod.value) {
    case 'today':
      return salesData.value.filter(sale => sale.saleDate === today)
    case 'last7days': {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0] as string
      return salesData.value.filter(sale => sale.saleDate >= sevenDaysAgoStr)
    }
    case 'last30days':
    default: {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0] as string
      return salesData.value.filter(sale => sale.saleDate >= thirtyDaysAgoStr)
    }
  }
}

function onPeriodChange() {
  processAnalyticsData()
}

// Calculate totals from real data
const totalSales = computed(() => tableData.value.reduce((sum, item) => sum + item.sales, 0))
const totalRevenue = computed(() => tableData.value.reduce((sum, item) => sum + item.revenue, 0))
const totalProfit = computed(() => tableData.value.reduce((sum, item) => sum + item.profit, 0))

// Raw sales history for detailed view
const rawSalesHistory = computed(() => getFilteredSales())

const filteredSalesHistory = computed(() => {
  let filtered = [...salesData.value]

  // Period filter
  if (historyPeriodFilter.value !== 'all') {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    switch (historyPeriodFilter.value) {
      case 'today':
        filtered = filtered.filter(sale => sale.saleDate === today)
        break
      case 'last7days': {
        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(now.getDate() - 7)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0] as string
        filtered = filtered.filter(sale => sale.saleDate >= sevenDaysAgoStr)
        break
      }
      case 'last30days': {
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0] as string
        filtered = filtered.filter(sale => sale.saleDate >= thirtyDaysAgoStr)
        break
      }
      case 'last90days': {
        const ninetyDaysAgo = new Date(now)
        ninetyDaysAgo.setDate(now.getDate() - 90)
        const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0] as string
        filtered = filtered.filter(sale => sale.saleDate >= ninetyDaysAgoStr)
        break
      }
    }
  }

  // Brand filter
  if (historyBrandFilter.value) {
    filtered = filtered.filter(sale =>
      sale.productInfo.brand.toLowerCase().includes(historyBrandFilter.value.toLowerCase())
    )
  }

  // User filter
  if (historyUserFilter.value) {
    filtered = filtered.filter(sale =>
      sale.userEmail.toLowerCase().includes(historyUserFilter.value.toLowerCase())
    )
  }

  // Date range filter
  if (historyDateFrom.value) {
    filtered = filtered.filter(sale => sale.saleDate >= historyDateFrom.value)
  }
  if (historyDateTo.value) {
    filtered = filtered.filter(sale => sale.saleDate <= historyDateTo.value)
  }

  // Sorting
  filtered.sort((a, b) => {
    let aValue: string | number | FirebaseTimestamp | Date | null
    let bValue: string | number | FirebaseTimestamp | Date | null

    switch (historySortBy.value) {
      case 'timestamp':
        aValue = a.timestamp as FirebaseTimestamp | Date | string | number | null
        bValue = b.timestamp as FirebaseTimestamp | Date | string | number | null
        // Handle Firebase Timestamp comparison
        if (aValue && bValue) {
          const aTime = (aValue as FirebaseTimestamp)?.toDate ? (aValue as FirebaseTimestamp).toDate() : new Date(aValue as string | number)
          const bTime = (bValue as FirebaseTimestamp)?.toDate ? (bValue as FirebaseTimestamp).toDate() : new Date(bValue as string | number)
          return historySortOrder.value === 'desc' ? bTime.getTime() - aTime.getTime() : aTime.getTime() - bTime.getTime()
        }
        return 0
      case 'brand':
        aValue = a.productInfo.brand.toLowerCase()
        bValue = b.productInfo.brand.toLowerCase()
        break
      case 'quantity':
        aValue = a.quantitySold
        bValue = b.quantitySold
        break
      case 'amount':
        aValue = a.totalAmount
        bValue = b.totalAmount
        break
      case 'profit':
        aValue = a.profit
        bValue = b.profit
        break
      case 'user':
        aValue = a.userEmail.toLowerCase()
        bValue = b.userEmail.toLowerCase()
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return historySortOrder.value === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return historySortOrder.value === 'desc' ? bValue - aValue : aValue - bValue
    }
    return 0
  })

  return filtered
})

// Get unique brands for filter dropdown
const availableBrands = computed(() => {
  const brands = new Set(salesData.value.map(sale => sale.productInfo.brand))
  return Array.from(brands).sort()
})

// Get unique users for filter dropdown
const availableUsers = computed(() => {
  const users = new Set(salesData.value.map(sale => sale.userEmail.split('@')[0]))
  return Array.from(users).sort()
})

// Clear all history filters
function clearHistoryFilters() {
  historyPeriodFilter.value = 'all'
  historyBrandFilter.value = ''
  historyUserFilter.value = ''
  historyDateFrom.value = ''
  historyDateTo.value = ''
  historySortBy.value = 'timestamp'
  historySortOrder.value = 'desc'
}

// Format timestamp for display
function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return 'N/A'

  const date = (timestamp as FirebaseTimestamp)?.toDate ? (timestamp as FirebaseTimestamp).toDate() : new Date(timestamp as string | number)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Chart rendering (basic SVG for now)
function getChartPath() {
  if (chartData.value.length === 0) return ''

  const maxValue = Math.max(...chartData.value)
  const minValue = Math.min(...chartData.value)
  const range = maxValue - minValue || 1 // Avoid division by zero

  const points = chartData.value.map((value, index) => {
    const x = (index / Math.max(chartData.value.length - 1, 1)) * 300 + 50 // Add 50px margin
    const y = 175 - ((value - minValue) / range) * 120 // Flip Y coordinate
    return `${x},${y}`
  })

  // Create proper SVG path
  if (points.length === 0) return ''

  let path = `M ${points[0]}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i]}`
  }

  return path
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
        <p class="text-slate-600">Sales performance and trends overview</p>
      </div>
      <div class="flex gap-3">
        <select
          v-model="selectedPeriod"
          @change="onPeriodChange"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="today">Today</option>
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
        </select>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-slate-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Total Sales</p>
            <p class="text-2xl font-bold text-slate-900">{{ totalSales.toLocaleString() }}</p>
          </div>
          <div class="rounded-lg bg-blue-50 p-3">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-green-600">+12.5% from last period</span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Total Revenue</p>
            <p class="text-2xl font-bold text-slate-900">₱{{ totalRevenue.toLocaleString() }}</p>
          </div>
          <div class="rounded-lg bg-green-50 p-3">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-slate-600">Revenue from sales</span>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-600">Total Profit</p>
            <p class="text-2xl font-bold text-slate-900">₱{{ totalProfit.toLocaleString() }}</p>
          </div>
          <div class="rounded-lg bg-purple-50 p-3">
            <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <span class="text-sm text-slate-600">Profit margin</span>
        </div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="rounded-xl border border-slate-200 bg-white p-6">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900">Revenue Trend</h2>
        <p class="text-sm text-slate-600">Daily revenue performance (last 7 days)</p>
      </div>

      <div v-if="loading" class="flex h-64 items-center justify-center">
        <div class="text-slate-500">Loading chart...</div>
      </div>

      <div v-else-if="chartData.length === 0" class="flex h-64 items-center justify-center">
        <div class="text-slate-500">No sales data available for the selected period</div>
      </div>

      <div v-else class="relative">
        <!-- Chart container -->
        <div class="h-64 w-full">
          <svg class="h-full w-full" viewBox="0 0 400 200">
            <!-- Grid lines -->
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Chart line -->
            <path
              :d="getChartPath()"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Data points -->
            <g v-for="(value, index) in chartData" :key="index">
              <circle
                :cx="(index / Math.max(chartData.length - 1, 1)) * 300 + 50"
                :cy="175 - ((value - Math.min(...chartData)) / Math.max((Math.max(...chartData) - Math.min(...chartData)), 1)) * 120"
                r="4"
                fill="#3b82f6"
                stroke="#ffffff"
                stroke-width="2"
              />
            </g>
          </svg>
        </div>

        <!-- Chart labels -->
        <div class="mt-4 flex justify-between text-sm text-slate-600">
          <span v-for="label in chartLabels" :key="label">{{ label }}</span>
        </div>
      </div>
    </div>

    <!-- Sales History -->
    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="border-b border-slate-200 p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Sales History</h2>
            <p class="text-sm text-slate-600">Complete record of all sales transactions with advanced filtering</p>
          </div>
          <div class="flex gap-3">
            <button
              @click="clearHistoryFilters"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
            <button class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Export History
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Period Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Period</label>
            <select
              v-model="historyPeriodFilter"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="last90days">Last 90 days</option>
            </select>
          </div>

          <!-- Brand Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Brand</label>
            <select
              v-model="historyBrandFilter"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Brands</option>
              <option v-for="brand in availableBrands" :key="brand" :value="brand">{{ brand }}</option>
            </select>
          </div>

          <!-- User Filter -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Sold By</label>
            <select
              v-model="historyUserFilter"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Users</option>
              <option v-for="user in availableUsers" :key="user" :value="user">{{ user }}</option>
            </select>
          </div>

          <!-- Sort Options -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Sort By</label>
            <div class="flex gap-2">
              <select
                v-model="historySortBy"
                class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="timestamp">Date</option>
                <option value="brand">Brand</option>
                <option value="quantity">Quantity</option>
                <option value="amount">Amount</option>
                <option value="profit">Profit</option>
                <option value="user">User</option>
              </select>
              <select
                v-model="historySortOrder"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="desc">↓</option>
                <option value="asc">↑</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Date Range Filters -->
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">From Date</label>
            <input
              v-model="historyDateFrom"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">To Date</label>
            <input
              v-model="historyDateTo"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div class="flex items-end">
            <div class="text-sm text-slate-600">
              Showing {{ filteredSalesHistory.length.toLocaleString() }} of {{ salesData.length.toLocaleString() }} transactions
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="p-6">
        <div class="flex items-center justify-center py-12">
          <div class="text-slate-500">Loading sales history...</div>
        </div>
      </div>

      <div v-else-if="filteredSalesHistory.length === 0" class="p-6">
        <div class="flex items-center justify-center py-12">
          <div class="text-slate-500">No sales transactions found with current filters</div>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <!-- Desktop History Table -->
        <table class="hidden w-full md:table">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Timestamp
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Product Details
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Quantity
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Unit Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Profit
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Sold By
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="sale in filteredSalesHistory" :key="sale.id" class="hover:bg-slate-50">
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-slate-900">
                  {{ formatTimestamp(sale.timestamp) }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ sale.saleDate }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-slate-900">
                  {{ sale.productInfo.brand }} {{ sale.productInfo.size }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ sale.productInfo.type }} • DOT: {{ sale.productInfo.dot }} • {{ sale.productInfo.location }}
                </div>
                <div class="text-xs text-blue-600 mt-1">
                  ID: {{ sale.productId }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-slate-900">{{ sale.quantitySold.toLocaleString() }} units</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-slate-900">₱{{ sale.unitPrice.toLocaleString() }}</div>
                <div class="text-xs text-slate-500">Cost: ₱{{ sale.purchaseCost.toLocaleString() }}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-slate-900">₱{{ sale.totalAmount.toLocaleString() }}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-emerald-600">₱{{ sale.profit.toLocaleString() }}</div>
                <div class="text-xs text-slate-500">
                  {{ ((sale.profit / sale.totalAmount) * 100).toFixed(1) }}% margin
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-slate-900">{{ sale.userEmail.split('@')[0] }}</div>
                <div class="text-xs text-slate-500">{{ sale.userEmail }}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile History Cards -->
        <div class="divide-y divide-slate-200 md:hidden">
          <div v-for="sale in filteredSalesHistory" :key="sale.id" class="p-4">
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div class="min-w-0">
                  <div class="font-medium text-slate-900">
                    {{ sale.productInfo.brand }} {{ sale.productInfo.size }}
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    {{ sale.productInfo.type }} • DOT: {{ sale.productInfo.dot }} • {{ sale.productInfo.location }}
                  </div>
                  <div class="text-xs text-blue-600 mt-1">
                    ID: {{ sale.productId }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-slate-900">₱{{ sale.totalAmount.toLocaleString() }}</div>
                  <div class="text-xs text-slate-500">
                    {{ formatTimestamp(sale.timestamp) }}
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-slate-500 text-xs">Quantity:</span>
                  <div class="text-slate-900">{{ sale.quantitySold }} units</div>
                </div>
                <div>
                  <span class="text-slate-500 text-xs">Unit Price:</span>
                  <div class="text-slate-900">₱{{ sale.unitPrice.toLocaleString() }}</div>
                </div>
                <div>
                  <span class="text-slate-500 text-xs">Profit:</span>
                  <div class="text-emerald-600">₱{{ sale.profit.toLocaleString() }}</div>
                </div>
              </div>
              <div class="text-xs text-slate-500">
                Sold by {{ sale.userEmail.split('@')[0] }} ({{ sale.userEmail }}) •
                {{ ((sale.profit / sale.totalAmount) * 100).toFixed(1) }}% margin •
                Cost: ₱{{ sale.purchaseCost.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Performance Summary -->
    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="border-b border-slate-200 p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Daily Performance Summary</h2>
            <p class="text-sm text-slate-600">Aggregated daily sales metrics</p>
          </div>
          <div class="flex gap-3">
            <button class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Export
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="p-6">
        <div class="flex items-center justify-center py-12">
          <div class="text-slate-500">Loading analytics data...</div>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <!-- Desktop Table -->
        <table class="hidden w-full md:table">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Sales
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Revenue
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Profit
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Top Product
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr v-for="item in tableData" :key="item.date" class="hover:bg-slate-50">
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-slate-900">
                  {{ new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  }) }}
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-slate-900">{{ item.sales.toLocaleString() }} units</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-slate-900">₱{{ item.revenue.toLocaleString() }}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm font-medium text-emerald-600">₱{{ item.profit.toLocaleString() }}</div>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <div class="text-sm text-slate-900">{{ item.topProduct }}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile Cards -->
        <div class="divide-y divide-slate-200 md:hidden">
          <div v-for="item in tableData" :key="item.date" class="p-4">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-900">
                  {{ new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  }) }}
                </span>
                <span class="text-sm font-medium text-slate-900">₱{{ item.revenue.toLocaleString() }}</span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-slate-500">Sales:</span>
                  <span class="ml-1 text-slate-900">{{ item.sales.toLocaleString() }} units</span>
                </div>
                <div>
                  <span class="text-slate-500">Profit:</span>
                  <span class="ml-1 text-emerald-600">₱{{ item.profit.toLocaleString() }}</span>
                </div>
              </div>
              <div>
                <span class="text-xs text-slate-500">Top Product:</span>
                <div class="mt-1 text-sm text-slate-900">{{ item.topProduct }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
