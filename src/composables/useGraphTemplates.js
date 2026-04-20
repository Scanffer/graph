import { nanoid } from 'nanoid'

function resetGraph(graph) {
  graph.nodes = []
  graph.edges = []
}

function createNode(label, x, y) {
  return {
    id: nanoid(6),
    label: String(label),
    weight: 0,
    tag: '',
    x,
    y
  }
}

function createEdge(sourceId, targetId) {
  return {
    id: nanoid(6),
    source: sourceId,
    target: targetId,
    weight: 0,
    tag: ''
  }
}

function generateSimple(graph, applyRepulsion) {
  resetGraph(graph)

  const nodeCount = Math.floor(Math.random() * 6) + 3
  for (let i = 1; i <= nodeCount; i++) {
    graph.nodes.push(createNode(i, Math.random() * 380 + 220, Math.random() * 360 + 80))
  }

  const possibleEdges = []
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      possibleEdges.push([i, j])
    }
  }

  const maxEdges = Math.floor(possibleEdges.length * 0.5)
  const edgeCount = Math.floor(Math.random() * maxEdges) + 1
  for (let i = 0; i < edgeCount && possibleEdges.length > 0; i++) {
    const idx = Math.floor(Math.random() * possibleEdges.length)
    const [u, v] = possibleEdges[idx]
    graph.edges.push(createEdge(graph.nodes[u].id, graph.nodes[v].id))
    possibleEdges.splice(idx, 1)
  }

  applyRepulsion()
}

function generateTree(graph) {
  resetGraph(graph)

  const nodeCount = Math.floor(Math.random() * 6) + 4
  const parents = [null]
  for (let i = 1; i < nodeCount; i++) {
    parents[i] = Math.floor(Math.random() * i)
  }

  const children = Array.from({ length: nodeCount }, () => [])
  for (let i = 1; i < nodeCount; i++) {
    children[parents[i]].push(i)
  }

  for (let i = 0; i < nodeCount; i++) {
    graph.nodes.push(createNode(i + 1, 0, 0))
  }

  const baseY = 60
  const levelGap = 100
  const width = 520
  const baseX = 160
  const nodeSpacing = 90
  const positions = Array(nodeCount).fill(0)
  const depth = Array(nodeCount).fill(0)
  let currentX = 0

  function dfs(u, d) {
    depth[u] = d
    const childList = children[u]
    if (childList.length === 0) {
      positions[u] = currentX
      currentX += nodeSpacing
      return
    }

    for (const v of childList) {
      dfs(v, d + 1)
    }

    const childXs = childList.map(v => positions[v])
    positions[u] = (Math.min(...childXs) + Math.max(...childXs)) / 2
  }

  dfs(0, 0)

  const minX = Math.min(...positions)
  const maxX = Math.max(...positions)
  const scale = maxX > minX ? width / (maxX - minX) : 1

  for (let i = 0; i < nodeCount; i++) {
    graph.nodes[i].x = baseX + (positions[i] - minX) * scale
    graph.nodes[i].y = baseY + depth[i] * levelGap
  }

  for (let i = 1; i < nodeCount; i++) {
    graph.edges.push(createEdge(graph.nodes[parents[i]].id, graph.nodes[i].id))
  }
}

function generateDAG(graph) {
  resetGraph(graph)

  const nodeCount = Math.floor(Math.random() * 6) + 4
  for (let i = 0; i < nodeCount; i++) {
    graph.nodes.push(createNode(i + 1, 0, 0))
  }

  const edgeProbability = 0.35
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < edgeProbability) {
        graph.edges.push(createEdge(graph.nodes[i].id, graph.nodes[j].id))
      }
    }
  }

  if (graph.edges.length === 0) {
    for (let i = 1; i < nodeCount; i++) {
      graph.edges.push(createEdge(graph.nodes[i - 1].id, graph.nodes[i].id))
    }
  }

  const indexById = graph.nodes.reduce((map, node, idx) => {
    map[node.id] = idx
    return map
  }, {})

  const inDegree = Array(nodeCount).fill(0)
  const children = Array.from({ length: nodeCount }, () => [])
  for (const edge of graph.edges) {
    const sourceIndex = indexById[edge.source]
    const targetIndex = indexById[edge.target]
    if (sourceIndex >= 0 && targetIndex >= 0) {
      children[sourceIndex].push(targetIndex)
      inDegree[targetIndex]++
    }
  }

  const queue = []
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) queue.push(i)
  }

  const topoOrder = []
  while (queue.length) {
    const u = queue.shift()
    topoOrder.push(u)
    for (const v of children[u]) {
      inDegree[v]--
      if (inDegree[v] === 0) queue.push(v)
    }
  }

  const layer = Array(nodeCount).fill(0)
  for (const u of topoOrder) {
    for (const v of children[u]) {
      layer[v] = Math.max(layer[v], layer[u] + 1)
    }
  }

  const levels = {}
  for (const u of topoOrder) {
    const l = layer[u]
    if (!levels[l]) levels[l] = []
    levels[l].push(u)
  }

  const baseX = 120
  const layerGap = 140
  const width = 520
  const baseY = 120

  Object.keys(levels).forEach((key) => {
    const l = Number(key)
    const nodesAtLevel = levels[l]
    const count = nodesAtLevel.length
    const spacing = width / (count + 1)
    nodesAtLevel.forEach((nodeIndex, idx) => {
      graph.nodes[nodeIndex].x = baseX + l * layerGap
      graph.nodes[nodeIndex].y = baseY + spacing * (idx + 1)
    })
  })
}

function generateBipartite(graph) {
  resetGraph(graph)

  const leftCount = Math.floor(Math.random() * 3) + 3
  const rightCount = Math.floor(Math.random() * 3) + 3
  const totalCount = leftCount + rightCount

  for (let i = 0; i < totalCount; i++) {
    graph.nodes.push(createNode(i + 1, 0, 0))
  }

  const leftX = 120
  const rightX = 460
  const height = 420
  const leftSpacing = height / (leftCount + 1)
  const rightSpacing = height / (rightCount + 1)

  for (let i = 0; i < leftCount; i++) {
    graph.nodes[i].x = leftX
    graph.nodes[i].y = leftSpacing * (i + 1)
  }

  for (let j = 0; j < rightCount; j++) {
    graph.nodes[leftCount + j].x = rightX
    graph.nodes[leftCount + j].y = rightSpacing * (j + 1)
  }

  const possibleEdges = []
  for (let i = 0; i < leftCount; i++) {
    for (let j = leftCount; j < totalCount; j++) {
      possibleEdges.push([i, j])
    }
  }

  const maxEdges = possibleEdges.length
  const edgeCount = Math.floor(Math.random() * Math.max(1, Math.floor(maxEdges * 0.6))) + 1

  for (let k = 0; k < edgeCount && possibleEdges.length > 0; k++) {
    const idx = Math.floor(Math.random() * possibleEdges.length)
    const [u, v] = possibleEdges[idx]
    graph.edges.push(createEdge(graph.nodes[u].id, graph.nodes[v].id))
    possibleEdges.splice(idx, 1)
  }
}

export function useGraphTemplates(graph, graphActions) {
  const { applyRepulsion } = graphActions

  return {
    generateSimple: () => generateSimple(graph, applyRepulsion),
    generateTree: () => generateTree(graph),
    generateDAG: () => generateDAG(graph),
    generateBipartite: () => generateBipartite(graph)
  }
}
