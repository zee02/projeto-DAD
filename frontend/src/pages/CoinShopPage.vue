<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900">💰 Coin Shop</h1>
        <router-link to="/" class="text-blue-600 hover:text-blue-700 font-semibold">
          ← Back
        </router-link>
      </div>

      <!-- Current Balance Card -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">Current Balance</p>
            <p class="text-3xl font-bold text-yellow-900">🪙 {{ user?.coins_balance || 0 }} coins</p>
          </div>
          <div class="text-6xl opacity-20">💰</div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        {{ successMessage }}
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Buy Coins Form -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">Purchase Coins</h2>

            <!-- Amount Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Select Amount</label>
              <div class="space-y-2">
                <button
                  v-for="amount in amounts"
                  :key="amount"
                  @click="formData.euros = amount"
                  :class="[
                    'w-full px-4 py-3 border-2 rounded-lg font-semibold transition',
                    formData.euros === amount
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  ]"
                >
                  {{ amount }}€ → {{ amount * 10 }} coins
                </button>
              </div>
            </div>

            <!-- Payment Type -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
              <select
                v-model="formData.payment_type"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select payment method...</option>
                <option value="MBWAY">MBWAY</option>
                <option value="VISA">VISA Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="IBAN">IBAN Transfer</option>
                <option value="MB">Multibanco</option>
              </select>
              <p class="text-xs text-gray-500 mt-2">{{ getPaymentHint(formData.payment_type) }}</p>
            </div>

            <!-- Payment Reference -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
              <input
                v-model="formData.payment_reference"
                :type="getPaymentInputType(formData.payment_type)"
                :placeholder="getPaymentPlaceholder(formData.payment_type)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p class="text-xs text-gray-500 mt-1">{{ getPaymentFormat(formData.payment_type) }}</p>
            </div>

            <!-- Buy Button -->
            <button
              @click="buyCoin"
              :disabled="!isFormValid || isPurchasing"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPurchasing ? 'Processing...' : `Buy ${formData.euros}€` }}
            </button>
          </div>
        </div>

        <!-- Purchase History -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">Purchase History</h2>

            <div v-if="purchases.length === 0" class="text-center py-8">
              <p class="text-gray-500">No purchases yet. Start buying coins!</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Date</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Amount</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Coins</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Payment</th>
                    <th class="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="purchase in purchases" :key="purchase.id" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-gray-900">
                      {{ formatDate(purchase.purchase_datetime) }}
                    </td>
                    <td class="px-4 py-3 text-gray-900 font-semibold">
                      {{ purchase.euros }}€
                    </td>
                    <td class="px-4 py-3 text-yellow-900 font-semibold">
                      🪙 {{ purchase.coins }}
                    </td>
                    <td class="px-4 py-3 text-gray-700">
                      <span class="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                        {{ purchase.payment_type }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                        ✓ {{ purchase.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Summary -->
              <div class="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Purchases:</span>
                  <span class="font-semibold text-gray-900">{{ purchases.length }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Spent:</span>
                  <span class="font-semibold text-gray-900">{{ totalSpent }}€</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Coins Purchased:</span>
                  <span class="font-semibold text-yellow-900">🪙 {{ totalCoins }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { getErrorMessage, getValidationErrors } from '@/utils/errorHandler'

export default {
  name: 'CoinShopPage',
  data() {
    return {
      amounts: [5, 10, 25, 50, 100, 500],
      formData: {
        euros: 10,
        payment_type: 'MBWAY',
        payment_reference: '',
      },
      purchases: [],
      isPurchasing: false,
      errorMessage: '',
      successMessage: '',
      errors: {},
    }
  },
  computed: {
    user() {
      const authStore = useAuthStore()
      return authStore.user
    },
    isFormValid() {
      return (
        this.formData.euros &&
        this.formData.payment_type &&
        this.formData.payment_reference &&
        this.formData.payment_reference.length > 0
      )
    },
    totalSpent() {
      return this.purchases.reduce((sum, p) => sum + parseFloat(p.euros), 0).toFixed(2)
    },
    totalCoins() {
      return this.purchases.reduce((sum, p) => sum + p.coins, 0)
    },
  },
  mounted() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      this.$router.push('/login')
      return
    }
    this.loadPurchaseHistory()
  },
  methods: {
    async buyCoin() {
      this.errorMessage = ''
      this.successMessage = ''
      this.errors = {}
      this.isPurchasing = true

      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()

        const response = await apiStore.postBuyCoin({
          euros: this.formData.euros,
          payment_type: this.formData.payment_type,
          payment_reference: this.formData.payment_reference,
        })

        // Update user coins
        authStore.setUser({
          ...this.user,
          coins_balance: response.new_balance,
        })

        this.successMessage = `✓ Successfully purchased ${response.coins_purchased} coins for ${this.formData.euros}€!`
        
        // Reset form
        this.formData.payment_reference = ''

        // Reload history
        await this.loadPurchaseHistory()

        setTimeout(() => (this.successMessage = ''), 4000)
      } catch (error) {
        this.errors = getValidationErrors(error)
        this.errorMessage = getErrorMessage(error)
      } finally {
        this.isPurchasing = false
      }
    },

    async loadPurchaseHistory() {
      try {
        const apiStore = useAPIStore()
        const response = await apiStore.getCoinPurchaseHistory()
        this.purchases = response.purchases || []
      } catch (error) {
        console.error('Failed to load purchase history:', error)
      }
    },

    getPaymentHint(type) {
      const hints = {
        MBWAY: 'Portuguese mobile payment - 9 digits',
        VISA: 'Credit card - 16 digits',
        PAYPAL: 'Email address registered with PayPal',
        IBAN: '2 letters + 23 digits (Portuguese IBAN)',
        MB: 'Multibanco - Entity (5 digits) + Reference (9 digits)',
      }
      return hints[type] || ''
    },

    getPaymentFormat(type) {
      const formats = {
        MBWAY: 'Format: 912345678',
        VISA: 'Format: 4532015112830366',
        PAYPAL: 'Format: user@example.com',
        IBAN: 'Format: PT50003300000000000000000',
        MB: 'Format: 12345123456789 (14 digits total)',
      }
      return formats[type] || ''
    },

    getPaymentPlaceholder(type) {
      const placeholders = {
        MBWAY: '912345678',
        VISA: '4532015112830366',
        PAYPAL: 'your.email@example.com',
        IBAN: 'PT50003300000000000000000',
        MB: '12345123456789',
      }
      return placeholders[type] || 'Enter payment reference...'
    },

    getPaymentInputType(type) {
      return type === 'PAYPAL' ? 'email' : 'text'
    },

    formatDate(datetime) {
      const date = new Date(datetime)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>
