<template>
  <div class="toolbar">
    <div class="toolbar-item">
      <span>图类型：</span>
      <el-switch
        v-model="graph.directed"
        active-text="有向"
        inactive-text="无向"
      />
    </div>
    <div class="toolbar-item">
      <span>新建点：</span>
      <el-switch
        v-model="graph.enableAddNode"
        active-text="启用"
        inactive-text="禁用"
      />
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const graph = inject('graph')
const { toggleDirected } = inject('graphActions')
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
.toolbar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>