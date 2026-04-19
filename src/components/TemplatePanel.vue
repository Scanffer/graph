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
import { nanoid } from 'nanoid'

const graph = inject('graph')

function generateSimple() {
  // 清空图
  graph.nodes = []
  graph.edges = []
  
  // 随机生成 3-8 个节点
  const nodeCount = Math.floor(Math.random() * 6) + 3
  
  // 添加节点
  for (let i = 1; i <= nodeCount; i++) {
    const newNode = {
      id: nanoid(6),
      label: String(i),
      weight: 0,
      x: Math.random() * 400 + 50,
      y: Math.random() * 400 + 50
    }
    graph.nodes.push(newNode)
  }
  
  // 生成随机边（无重边无自环）
  const possibleEdges = []
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      possibleEdges.push([i, j])
    }
  }
  
  // 随机选择一些边（1-50% 的可能边）
  const maxEdges = Math.floor(possibleEdges.length * 0.5)
  const edgeCount = Math.floor(Math.random() * maxEdges) + 1
  
  for (let i = 0; i < edgeCount && possibleEdges.length > 0; i++) {
    const idx = Math.floor(Math.random() * possibleEdges.length)
    const [u, v] = possibleEdges[idx]
    const sourceNode = graph.nodes[u]
    const targetNode = graph.nodes[v]
    
    const newEdge = {
      id: nanoid(6),
      source: sourceNode.id,
      target: targetNode.id,
      weight: 0
    }
    graph.edges.push(newEdge)
    
    // 移除这条边以避免重复选择
    possibleEdges.splice(idx, 1)
  }
}

function generateTree() {
  // TODO: 实现树生成
}

function generateDAG() {
  // TODO: 实现 DAG 生成
}

function generateBipartite() {
  // TODO: 实现二分图生成
}
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
