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

const graph = inject('graph')
const { addNode, addEdge } = inject('graphActions')

let svg, g
let edgeSourceNode = null  // 记录右键连边的起点 ID

onMounted(() => {
  initSVG()
  render()
  watch(() => [graph.nodes, graph.edges], render, { deep: true })
})

function initSVG() {
  svg = d3.select(svgRef.value)
  g = svg.append('g')

  // 左键点击空白添加节点
  svg.on('click', (event) => {
    const target = event.target
    if (target.closest('.node-group')) return

    const [x, y] = d3.pointer(event)
    addNode(x, y)
  })

  // 右键菜单：阻止浏览器默认菜单
  svg.on('contextmenu', (event) => {
    event.preventDefault()
  })
}

// 计算从圆心到圆周的点坐标
function getEdgePoint(x1, y1, x2, y2, r) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x: x1, y: y1 }
  const offsetX = (dx / dist) * r
  const offsetY = (dy / dist) * r
  return {
    x: x1 + offsetX,
    y: y1 + offsetY
  }
}


function render() {
  // 先处理节点组
  const nodeGroups = g.selectAll('.node-group').data(graph.nodes, d => d.id)

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
        // 拖拽时边会跟随（由 ticked 更新）
        updateEdges()
      })
    )
    .on('contextmenu', (event, d) => {
      event.preventDefault()
      event.stopPropagation()
      handleNodeRightClick(d.id)
    })

  enterGroups.append('circle')
    .attr('r', 18)
    .attr('fill', '#69b3a2')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  enterGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#ffffff')
    .attr('font-size', 14)
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .text(d => d.label)

  // 更新节点位置
  nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`)

  // 更新高亮样式
  nodeGroups.select('circle')
    .attr('stroke', d => d.id === edgeSourceNode ? '#ffaa00' : '#fff')
    .attr('stroke-width', d => d.id === edgeSourceNode ? 4 : 2)

  nodeGroups.exit().remove()

  // 处理边
// 处理边
const links = g.selectAll('.link').data(graph.edges, d => d.id)

links.enter().append('line')
  .attr('class', 'link')
  .attr('stroke', '#999')
  .attr('stroke-width', 2)
  .merge(links)
  .attr('x1', d => {
    const source = graph.nodes.find(n => n.id === d.source)
    const target = graph.nodes.find(n => n.id === d.target)
    if (!source || !target) return 0
    const pt = getEdgePoint(source.x, source.y, target.x, target.y, 18)
    return pt.x
  })
  .attr('y1', d => {
    const source = graph.nodes.find(n => n.id === d.source)
    const target = graph.nodes.find(n => n.id === d.target)
    if (!source || !target) return 0
    const pt = getEdgePoint(source.x, source.y, target.x, target.y, 18)
    return pt.y
  })
  .attr('x2', d => {
    const source = graph.nodes.find(n => n.id === d.source)
    const target = graph.nodes.find(n => n.id === d.target)
    if (!source || !target) return 0
    const pt = getEdgePoint(target.x, target.y, source.x, source.y, 18)
    return pt.x
  })
  .attr('y2', d => {
    const source = graph.nodes.find(n => n.id === d.source)
    const target = graph.nodes.find(n => n.id === d.target)
    if (!source || !target) return 0
    const pt = getEdgePoint(target.x, target.y, source.x, source.y, 18)
    return pt.y
  })

links.exit().remove()
}

function handleNodeRightClick(nodeId) {
  if (edgeSourceNode === null) {
    // 第一次右键：记录起点，高亮
    edgeSourceNode = nodeId
  } else {
    // 第二次右键：创建边
    const targetId = nodeId
    if (edgeSourceNode !== targetId) {
      addEdge(edgeSourceNode, targetId, 0)
    }
    // 清除高亮状态
    edgeSourceNode = null
  }
  // 重新渲染以更新高亮
  render()
}

function updateEdges() {
  g.selectAll('.link')
    .attr('x1', d => {
      const source = graph.nodes.find(n => n.id === d.source)
      return source ? source.x : 0
    })
    .attr('y1', d => {
      const source = graph.nodes.find(n => n.id === d.source)
      return source ? source.y : 0
    })
    .attr('x2', d => {
      const target = graph.nodes.find(n => n.id === d.target)
      return target ? target.x : 0
    })
    .attr('y2', d => {
      const target = graph.nodes.find(n => n.id === d.target)
      return target ? target.y : 0
    })
}
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
}
</style>