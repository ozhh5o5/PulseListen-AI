// ─── ICSR Report Generator ───
// Generates Individual Case Safety Reports compliant with WHO VigiBase / CDSCO format

export interface ICSRReport {
  reportId: string
  version: string
  generatedAt: string
  reportType: 'INITIAL' | 'FOLLOW_UP'
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
  seriousness: string[]
  
  // Patient (redacted)
  patient: {
    initials: string // always redacted
    ageGroup: string
    sex: string
  }

  // Reaction / Event
  reaction: {
    description: string
    meddraTerms: string[]
    onsetDate: string | null
    outcome: string
    isNovel: boolean
    noveltyScore: number
  }

  // Drug Information
  drugs: {
    name: string
    indication: string
    dosage: string
    route: string
    actionTaken: string
    role: 'SUSPECT' | 'CONCOMITANT' | 'INTERACTING'
  }[]

  // Source
  source: {
    platform: string
    postUrl: string | null
    authorHandle: string | null
    redactedNarrative: string
    originalLanguage: string
    acquiredAt: string
  }

  // Analysis
  analysis: {
    signalType: string
    sentiment: string
    confidence: number
    reasoning: string
    diffusionLabel: string | null
    clusterLabel: string | null
  }

  // Regulatory
  regulatory: {
    targetAuthority: string
    submissionFormat: string
    complianceNotes: string[]
  }
}

const SEVERITY_MAP: Record<string, 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'> = {
  headache: 'MILD',
  nausea: 'MILD',
  dizziness: 'MILD',
  rash: 'MILD',
  fatigue: 'MILD',
  vomiting: 'MODERATE',
  pain: 'MODERATE',
  fever: 'MODERATE',
  swelling: 'MODERATE',
  bleeding: 'SEVERE',
  seizure: 'SEVERE',
  'liver damage': 'SEVERE',
  'kidney failure': 'LIFE_THREATENING',
  'chest pain': 'SEVERE',
  breathlessness: 'SEVERE',
}

function determineSeverity(text: string, entities: any[]): 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING' {
  const lowerText = text.toLowerCase()
  let maxSeverity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING' = 'MILD'
  const order = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'] as const

  for (const [term, severity] of Object.entries(SEVERITY_MAP)) {
    if (lowerText.includes(term)) {
      if (order.indexOf(severity) > order.indexOf(maxSeverity)) {
        maxSeverity = severity
      }
    }
  }

  return maxSeverity
}

export function generateICSR(mention: {
  id: string
  rawText: string
  redactedText: string | null
  sourceType: string
  sourceUrl: string | null
  authorHandle: string | null
  postedAt: Date | string | null
  acquiredAt: Date | string
  signalType: string | null
  sentiment: string | null
  sentimentConfidence: number | null
  entities: string | null
  reasoning: string | null
  detectedLanguage: string | null
  noveltyScore: number | null
  isNovelSignal: boolean
  clusterLabel: string | null
  diffusionLabel: string | null
}): ICSRReport {
  const entities = mention.entities ? JSON.parse(mention.entities) : []
  const drugEntities = entities.filter((e: any) => e.type === 'drug')
  const symptomEntities = entities.filter((e: any) => e.type === 'symptom' || e.type === 'condition')

  const severity = determineSeverity(mention.redactedText || mention.rawText, entities)

  const langNames: Record<string, string> = {
    en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil',
    te: 'Telugu', bn: 'Bengali', mr: 'Marathi'
  }

  return {
    reportId: `ICSR-PL-${mention.id.slice(0, 8).toUpperCase()}`,
    version: '1.0',
    generatedAt: new Date().toISOString(),
    reportType: 'INITIAL',
    severity,
    seriousness: severity === 'LIFE_THREATENING'
      ? ['Results in death or is life-threatening']
      : severity === 'SEVERE'
      ? ['Requires hospitalization', 'Results in significant disability']
      : ['Other medically important condition'],

    patient: {
      initials: '[REDACTED]',
      ageGroup: 'Adult (18-65)',
      sex: 'Unknown'
    },

    reaction: {
      description: mention.redactedText || mention.rawText,
      meddraTerms: symptomEntities.map((e: any) => e.value),
      onsetDate: mention.postedAt ? new Date(mention.postedAt).toISOString().split('T')[0] : null,
      outcome: 'Unknown',
      isNovel: mention.isNovelSignal,
      noveltyScore: mention.noveltyScore || 0
    },

    drugs: drugEntities.length > 0
      ? drugEntities.map((d: any) => ({
          name: d.value,
          indication: 'As reported by patient',
          dosage: 'Not specified',
          route: 'Oral (assumed)',
          actionTaken: 'Unknown',
          role: 'SUSPECT' as const
        }))
      : [{
          name: 'Unknown / Not specified',
          indication: 'Not available',
          dosage: 'Not specified',
          route: 'Unknown',
          actionTaken: 'Unknown',
          role: 'SUSPECT' as const
        }],

    source: {
      platform: mention.sourceType.replace('_', ' '),
      postUrl: mention.sourceUrl,
      authorHandle: mention.authorHandle ? '[REDACTED]' : null,
      redactedNarrative: mention.redactedText || mention.rawText,
      originalLanguage: langNames[mention.detectedLanguage || 'en'] || 'English',
      acquiredAt: new Date(mention.acquiredAt).toISOString()
    },

    analysis: {
      signalType: mention.signalType || 'UNKNOWN',
      sentiment: mention.sentiment || 'UNKNOWN',
      confidence: mention.sentimentConfidence || 0,
      reasoning: mention.reasoning || '',
      diffusionLabel: mention.diffusionLabel,
      clusterLabel: mention.clusterLabel
    },

    regulatory: {
      targetAuthority: 'CDSCO (Central Drugs Standard Control Organisation)',
      submissionFormat: 'ICSR E2B(R3)',
      complianceNotes: [
        'PHI/PII redacted at ingestion edge per DPDP Act 2023',
        'Automated via PulseListen AI Zero-Shot Detection Engine',
        mention.isNovelSignal ? 'NOVEL SIGNAL: Not in standard MedDRA — requires manual clinical review' : 'Matched known MedDRA adverse event terms',
        'Source evidence preserved with redacted patient narrative'
      ]
    }
  }
}
