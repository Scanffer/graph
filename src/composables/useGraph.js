// src/composables/useGraph.js
import { reactive, ref } from 'vue'
import { nanoid } from 'nanoid' // 需要安装：npm install nanoid

// 全局操作模式
export const mode = ref('select') // 'select' | 'addNode' | 'addEdge' | 'delete'

// 图的核心数据（响应式）
export const graph = reactive({
  directed: false,
  nodes: [],
  edges: []
})

// --- 节点操作 ---
export function addNode(x, y) {
  const newNode = {
    id: nanoid(6),        // 生成短唯一ID，如 "V1StGX"
    label: `Node ${graph.nodes.length + 1}`,
    weight: 0,
    x: x,
    y: y
  }
  graph.nodes.push(newNode)
  return newNode
}

export function removeNode(nodeId) {
  // 删除节点
  graph.nodes = graph.nodes.filter(n => n.id !== nodeId)
  // 同时删除与之相连的所有边
  graph.edges = graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
}

export function updateNode(nodeId, updates) {
  const node = graph.nodes.find(n => n.id === nodeId)
  if (node) Object.assign(node, updates)
}

// --- 边操作 ---
export function addEdge(sourceId, targetId, weight = 1) {
  // 检查是否已存在相同边（简单图约束示例）
  const exists = graph.edges.some(e => 
    (e.source === sourceId && e.target === targetId) ||
    (!graph.directed && e.source === targetId && e.target === sourceId)
  )
  if (exists) {
    console.warn('边已存在')
    return null
  }

  const newEdge = {
    id: nanoid(6),
    source: sourceId,
    target: targetId,
    weight: weight
  }
  graph.edges.push(newEdge)
  return newEdge
}

export function removeEdge(edgeId) {
  graph.edges = graph.edges.filter(e => e.id !== edgeId)
}

export function updateEdge(edgeId, updates) {
  const edge = graph.edges.find(e => e.id === edgeId)
  if (edge) Object.assign(edge, updates)
}

// --- 全局设置 ---
export function toggleDirected() {
  graph.directed = !graph.directed
  // 切换有向/无向时，通常需要清空边（因为语义变了）或者给出警告
  if (graph.edges.length > 0) {
    if (confirm('切换图的类型会清空所有边，确定吗？')) {
      graph.edges = []
    } else {
      graph.directed = !graph.directed // 撤销切换
    }
  }
}

export function clearGraph() {
  graph.nodes = []
  graph.edges = []
}