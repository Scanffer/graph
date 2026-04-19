<template>
  <div class="data-panel">
    <h3>节点列表</h3>
    <el-input
      v-model="nodesText"
      @blur="updateNodesFromText"
      placeholder="输入节点标签，用空格分隔"
    />
    <h3>边列表</h3>
    <el-input
      v-model="edgesText"
      type="textarea"
      :rows="5"
      @blur="updateEdgesFromText"
      placeholder="每行输入一条边，如 '1 2'"
    />
  </div>
</template>

<script setup>
import { inject, ref, watch } from 'vue'
import { nanoid } from 'nanoid'

const graph = inject('graph')
const { applyRepulsion } = inject('graphActions')

const nodesText = ref('')
const edgesText = ref('')

watch(() => graph.nodes, () => {
  nodesText.value = graph.nodes.map(n => n.label).join(' ')
}, { deep: true, immediate: true })

watch(() => graph.edges, () => {
  edgesText.value = graph.edges.map(e => {
    const u = graph.nodes.find(n => n.id === e.source)?.label
    const v = graph.nodes.find(n => n.id === e.target)?.label
    return `${u} ${v}`
  }).join('\n')
}, { deep: true, immediate: true })

function updateNodesFromText() {
  const labels = nodesText.value.split(/\s+/).filter(l => l.trim()).map(l => l.trim())
  const uniqueLabels = [...new Set(labels)]

  // 删除不在 uniqueLabels 的节点
  graph.nodes = graph.nodes.filter(n => uniqueLabels.includes(n.label))

  // 添加新的节点
  for (const label of uniqueLabels) {
    if (!graph.nodes.some(n => n.label === label)) {
      const x = Math.random() * 400 + 50
      const y = Math.random() * 400 + 50
      const newNode = {
        id: nanoid(6),
        label,
        weight: 0,
        x, y
      }
      graph.nodes.push(newNode)
    }
  }
  
  applyRepulsion()
}

function updateEdgesFromText() {
  const lines = edgesText.value.split('\n').map(l => l.trim()).filter(l => l)
  const newEdges = []

  for (const line of lines) {
    const parts = line.split(/\s+/)
    const u = parts[0]
    const v = parts[1]
    if (u && v) {
      const sourceNode = graph.nodes.find(n => n.label === u)
      const targetNode = graph.nodes.find(n => n.label === v)
      if (sourceNode && targetNode) {
        const exists = newEdges.some(e => e.source === sourceNode.id && e.target === targetNode.id)
        if (!exists) {
          newEdges.push({
            id: nanoid(6),
            source: sourceNode.id,
            target: targetNode.id,
            weight: 0
          })
        }
      }
    }
  }

  graph.edges = newEdges
}
</script>

<style scoped>
.data-panel {
  padding: 10px;
}
</style>