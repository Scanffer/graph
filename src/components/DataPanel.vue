<template>
  <div class="data-panel">
    <h3>节点列表</h3>
    <el-input
      v-model="nodesText"
      type="textarea"
      :rows="8"
      @blur="updateNodesFromText"
      placeholder="每行输入一个节点，格式 'label tag' 或 'label'，例如 '3 9'"
    />
    <h3>边列表</h3>
    <el-input
      v-model="edgesText"
      type="textarea"
      :rows="5"
      @blur="updateEdgesFromText"
      placeholder="每行输入一条边，如 '1 2' 或 '1 2 5'（可选边标签）"
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
  nodesText.value = graph.nodes.map(n => n.tag ? `${n.label} ${n.tag}` : `${n.label}`).join('\n')
}, { deep: true, immediate: true })

watch(() => graph.edges, () => {
  edgesText.value = graph.edges.map(e => {
    const u = graph.nodes.find(n => n.id === e.source)?.label
    const v = graph.nodes.find(n => n.id === e.target)?.label
    return e.tag ? `${u} ${v} ${e.tag}` : `${u} ${v}`
  }).join('\n')
}, { deep: true, immediate: true })

function updateNodesFromText() {
  const lines = nodesText.value.split('\n').map(l => l.trim()).filter(l => l)
  const labelMap = new Map()

  for (const line of lines) {
    const parts = line.split(/\s+/)
    const label = parts[0]
    if (!label) continue
    const tag = parts.slice(1).join(' ').trim()
    if (!labelMap.has(label)) {
      labelMap.set(label, tag)
    }
  }

  const keepLabels = new Set(labelMap.keys())
  graph.nodes = graph.nodes.filter(n => keepLabels.has(n.label))

  graph.nodes.forEach(node => {
    node.tag = labelMap.get(node.label) ?? ''
  })

  for (const [label, tag] of labelMap.entries()) {
    if (!graph.nodes.some(n => n.label === label)) {
      const x = Math.random() * 400 + 50
      const y = Math.random() * 400 + 50
      graph.nodes.push({
        id: nanoid(6),
        label,
        weight: 0,
        tag,
        x,
        y
      })
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
        const tag = parts.slice(2).join(' ').trim()
        const exists = newEdges.some(e => e.source === sourceNode.id && e.target === targetNode.id)
        if (!exists) {
          newEdges.push({
            id: nanoid(6),
            source: sourceNode.id,
            target: targetNode.id,
            weight: 0,
            tag
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