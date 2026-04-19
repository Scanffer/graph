<template>
  <div class="toolbar">
    <span>图类型：</span>
    <el-switch
      v-model="graph.directed"
      active-text="有向"
      inactive-text="无向"
    />
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
  align-items: center;
  gap: 10px;
  padding: 10px;
}
</style>