<template>
  <div class="app-container">
    <aside class="left-panel">
      <div class="toolbar-section">
        <Toolbar />
      </div>
      <div class="template-section">
        <TemplatePanel />
      </div>
      <div class="data-section">
        <DataPanel />
      </div>
    </aside>
    <main class="canvas-area">
      <GraphCanvas />
    </main>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import { graph, addNode, removeNode, addEdge, removeEdge, toggleDirected, clearGraph, applyRepulsion } from './composables/useGraph'
import Toolbar from './components/Toolbar.vue'
import TemplatePanel from './components/TemplatePanel.vue'
import GraphCanvas from './components/GraphCanvas.vue'
import DataPanel from './components/DataPanel.vue'

provide('graph', graph)
provide('graphActions', {
  addNode, removeNode, addEdge, removeEdge, toggleDirected, clearGraph, applyRepulsion
})
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.left-panel {
  width: 320px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.toolbar-section {
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.template-section {
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.data-section {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.canvas-area {
  flex: 1;
  background: #e8f4f8; /* 浅蓝色背景，方便看出区域是否存在 */
  position: relative;
}
</style>