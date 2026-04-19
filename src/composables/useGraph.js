// src/composables/useGraph.js
import { reactive } from 'vue'
import { nanoid } from 'nanoid'

export const graph = reactive({
  directed: false,
  nodes: [],
  edges: []
})

export function addNode(x, y) {
  const newNode = {
    id: nanoid(6),
    label: String(graph.nodes.length + 1),   // 改成纯数字字符串 "1", "2", ...
    weight: 0,
    x, y
  }
  graph.nodes.push(newNode)
  return newNode
}

// ... 其他方法（removeNode, addEdge, removeEdge等）暂时保留占位即可，我们后面再加
export function removeNode(nodeId) {
  graph.nodes = graph.nodes.filter(n => n.id !== nodeId)
  graph.edges = graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
}

export function addEdge(sourceId, targetId, weight = 0) {
  const exists = graph.edges.some(e =>
    (e.source === sourceId && e.target === targetId) ||
    (!graph.directed && e.source === targetId && e.target === sourceId)
  )
  if (exists) return null
  const newEdge = {
    id: nanoid(6),
    source: sourceId,
    target: targetId,
    weight
  }
  graph.edges.push(newEdge)
  return newEdge
}

export function removeEdge(edgeId) {
  graph.edges = graph.edges.filter(e => e.id !== edgeId)
}

export function clearGraph() {
  graph.nodes = []
  graph.edges = []
}

export function toggleDirected() {
  graph.directed = !graph.directed
}