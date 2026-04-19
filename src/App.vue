<template>
  <div class="app-container">
    <!-- 左侧复合面板 -->
    <aside class="left-panel">
      <!-- 工具栏区域（上部） -->
      <div class="toolbar-section">
        <Toolbar />
      </div>
      <!-- 数据面板区域（下部，自动撑满） -->
      <div class="data-section">
        <DataPanel />
      </div>
    </aside>

    <!-- 中间画布区域 -->
    <main class="canvas-area">
      <GraphCanvas />
    </main>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import { graph, mode, addNode, removeNode, addEdge, removeEdge, toggleDirected, clearGraph } from './composables/useGraph'
import Toolbar from './components/Toolbar.vue'
import GraphCanvas from './components/GraphCanvas.vue'
import DataPanel from './components/DataPanel.vue'

provide('graph', graph)
provide('mode', mode)
provide('graphActions', {
  addNode,
  removeNode,
  addEdge,
  removeEdge,
  toggleDirected,
  clearGraph
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
  width: 320px; /* 可自行调整宽度 */
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar-section {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
  flex-shrink: 0; /* 工具栏高度由内容决定，不会被压缩 */
}

.data-section {
  flex: 1; /* 占据剩余所有高度 */
  padding: 16px;
  overflow-y: auto; /* 内容过多时滚动 */
}

.canvas-area {
  flex: 1;
  background: #ffffff;
  position: relative;
}
</style>