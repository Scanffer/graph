// src/composables/useGraph.js
import { reactive } from 'vue'
import { nanoid } from 'nanoid'

export const graph = reactive({
  directed: false,
  enableAddNode: true,
  nodes: [],
  edges: []
})

export function addNode(x, y) {
  const existingLabels = graph.nodes.map(n => parseInt(n.label)).filter(n => !isNaN(n))
  let nextLabel = 1
  while (existingLabels.includes(nextLabel)) {
    nextLabel++
  }
  const newNode = {
    id: nanoid(6),
    label: String(nextLabel),
    weight: 0,
    tag: '',
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

export function addEdge(sourceId, targetId, weight = 0, tag = '') {
  const exists = graph.edges.some(e =>
    (e.source === sourceId && e.target === targetId) ||
    (!graph.directed && e.source === targetId && e.target === sourceId)
  )
  if (exists) return null
  const newEdge = {
    id: nanoid(6),
    source: sourceId,
    target: targetId,
    weight,
    tag
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

export function applyRepulsion() {
  const minDistance = 80 // 最小距离，小于这个距离才产生斥力
  const repulsionForce = 30000 // 斥力强度
  const iterations = 20 // 迭代次数
  const damping = 0.85 // 阻尼系数
  
  const nodes = graph.nodes
  if (nodes.length < 2) return
  
  // 初始化速度
  const velocities = nodes.map(() => ({ vx: 0, vy: 0 }))
  
  for (let iter = 0; iter < iterations; iter++) {
    // 重置力
    const forces = nodes.map(() => ({ fx: 0, fy: 0 }))
    
    // 计算节点间的斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.1
        
        if (distance < minDistance) {
          const force = repulsionForce / (distance * distance)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          
          forces[i].fx -= fx
          forces[i].fy -= fy
          forces[j].fx += fx
          forces[j].fy += fy
        }
      }
    }
    
    // 更新速度和位置
    for (let i = 0; i < nodes.length; i++) {
      velocities[i].vx = (velocities[i].vx + forces[i].fx * 0.01) * damping
      velocities[i].vy = (velocities[i].vy + forces[i].fy * 0.01) * damping
      
      nodes[i].x += velocities[i].vx
      nodes[i].y += velocities[i].vy
    }
  }
}