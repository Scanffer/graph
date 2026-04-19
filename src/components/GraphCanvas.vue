<template>
  <div ref="containerRef" class="graph-container">
    <svg ref="svgRef" width="100%" height="100%"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, inject } from 'vue'
import * as d3 from 'd3'

const containerRef = ref(null)
const svgRef = ref(null)

const graph = inject('graph')
const { addNode, addEdge, removeNode, removeEdge } = inject('graphActions')

let svg, g
let edgeSourceNode = null   // 连边起点 ID
let selectedNodeId = null   // 当前选中节点 ID
let selectedEdgeId = null   // 当前选中边 ID

onMounted(() => {
  initSVG()
  render()
  watch(() => [graph.nodes, graph.edges], render, { deep: true })
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(e) {
  if (e.key === 'Delete') {
    if (selectedEdgeId) {
      // 优先删除选中的边
      removeEdge(selectedEdgeId)
      selectedEdgeId = null
    } else if (selectedNodeId) {
      // 否则删除选中的节点
      removeNode(selectedNodeId)
      selectedNodeId = null
      edgeSourceNode = null
    }
    render()
  }
  if (e.key === 'Escape') {
    selectedNodeId = null
    selectedEdgeId = null
    edgeSourceNode = null
    render()
  }
}

function initSVG() {
  svg = d3.select(svgRef.value)
  g = svg.append('g')

  svg.on('click', (event) => {
    const target = event.target
    if (target.closest('.node-group')) return

    const [x, y] = d3.pointer(event)
    addNode(x, y)
  })

  svg.on('contextmenu', (event) => {
    event.preventDefault()
    const target = event.target
    if (!target.closest('.node-group') && !target.closest('.link-hot')) {
        // 右键空白：清除所有选中
        selectedNodeId = null
        selectedEdgeId = null
        edgeSourceNode = null
        render()
    }
  })
}

function handleNodeRightClick(nodeId) {
  // 选中节点，同时清除边选中
  selectedNodeId = nodeId
  selectedEdgeId = null

  if (edgeSourceNode === null) {
    edgeSourceNode = nodeId
  } else {
    if (edgeSourceNode !== nodeId) {
      addEdge(edgeSourceNode, nodeId, 0)
    }
    edgeSourceNode = null
  }
  render()
}

function handleEdgeRightClick(edgeId) {
  // 选中边，同时清除节点选中和连边状态
  selectedEdgeId = edgeId
  selectedNodeId = null
  edgeSourceNode = null
  render()
}

// 计算圆周上的点
function getEdgePoint(x1, y1, x2, y2, r) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return { x: x1, y: y1 }
  const offsetX = (dx / dist) * r
  const offsetY = (dy / dist) * r
  return { x: x1 + offsetX, y: y1 + offsetY }
}

function render() {
  // ========== 绘制节点 ==========
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

  nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`)

  // 节点高亮：选中节点或连边起点为橙色
  nodeGroups.select('circle')
    .attr('stroke', d => {
      if (d.id === selectedNodeId || d.id === edgeSourceNode) return '#ffaa00'
      return '#fff'
    })
    .attr('stroke-width', d => {
      if (d.id === selectedNodeId || d.id === edgeSourceNode) return 4
      return 2
    })

  nodeGroups.exit().remove()

  // ========== 绘制边 ==========
// 使用两组数据绑定：一组为视觉线（.link-visual），一组为热区线（.link-hot）

    // 热区线（透明粗线，响应事件）
    const hotLinks = g.selectAll('.link-hot').data(graph.edges, d => d.id)
    const enterHot = hotLinks.enter().append('line')
    .attr('class', 'link-hot')
    .attr('stroke', 'transparent')
    .attr('stroke-width', 12)
    .attr('pointer-events', 'stroke')  // 只响应描边区域
    .on('contextmenu', (event, d) => {
        event.preventDefault()
        event.stopPropagation()
        handleEdgeRightClick(d.id)
    })

    hotLinks.merge(enterHot)
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

    hotLinks.exit().remove()

    // 视觉线（细线，不响应事件）
    const visualLinks = g.selectAll('.link-visual').data(graph.edges, d => d.id)
    const enterVisual = visualLinks.enter().append('line')
    .attr('class', 'link-visual')
    .attr('stroke', '#999')
    .attr('stroke-width', 2)
    .attr('pointer-events', 'none')  // 让鼠标事件穿透，由热区处理

    visualLinks.merge(enterVisual)
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
    // 高亮时也改变视觉线的颜色（选中边）
    .attr('stroke', d => d.id === selectedEdgeId ? '#f00' : '#999')
    .attr('stroke-width', d => d.id === selectedEdgeId ? 4 : 2)

        visualLinks.exit().remove()
}

function updateEdges() {
  // 更新热区线
  g.selectAll('.link-hot')
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

  // 更新视觉线
  g.selectAll('.link-visual')
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
}
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
}
</style>