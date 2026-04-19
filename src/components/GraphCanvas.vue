<template>
  <div ref="containerRef" class="graph-container">
    <svg ref="svgRef" width="100%" height="100%"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, inject } from 'vue'
import * as d3 from 'd3'

const containerRef = ref(null)
const svgRef = ref(null)

// 从父组件注入全局状态（必须！）
const graph = inject('graph')
const { addNode } = inject('graphActions')

let svg, g

onMounted(() => {
  initSVG()
  render()
  // 监听节点变化重新渲染
  watch(() => graph.nodes, render, { deep: true })
})

function initSVG() {
  svg = d3.select(svgRef.value)
  g = svg.append('g')

  // 左键点击空白添加节点
  svg.on('click', (event) => {
    const target = event.target
    if (target.closest('.node-group')) return  // 点击节点时不添加

    const [x, y] = d3.pointer(event)
    addNode(x, y)
  })
}

function render() {
  // 绑定数据到节点组
  const nodeGroups = g.selectAll('.node-group').data(graph.nodes, d => d.id)

  // 新进入的节点
  const enterGroups = nodeGroups.enter().append('g')
    .attr('class', 'node-group')
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .call(d3.drag()
      .on('drag', (event, d) => {
        d.x = event.x
        d.y = event.y
        d3.selectAll('.node-group')
          .filter(node => node.id === d.id)
          .attr('transform', `translate(${d.x}, ${d.y})`)
      })
    )

  // 添加圆形
  enterGroups.append('circle')
    .attr('r', 18)
    .attr('fill', '#69b3a2')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // 添加数字标签
  enterGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#ffffff')
    .attr('font-size', 14)
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .text(d => d.label)

  // 更新已存在节点的位置
  nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`)

  // 删除离开的节点
  nodeGroups.exit().remove()
}
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
}
</style>