<template>
  <div class="template-panel">
    <h3>模板图</h3>
    <div class="button-group">
      <el-button @click="generateSimple" size="small">简单图</el-button>
      <el-button @click="generateTree" size="small">树</el-button>
      <el-button @click="generateDAG" size="small">DAG</el-button>
      <el-button @click="generateBipartite" size="small">二分图</el-button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useGraphTemplates } from '../composables/useGraphTemplates'

const graph = inject('graph')
const graphActions = inject('graphActions')
const { generateSimple, generateTree, generateDAG, generateBipartite } = useGraphTemplates(graph, graphActions)
</script>

<style scoped>
.template-panel {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  background: white;
}
h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
}
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
