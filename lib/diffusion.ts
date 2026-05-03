// ─── Temporal Graph Diffusion Engine ───
// Simulates signal propagation analysis to distinguish genuine outbreaks from misinformation

export interface DiffusionNode {
  id: string
  label: string
  type: 'source' | 'amplifier' | 'receiver'
  timestamp: number
  x: number
  y: number
}

export interface DiffusionEdge {
  from: string
  to: string
  weight: number
}

export interface DiffusionResult {
  label: 'VERIFIED_CLUSTER' | 'MISINFORMATION_FLAG' | 'UNDER_REVIEW'
  confidence: number
  spreadPattern: 'organic' | 'bot_amplified' | 'mixed'
  uniqueSources: number
  geoClusters: number
  diffusionSpeed: 'slow' | 'moderate' | 'rapid'
  reasoning: string
  nodes: DiffusionNode[]
  edges: DiffusionEdge[]
}

// Simulate organic spread: many sources, slow burn, geographic clusters
function generateOrganicGraph(signalId: string): { nodes: DiffusionNode[]; edges: DiffusionEdge[] } {
  const nodeCount = 8 + Math.floor(Math.random() * 12)
  const nodes: DiffusionNode[] = []
  const edges: DiffusionEdge[] = []

  // Seed node
  nodes.push({
    id: `${signalId}-0`,
    label: 'Patient Report',
    type: 'source',
    timestamp: 0,
    x: 400 + (Math.random() - 0.5) * 100,
    y: 300 + (Math.random() - 0.5) * 100
  })

  for (let i = 1; i < nodeCount; i++) {
    const isSource = Math.random() > 0.5
    const angle = (i / nodeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const radius = 100 + Math.random() * 250
    nodes.push({
      id: `${signalId}-${i}`,
      label: isSource ? `Source ${i}` : `Forum Post ${i}`,
      type: isSource ? 'source' : 'receiver',
      timestamp: i * (3600 + Math.floor(Math.random() * 7200)), // slow spread
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius
    })

    // Connect to random previous node (organic tree structure)
    const parent = Math.floor(Math.random() * i)
    edges.push({
      from: `${signalId}-${parent}`,
      to: `${signalId}-${i}`,
      weight: 0.3 + Math.random() * 0.7
    })
  }

  return { nodes, edges }
}

// Simulate bot spread: few sources, rapid amplification
function generateBotGraph(signalId: string): { nodes: DiffusionNode[]; edges: DiffusionEdge[] } {
  const nodeCount = 15 + Math.floor(Math.random() * 10)
  const nodes: DiffusionNode[] = []
  const edges: DiffusionEdge[] = []

  // 2-3 seed bot accounts
  const seedCount = 2 + Math.floor(Math.random() * 2)
  for (let i = 0; i < seedCount; i++) {
    nodes.push({
      id: `${signalId}-${i}`,
      label: `Bot Account ${i + 1}`,
      type: 'amplifier',
      timestamp: i * 60,
      x: 400 + (i - seedCount / 2) * 80,
      y: 150
    })
  }

  for (let i = seedCount; i < nodeCount; i++) {
    const angle = ((i - seedCount) / (nodeCount - seedCount)) * Math.PI * 2
    const radius = 150 + Math.random() * 200
    nodes.push({
      id: `${signalId}-${i}`,
      label: `Amplified ${i}`,
      type: 'receiver',
      timestamp: seedCount * 60 + (i - seedCount) * (30 + Math.floor(Math.random() * 120)), // rapid
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius
    })

    // All connect back to one of the seed bots (star topology)
    const seedParent = Math.floor(Math.random() * seedCount)
    edges.push({
      from: `${signalId}-${seedParent}`,
      to: `${signalId}-${i}`,
      weight: 0.8 + Math.random() * 0.2
    })
  }

  return { nodes, edges }
}

export function analyzeDiffusion(
  mentionId: string,
  signalType: string,
  authorHandle: string | null,
  sourceType: string
): DiffusionResult {
  // Deterministic seed from mentionId
  const hash = mentionId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const isBot = hash % 5 === 0 // ~20% flagged as misinfo
  const isMixed = hash % 7 === 0

  if (isBot) {
    const graph = generateBotGraph(mentionId)
    return {
      label: 'MISINFORMATION_FLAG',
      confidence: 0.72 + Math.random() * 0.2,
      spreadPattern: 'bot_amplified',
      uniqueSources: 2 + Math.floor(Math.random() * 2),
      geoClusters: 1,
      diffusionSpeed: 'rapid',
      reasoning: `Rapid amplification detected: ${graph.nodes.filter(n => n.type === 'amplifier').length} bot accounts identified. Star-topology spread pattern with high repost velocity.`,
      ...graph
    }
  }

  if (isMixed) {
    const graph = generateOrganicGraph(mentionId)
    return {
      label: 'UNDER_REVIEW',
      confidence: 0.45 + Math.random() * 0.2,
      spreadPattern: 'mixed',
      uniqueSources: 5 + Math.floor(Math.random() * 5),
      geoClusters: 2 + Math.floor(Math.random() * 2),
      diffusionSpeed: 'moderate',
      reasoning: `Mixed signal pattern: organic geographic clusters observed but some accounts show unusual amplification velocity. Requires manual review.`,
      ...graph
    }
  }

  const graph = generateOrganicGraph(mentionId)
  return {
    label: 'VERIFIED_CLUSTER',
    confidence: 0.78 + Math.random() * 0.18,
    spreadPattern: 'organic',
    uniqueSources: 8 + Math.floor(Math.random() * 10),
    geoClusters: 3 + Math.floor(Math.random() * 4),
    diffusionSpeed: 'slow',
    reasoning: `Organic diffusion confirmed: ${graph.nodes.filter(n => n.type === 'source').length} unique sources across ${3 + Math.floor(Math.random() * 4)} geographic clusters. Slow-burn spread pattern consistent with genuine patient reports.`,
    ...graph
  }
}
