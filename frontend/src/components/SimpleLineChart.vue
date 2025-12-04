<template>
  <div class="w-full relative">
    <svg ref="svg" :viewBox="viewBox" class="w-full h-48" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <!-- grid lines -->
      <g v-for="(x, i) in xPositions" :key="i">
        <line :x1="x" y1="0" :x2="x" :y2="h" stroke="#f3f4f6" stroke-width="0.5" />
      </g>

      <!-- area under curve -->
      <polygon v-if="pointsArray.length" :points="areaPoints" fill="rgba(59,130,246,0.08)" />

      <!-- line -->
      <polyline :points="points" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

      <!-- points -->
      <g v-for="(pt, i) in pointsArray" :key="i">
        <circle :cx="pt.x" :cy="pt.y" r="2.5" fill="#1e40af" />
      </g>

      <!-- hover: vertical line and tooltip circle -->
      <g v-if="hoverIndex !== null && pointsArray.length">
        <line :x1="pointsArray[hoverIndex].x" :y1="0" :x2="pointsArray[hoverIndex].x" :y2="h" stroke="#e6eefc" stroke-width="1" />
        <circle :cx="pointsArray[hoverIndex].x" :cy="pointsArray[hoverIndex].y" r="4" fill="#fff" stroke="#2563eb" stroke-width="1.5" />
        <g :transform="`translate(${tooltipX}, ${tooltipY})`">
          <rect x="0" y="0" width="120" height="42" rx="6" ry="6" fill="#111827" opacity="0.95" />
          <text x="8" y="18" fill="#fff" style="font-size:12px">{{ labels[hoverIndex] || '' }}</text>
          <text x="8" y="34" fill="#fff" style="font-size:14px" font-weight="600">{{ values[hoverIndex] }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  labels: { type: Array, default: () => [] },
  values: { type: Array, default: () => [] },
})

const svg = ref(null)
const hoverIndex = ref(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

const h = 200
const w = 800
const H_PAD = 20 // horizontal padding so first/last points aren't flush to edges
const viewBox = `0 0 ${w} ${h}`

const maxVal = computed(() => Math.max(...(props.values || [0]), 1))

const pointsArray = computed(() => {
  if (!props.values || !props.values.length) return []
  const usable = w - H_PAD * 2
  const step = usable / (props.values.length - 1 || 1)
  return props.values.map((v, i) => {
    const x = H_PAD + (i * step)
    const y = h - (v / maxVal.value) * (h - 30) - 10
    return { x, y, v }
  })
})

const points = computed(() => pointsArray.value.map(p => `${p.x},${p.y}`).join(' '))

const areaPoints = computed(() => {
  if (!pointsArray.value.length) return ''
  const first = pointsArray.value[0]
  const last = pointsArray.value[pointsArray.value.length - 1]
  const pts = pointsArray.value.map(p => `${p.x},${p.y}`).join(' ')
  return `${first.x},${h} ${pts} ${last.x},${h}`
})

const xPositions = computed(() => {
  if (!props.values) return []
  const usable = w - H_PAD * 2
  const step = usable / (props.values.length - 1 || 1)
  return props.values.map((_, i) => H_PAD + i * step)
})

function onMouseLeave() {
  hoverIndex.value = null
}

function onMouseMove(evt) {
  const el = svg.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = evt.clientX - rect.left
  // find nearest point by x
  let idx = 0
  let bestDist = Infinity
  pointsArray.value.forEach((p, i) => {
    const px = p.x * (rect.width / w)
    const d = Math.abs(px - x)
    if (d < bestDist) { bestDist = d; idx = i }
  })
  hoverIndex.value = idx
  const px = pointsArray.value[idx].x * (rect.width / w)
  const py = pointsArray.value[idx].y * (rect.height / h)
  const tooltipWidth = 120
  let tx = px + 8
  if (tx + tooltipWidth > rect.width) tx = rect.width - tooltipWidth - 8
  let ty = py - 50
  if (ty < 6) ty = py + 12
  tooltipX.value = (tx / rect.width) * w
  tooltipY.value = (ty / rect.height) * h
}

</script>

<style scoped>
</style>
