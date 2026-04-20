<template>
  <div ref="containerRef" class="graph-container">
    <svg ref="svgRef" width="100%" height="100%"></svg>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useGraphCanvas } from '../composables/useGraphCanvas'

const graph = inject('graph')
const graphActions = inject('graphActions')
const { containerRef, svgRef } = useGraphCanvas(graph, graphActions)
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
}
</style>