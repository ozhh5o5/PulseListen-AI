// ─── Zero-Shot Novel Adverse Event Detection Engine ───
// Simulates semantic embedding + novelty clustering for undocumented side effects

export interface NoveltyResult {
  noveltyScore: number       // 0-1, how "novel" this mention is
  isNovelSignal: boolean     // true if it doesn't match known MedDRA terms
  clusterLabel: string | null  // group label if part of emerging cluster
  knownTermMatch: string | null  // matched MedDRA term if known
}

// Known MedDRA adverse event terms (subset for simulation)
const KNOWN_MEDDRA_TERMS = [
  'headache', 'nausea', 'vomiting', 'diarrhea', 'constipation',
  'dizziness', 'fatigue', 'insomnia', 'rash', 'itching',
  'cough', 'fever', 'pain', 'swelling', 'bleeding',
  'anxiety', 'depression', 'tremor', 'palpitations', 'breathlessness',
  'chest pain', 'abdominal pain', 'back pain', 'joint pain',
  'blurred vision', 'tinnitus', 'weight gain', 'weight loss',
  'edema', 'hypertension', 'hypotension', 'tachycardia',
  'anemia', 'neutropenia', 'thrombocytopenia', 'hepatotoxicity',
  'nephrotoxicity', 'myalgia', 'arthralgia', 'alopecia',
  'photosensitivity', 'dry mouth', 'excessive sweating'
]

// Novel symptom patterns that are NOT in standard MedDRA
const NOVEL_SYMPTOM_PATTERNS = [
  { pattern: 'brain fog', cluster: 'Cognitive Impairment Cluster' },
  { pattern: 'metallic taste', cluster: 'Sensory Disturbance Cluster' },
  { pattern: 'electric shock', cluster: 'Neurological Novelty Cluster' },
  { pattern: 'skin burning', cluster: 'Dermal Novelty Cluster' },
  { pattern: 'phantom smell', cluster: 'Sensory Disturbance Cluster' },
  { pattern: 'memory loss', cluster: 'Cognitive Impairment Cluster' },
  { pattern: 'muscle twitching', cluster: 'Neurological Novelty Cluster' },
  { pattern: 'food taste change', cluster: 'Sensory Disturbance Cluster' },
  { pattern: 'tingling sensation', cluster: 'Neurological Novelty Cluster' },
  { pattern: 'vivid dreams', cluster: 'Sleep Disturbance Cluster' },
  { pattern: 'night sweats', cluster: 'Thermoregulation Cluster' },
  { pattern: 'cold extremities', cluster: 'Circulatory Novelty Cluster' },
  { pattern: 'pressure behind eyes', cluster: 'Ophthalmic Novelty Cluster' },
  { pattern: 'restless legs', cluster: 'Neurological Novelty Cluster' },
  { pattern: 'jaw clenching', cluster: 'Motor Novelty Cluster' },
  { pattern: 'emotional numbness', cluster: 'Psychiatric Novelty Cluster' },
  { pattern: 'feeling detached', cluster: 'Psychiatric Novelty Cluster' },
]

export function analyzeNovelty(text: string, isAdverseEvent: boolean): NoveltyResult {
  if (!isAdverseEvent) {
    return {
      noveltyScore: 0,
      isNovelSignal: false,
      clusterLabel: null,
      knownTermMatch: null
    }
  }

  const lowerText = text.toLowerCase()

  // Check for known MedDRA term matches
  const knownMatch = KNOWN_MEDDRA_TERMS.find(term => lowerText.includes(term))

  // Check for novel patterns
  const novelMatch = NOVEL_SYMPTOM_PATTERNS.find(p => lowerText.includes(p.pattern))

  if (novelMatch) {
    return {
      noveltyScore: 0.75 + Math.random() * 0.2, // 0.75-0.95
      isNovelSignal: true,
      clusterLabel: novelMatch.cluster,
      knownTermMatch: knownMatch || null
    }
  }

  if (knownMatch) {
    return {
      noveltyScore: 0.1 + Math.random() * 0.2, // 0.1-0.3
      isNovelSignal: false,
      clusterLabel: null,
      knownTermMatch: knownMatch
    }
  }

  // Ambiguous case — might be novel
  const hasSymptomKeywords = ['feel', 'experience', 'notice', 'develop', 'started', 'suddenly'].some(
    w => lowerText.includes(w)
  )

  if (hasSymptomKeywords) {
    return {
      noveltyScore: 0.4 + Math.random() * 0.3, // 0.4-0.7
      isNovelSignal: Math.random() > 0.5,
      clusterLabel: Math.random() > 0.5 ? 'Unclassified Emerging Signal' : null,
      knownTermMatch: null
    }
  }

  return {
    noveltyScore: 0.15 + Math.random() * 0.15,
    isNovelSignal: false,
    clusterLabel: null,
    knownTermMatch: null
  }
}

export function getNovelClusters(mentions: Array<{ clusterLabel: string | null; noveltyScore: number; id: string }>): Record<string, { count: number; avgScore: number; mentionIds: string[] }> {
  const clusters: Record<string, { count: number; totalScore: number; mentionIds: string[] }> = {}

  for (const m of mentions) {
    if (m.clusterLabel) {
      if (!clusters[m.clusterLabel]) {
        clusters[m.clusterLabel] = { count: 0, totalScore: 0, mentionIds: [] }
      }
      clusters[m.clusterLabel].count++
      clusters[m.clusterLabel].totalScore += m.noveltyScore
      clusters[m.clusterLabel].mentionIds.push(m.id)
    }
  }

  const result: Record<string, { count: number; avgScore: number; mentionIds: string[] }> = {}
  for (const [label, data] of Object.entries(clusters)) {
    result[label] = {
      count: data.count,
      avgScore: data.totalScore / data.count,
      mentionIds: data.mentionIds
    }
  }

  return result
}
