import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'

export function useGraphCanvas(graph, graphActions) {
  const containerRef = ref(null)
  const svgRef = ref(null)

  const { addNode, addEdge, removeNode, removeEdge, applyRepulsion } = graphActions

  let svg
  let g
  let edgeSourceNode = null
  let selectedNodeId = null
  let selectedEdgeId = null

  function getEdgePoint(x1, y1, x2, y2, r) {
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return { x: x1, y: y1 }
    const offsetX = (dx / dist) * r
    const offsetY = (dy / dist) * r
    return { x: x1 + offsetX, y: y1 + offsetY }
  }

  function resolveEdgeCoords(edge) {
    const source = graph.nodes.find(node => node.id === edge.source)
    const target = graph.nodes.find(node => node.id === edge.target)
    if (!source || !target) return null

    const start = getEdgePoint(source.x, source.y, target.x, target.y, 18)
    const end = getEdgePoint(target.x, target.y, source.x, source.y, 18)
    return {
      source,
      target,
      start,
      end,
      mid: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      }
    }
  }

  function handleNodeRightClick(nodeId) {
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
    selectedEdgeId = edgeId
    selectedNodeId = null
    edgeSourceNode = null
    render()
  }

  function handleKeyDown(event) {
    if (event.key === 'Delete') {
      if (selectedEdgeId) {
        removeEdge(selectedEdgeId)
        selectedEdgeId = null
      } else if (selectedNodeId) {
        removeNode(selectedNodeId)
        selectedNodeId = null
        edgeSourceNode = null
      }
      render()
    }

    if (event.key === 'Escape') {
      selectedNodeId = null
      selectedEdgeId = null
      edgeSourceNode = null
      render()
    }
  }

  function initSVG() {
    svg = d3.select(svgRef.value)
    g = svg.append('g')

    const defs = svg.append('defs')
    const arrow = defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 6)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')

    defs.append('marker')
      .attr('id', 'arrowhead-selected')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 6)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#f00')

    svg.on('click', (event) => {
      const target = event.target
      if (target.closest('.node-group')) return

      if (!graph.enableAddNode) return

      const [x, y] = d3.pointer(event)
      addNode(x, y)
      applyRepulsion()
    })

    svg.on('contextmenu', (event) => {
      event.preventDefault()
      const target = event.target
      if (!target.closest('.node-group') && !target.closest('.link-hot')) {
        selectedNodeId = null
        selectedEdgeId = null
        edgeSourceNode = null
        render()
      }
    })
  }

  function updateLinkSelection(link) {
    return link.id === selectedEdgeId ? '#f00' : '#999'
  }

  function updateEdges() {
    g.selectAll('.link-hot')
      .attr('x1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.x : 0
      })
      .attr('y1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.y : 0
      })
      .attr('x2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.x : 0
      })
      .attr('y2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.y : 0
      })

    g.selectAll('.link-visual')
      .attr('x1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.x : 0
      })
      .attr('y1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.y : 0
      })
      .attr('x2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.x : 0
      })
      .attr('y2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.y : 0
      })
      .attr('marker-end', d => graph.directed ? (d.id === selectedEdgeId ? 'url(#arrowhead-selected)' : 'url(#arrowhead)') : null)

    g.selectAll('.link-label')
      .attr('x', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.mid.x : 0
      })
      .attr('y', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.mid.y : 0
      })
      .text(d => d.tag || '')
  }

  function render() {
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
        .on('end', () => {
          applyRepulsion()
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
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => d.label)

    enterGroups.append('text')
      .attr('class', 'node-tag')
      .attr('text-anchor', 'middle')
      .attr('dy', '2.8em')
      .attr('fill', '#333')
      .attr('font-size', 10)
      .attr('pointer-events', 'none')
      .text(d => d.tag || '')

    nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`)

    nodeGroups.select('.node-label')
      .text(d => d.label)

    nodeGroups.select('.node-tag')
      .text(d => d.tag || '')

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

    const hotLinks = g.selectAll('.link-hot').data(graph.edges, d => d.id)
    const enterHot = hotLinks.enter().append('line')
      .attr('class', 'link-hot')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 12)
      .attr('pointer-events', 'stroke')
      .on('contextmenu', (event, d) => {
        event.preventDefault()
        event.stopPropagation()
        handleEdgeRightClick(d.id)
      })

    hotLinks.merge(enterHot)
      .attr('x1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.x : 0
      })
      .attr('y1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.y : 0
      })
      .attr('x2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.x : 0
      })
      .attr('y2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.y : 0
      })

    hotLinks.exit().remove()

    const visualLinks = g.selectAll('.link-visual').data(graph.edges, d => d.id)
    const enterVisual = visualLinks.enter().append('line')
      .attr('class', 'link-visual')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('pointer-events', 'none')

    visualLinks.merge(enterVisual)
      .attr('x1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.x : 0
      })
      .attr('y1', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.start.y : 0
      })
      .attr('x2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.x : 0
      })
      .attr('y2', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.end.y : 0
      })
      .attr('marker-end', d => graph.directed ? (d.id === selectedEdgeId ? 'url(#arrowhead-selected)' : 'url(#arrowhead)') : null)
      .attr('stroke', d => updateLinkSelection(d))
      .attr('stroke-width', d => d.id === selectedEdgeId ? 4 : 2)

    visualLinks.exit().remove()

    const labelLinks = g.selectAll('.link-label').data(graph.edges, d => d.id)
    const enterLabel = labelLinks.enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.35em')
      .attr('fill', '#333')
      .attr('font-size', 10)
      .attr('pointer-events', 'none')

    labelLinks.merge(enterLabel)
      .attr('x', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.mid.x : 0
      })
      .attr('y', d => {
        const coords = resolveEdgeCoords(d)
        return coords ? coords.mid.y : 0
      })
      .text(d => d.tag || '')

    labelLinks.exit().remove()
  }

  onMounted(() => {
    initSVG()
    render()
    watch(() => graph.nodes, render, { deep: true })
    watch(() => graph.edges, render, { deep: true })
    watch(() => graph.directed, render)
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    containerRef,
    svgRef
  }
}
