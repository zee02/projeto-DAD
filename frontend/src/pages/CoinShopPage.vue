<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-foreground">💰 Coin Shop</h1>
        <router-link to="/" class="text-primary hover:text-primary/80 font-semibold">
          ← Back
        </router-link>
      </div>

      <!-- Current Balance Card -->
      <div class="bg-card text-card-foreground rounded-lg shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted-foreground text-sm">Current Balance</p>
            <p class="text-3xl font-bold text-accent">🪙 {{ user?.coins_balance || 0 }} coins</p>
          </div>
          <div class="text-6xl opacity-20">💰</div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-4 p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded">
        {{ successMessage }}
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Buy Coins Form -->
        <div class="lg:col-span-1">
          <div class="bg-card text-card-foreground rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-bold text-card-foreground mb-6">Purchase Coins</h2>

            <!-- Amount Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-foreground mb-3">Select Amount</label>
              <div class="space-y-2">
                <button
                  v-for="amount in amounts"
                  :key="amount"
                  @click="formData.euros = amount"
                  :class="[
                    'w-full px-4 py-3 border-2 rounded-lg font-semibold transition',
                    formData.euros === amount
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:border-primary/50'
                  ]"
                >
                  {{ amount }}€ → {{ amount * 10 }} coins
                </button>
              </div>

              <!-- Custom Amount -->
              <div class="mt-3 pt-3 border-t border-border">
                <label class="block text-sm font-medium text-foreground mb-2">Or enter custom amount</label>
                <div class="flex gap-2">
                  <input
                    v-model.number="customAmount"
                    type="number"
                    min="1"
                    max="99"
                    placeholder="1-99€"
                    class="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-input text-foreground"
                    @keyup.enter="setCustomAmount"
                  />
                  <button
                    @click="setCustomAmount"
                    class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-lg transition"
                  >
                    Set
                  </button>
                </div>
                <p v-if="customAmount" class="mt-2 text-sm text-muted-foreground">
                  {{ customAmount }}€ → {{ customAmount * 10 }} coins
                </p>
                <p v-if="customAmountError" class="mt-2 text-sm text-destructive">{{ customAmountError }}</p>
              </div>

              <p v-if="errors.euros" class="mt-2 text-sm text-destructive">{{ formatError(errors.euros) }}</p>
            </div>

            <!-- Payment Type -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-foreground mb-3">Payment Method</label>
              <select
                v-model="formData.payment_type"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-input text-foreground"
              >
                <option value="">Select payment method...</option>
                <option value="MBWAY">MBWAY</option>
                <option value="VISA">VISA Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="IBAN">IBAN Transfer</option>
                <option value="MB">Multibanco</option>
              </select>
              <p class="text-xs text-muted-foreground mt-2">{{ getPaymentHint(formData.payment_type) }}</p>
              <p v-if="errors.payment_type" class="mt-2 text-sm text-destructive">{{ formatError(errors.payment_type) }}</p>
            </div>

            <!-- Payment Reference -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-foreground mb-1">Payment Reference</label>
              <input
                v-model="formData.payment_reference"
                :type="getPaymentInputType(formData.payment_type)"
                :placeholder="getPaymentPlaceholder(formData.payment_type)"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-input text-foreground"
              />
              <p class="text-xs text-muted-foreground mt-1">{{ getPaymentFormat(formData.payment_type) }}</p>
              <p v-if="errors.payment_reference" class="mt-1 text-sm text-destructive">{{ formatError(errors.payment_reference) }}</p>
            </div>

            <!-- Buy Button -->
            <button
              @click="buyCoin"
              :disabled="!isFormValid || isPurchasing"
              class="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPurchasing ? 'Processing...' : `Buy ${formData.euros}€` }}
            </button>
          </div>
        </div>

        <!-- Purchase History -->
        <div class="lg:col-span-2">
          <div class="bg-card text-card-foreground rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-bold text-card-foreground mb-6">Purchase History</h2>

            <div v-if="purchases.length === 0" class="text-center py-8">
              <p class="text-muted-foreground">No purchases yet. Start buying coins!</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted/50 border-b border-border">
                  <tr>
                    <th class="px-4 py-2 text-left font-semibold text-foreground">Date</th>
                    <th class="px-4 py-2 text-left font-semibold text-foreground">Amount</th>
                    <th class="px-4 py-2 text-left font-semibold text-foreground">Coins</th>
                    <th class="px-4 py-2 text-left font-semibold text-foreground">Payment</th>
                    <th class="px-4 py-2 text-left font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-for="purchase in purchases" :key="purchase.id" class="hover:bg-muted/50">
                    <td class="px-4 py-3 text-foreground">
                      {{ formatDate(purchase.purchase_datetime) }}
                    </td>
                    <td class="px-4 py-3 text-foreground font-semibold">
                      {{ purchase.euros }}€
                    </td>
                    <td class="px-4 py-3 text-accent font-semibold">
                      🪙 {{ purchase.coins }}
                    </td>
                    <td class="px-4 py-3 text-muted-foreground">
                      <span class="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded border border-border">
                        {{ purchase.payment_type }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-block bg-secondary/20 text-secondary text-xs px-2 py-1 rounded border border-secondary/30">
                        ✓ {{ purchase.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Summary -->
              <div class="mt-6 pt-4 border-t border-border space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Total Purchases:</span>
                  <span class="font-semibold text-foreground">{{ purchases.length }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Total Spent:</span>
                  <span class="font-semibold text-foreground">{{ totalSpent }}€</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Total Coins Purchased:</span>
                  <span class="font-semibold text-accent">🪙 {{ totalCoins }}</span>
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
      amounts: [5, 10, 25, 50, 99],
      customAmount: null,
      customAmountError: '',
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
        Number.isInteger(this.formData.euros) &&
        this.formData.euros >= 1 &&
        this.formData.euros <= 99 &&
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
    // Admins cannot access coin shop
    if (authStore.user?.type === 'A') {
      this.$router.push('/')
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

      const authStore = useAuthStore()
      // Store previous balance in case we need to revert on error
      const previousBalance = this.user?.coins_balance ?? 0

      try {
        const apiStore = useAPIStore()

        const response = await apiStore.postBuyCoin({
          euros: this.formData.euros,
          payment_type: this.formData.payment_type,
          payment_reference: this.formData.payment_reference,
        })

        // Update user coins with fresh balance from server
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
        
        // Revert to previous balance on error to prevent accumulation
        authStore.setUser({
          ...this.user,
          coins_balance: previousBalance,
        })
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
      return date.toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    formatError(err) {
      if (!err) return ''
      return Array.isArray(err) ? err[0] : err
    },

    setCustomAmount() {
      this.customAmountError = ''
      const amount = this.customAmount

      if (amount === null || amount === undefined || amount === '') {
        this.customAmountError = 'Please enter an amount'
        return
      }

      if (!Number.isInteger(amount)) {
        this.customAmountError = 'Amount must be a whole number (no decimals)'
        return
      }

      if (amount < 1) {
        this.customAmountError = 'Minimum amount is €1'
        return
      }

      if (amount > 99) {
        this.customAmountError = 'Maximum amount is €99'
        return
      }

      // Valid custom amount, set it
      this.formData.euros = amount
      this.customAmount = null
      this.customAmountError = ''
    },
  },
}
</script>
