<script setup lang="ts">
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { auth } from '../../firebase'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const showPassword = ref(false)

const logoUrl = new URL('../../assets/BasicVenturesLogo.png', import.meta.url).href

const login = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter both email and password'
    return
  }

  try {
    isLoading.value = true
    error.value = ''

    await signInWithEmailAndPassword(auth, username.value, password.value)

    console.log('Login successful!')
    router.push('/dashboard')
  } catch (err: unknown) {
    console.error('Login error:', err)

    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : ''

    switch (code) {
      case 'auth/invalid-email':
        error.value = 'Invalid email address'
        break
      case 'auth/user-disabled':
        error.value = 'This account has been disabled'
        break
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        error.value = 'Invalid email or password'
        break
      case 'auth/too-many-requests':
        error.value = 'Too many failed attempts. Please try again later'
        break
      case 'auth/network-request-failed':
        error.value = 'Network error. Please check your connection'
        break
      default:
        error.value = 'Failed to login. Please try again'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto flex min-h-screen max-w-350 lg:max-w-none xl:max-w-[1400px] items-stretch">
      <!-- Left: brand panel (desktop) -->
      <div class="hidden w-1/2 lg:w-3/5 items-center justify-center bg-white md:flex">
        <div class="max-w-md px-6 md:px-8 lg:px-10">
          <img
            :src="logoUrl"
            alt="Basic Ventures logo"
            class="mx-auto h-auto w-full max-w-sm"
            loading="eager"
          />
          <div class="mt-8 text-center">
            <h1 class="text-2xl font-semibold text-slate-900">Inventory Management System</h1>
            <p class="mt-2 text-sm text-slate-500">Sign in to manage products and inventory.</p>
          </div>
        </div>
      </div>

      <!-- Right: form -->
      <div class="flex w-full lg:w-2/5 items-center justify-center px-4 py-10 md:w-1/2 md:px-6 lg:px-10">
        <div class="w-full max-w-md">
          <!-- Mobile header -->
          <div class="mb-6 text-center md:hidden">
            <img
              :src="logoUrl"
              alt="Basic Ventures logo"
              class="mx-auto h-auto w-full max-w-65"
              loading="eager"
            />
            <h1 class="mt-5 text-xl font-semibold text-slate-900">Welcome back</h1>
            <p class="mt-1 text-sm text-slate-500">Sign in to continue.</p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="hidden md:block">
              <h1 class="text-2xl font-semibold text-slate-900">Welcome back</h1>
              <p class="mt-1 text-sm text-slate-500">Sign in to continue.</p>
            </div>

            <div
              v-if="error"
              class="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {{ error }}
            </div>

            <form class="mt-6 space-y-4" @submit.prevent="login">
              <div>
                <label for="username" class="block text-sm font-medium text-slate-700">Email</label>
                <input
                  id="username"
                  v-model="username"
                  type="email"
                  autocomplete="username"
                  inputmode="email"
                  required
                  :disabled="isLoading"
                  class="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
                <div class="relative mt-2">
                  <input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    required
                    :disabled="isLoading"
                    class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-900"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  >
                    <svg
                      v-if="showPassword"
                      class="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
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
                        d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-3.42"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M9.88 5.08A9.76 9.76 0 0 1 12 5c5.5 0 9 7 9 7a17.37 17.37 0 0 1-2.18 3.19"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6.11 6.11C3.73 7.73 2 12 2 12s3.5 7 10 7c1.02 0 1.99-.16 2.9-.44"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-blue-400"
                :disabled="isLoading"
              >
                <svg
                  v-if="isLoading"
                  class="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2a10 10 0 1 0 10 10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span>{{ isLoading ? 'Signing in…' : 'Sign in' }}</span>
              </button>

              <p class="pt-2 text-center text-xs text-slate-500">
                By signing in you agree to your company policies.
              </p>
            </form>
          </div>

          <p class="mt-6 text-center text-xs text-slate-500">
            Basic Ventures Tireshop • Inventory Management System
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
