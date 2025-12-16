<template>
  <div :class="['p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md', props.class]">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-slate-600 mb-1">{{ label }}</p>
        <p class="text-3xl font-bold text-slate-900">{{ value }}</p>
      </div>
      <div class="text-4xl opacity-60">{{ icon }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
</style>
