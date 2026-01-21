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
  <div>
    <h2>Login</h2>

    <!-- Error message display -->
    <div v-if="error" style="color: red; margin-bottom: 10px">
      {{ error }}
    </div>

    <form @submit.prevent="login">
      <div>
        <label for="username">Email:</label>
        <input
          type="email"
          id="username"
          v-model="username"
          required
          class="border p-4 rounded"
          :disabled="isLoading"
        />
      </div>
      <div>
        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          class="border p-4 rounded"
          :disabled="isLoading"
        />
      </div>
      <div>
        <button type="submit" class="border p-4 rounded" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
