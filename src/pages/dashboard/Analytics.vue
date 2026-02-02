<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { collection, onSnapshot, query as fsQuery, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'

defineOptions({ name: 'AnalyticsPage' })

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
  timestamp: unknown
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

    <!-- Analytics Table -->
    <div class="rounded-xl border border-slate-200 bg-white">
      <div class="border-b border-slate-200 p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Monthly Performance</h2>
            <p class="text-sm text-slate-600">Detailed breakdown of sales metrics</p>
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
