// ─── Multilingual AI Analysis Engine ───
// Supports: English, Hindi, Kannada, Tamil, Telugu, Bengali, Marathi
// Uses keyword-based mock classification simulating IndicBERT + Zero-Shot

export interface AnalysisResult {
  signalType: 'ADVERSE_EVENT' | 'POSITIVE_EXPERIENCE' | 'QUESTION' | 'COMPLAINT' | 'NEUTRAL'
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'
  sentimentConfidence: number
  entities: { type: 'drug' | 'condition' | 'symptom' | 'provider'; value: string }[]
  isAdverseEvent: boolean
  reasoning: string
  detectedLanguage: string
}

// ─── Language Detection ───
const LANG_MARKERS: Record<string, RegExp> = {
  hi: /[\u0900-\u097F]/,     // Devanagari (Hindi/Marathi)
  kn: /[\u0C80-\u0CFF]/,     // Kannada
  ta: /[\u0B80-\u0BFF]/,     // Tamil
  te: /[\u0C00-\u0C7F]/,     // Telugu
  bn: /[\u0980-\u09FF]/,     // Bengali
}

const HINDI_WORDS = ['dawai', 'dawa', 'tablet', 'khane', 'baad', 'chakkar', 'dard', 'bukhar', 'ulti', 'khujli', 'sujan', 'sar', 'pet', 'kamzori', 'neend', 'thakan']
const MARATHI_WORDS = ['aushadh', 'goli', 'dukhat', 'taap', 'ulti', 'khaaj']

export function detectLanguage(text: string): string {
  for (const [lang, regex] of Object.entries(LANG_MARKERS)) {
    if (regex.test(text)) {
      if (lang === 'hi') {
        // Distinguish Hindi from Marathi
        const hasMarathi = MARATHI_WORDS.some(w => text.toLowerCase().includes(w))
        return hasMarathi ? 'mr' : 'hi'
      }
      return lang
    }
  }
  // Check romanized Hindi
  const hasHindiWords = HINDI_WORDS.some(w => text.toLowerCase().includes(w))
  if (hasHindiWords) return 'hi'
  return 'en'
}

// ─── Multilingual Keyword Banks ───
const ADVERSE_KEYWORDS: Record<string, string[]> = {
  en: ['headache', 'fever', 'rash', 'vomiting', 'dizziness', 'side effect', 'nausea', 'allergic', 'reaction', 'pain', 'bleeding', 'swelling', 'seizure', 'liver damage', 'kidney failure'],
  hi: ['dard', 'bukhar', 'chakkar', 'ulti', 'khujli', 'sujan', 'side effect', 'allergy', 'reaction', 'kamzori', 'jalan', 'behoshi'],
  kn: ['novu', 'jvara', 'talemaree', 'vamana', 'allergy', 'neeru', 'khaaj'],
  ta: ['vali', 'kaichal', 'thalaichutru', 'vaandhi', 'allergy', 'veekkam'],
  te: ['noppi', 'jvaram', 'talanotpi', 'vamkalu', 'allergy', 'vaapu'],
  bn: ['byatha', 'jor', 'matha-ghora', 'bomi', 'allergy', 'phula'],
  mr: ['dukhat', 'taap', 'chakkar', 'ulti', 'khaaj', 'sujan']
}

const POSITIVE_KEYWORDS: Record<string, string[]> = {
  en: ['great', 'helped', 'amazing', 'recommend', 'effective', 'worked', 'better', 'relief', 'cured', 'excellent', 'life-changing', 'thankful'],
  hi: ['achha', 'fayda', 'kaam kiya', 'thik', 'sahi', 'badhiya', 'rahat', 'theek'],
  kn: ['chennag', 'upayogi', 'kelasa', 'gunamund'],
  ta: ['nalla', 'payanulla', 'velai', 'kunamaanathu'],
  te: ['manchi', 'upayogam', 'pani', 'nayamainadi'],
  bn: ['bhalo', 'upkari', 'kaje', 'shushtha'],
  mr: ['changla', 'faydeshir', 'kaam', 'theek']
}

const NEGATIVE_KEYWORDS: Record<string, string[]> = {
  en: ['terrible', 'worse', 'bad', 'horrible', 'useless', 'ineffective', 'disappointed', 'regret', 'waste', 'avoid', 'dangerous', 'harmful'],
  hi: ['kharab', 'bekaar', 'bekar', 'galat', 'khatarnak', 'nuksaan'],
  kn: ['kedu', 'upayogashunya', 'apaayadaayaka'],
  ta: ['mosam', 'payanatra', 'aabattu'],
  te: ['cheddha', 'upayogam ledu', 'pramaadham'],
  bn: ['kharap', 'bekar', 'bipod'],
  mr: ['vaeet', 'bekaar', 'dhokaadaayak']
}

const COMPLAINT_KEYWORDS: Record<string, string[]> = {
  en: ['expensive', 'unavailable', 'delayed', 'poor service', 'rude', 'waiting', 'overpriced', 'scam', 'fraud', 'fake', 'shortage'],
  hi: ['mehenga', 'nahi milta', 'der', 'nakli', 'dhoka', 'cheat'],
  kn: ['dudda', 'sigutha illa', 'nakali'],
  ta: ['vilai', 'kidaikkala', 'poi'],
  te: ['kharidu', 'dorakadu', 'nakkili'],
  bn: ['daam', 'pawa jaye na', 'jaal'],
  mr: ['mahag', 'milt nahi', 'nakli']
}

const QUESTION_KEYWORDS: Record<string, string[]> = {
  en: ['anyone tried', 'does it work', 'is it safe', 'should i', 'can i', 'how long', 'when to', 'safe during', 'compatible with', 'alternative'],
  hi: ['kya koi', 'kaam karta', 'safe hai', 'kab lena', 'kitna dena'],
  kn: ['yaaru', 'kelasa maadutta', 'surakshit'],
  ta: ['yaaravathu', 'velai seyyuma', 'paathukaapu'],
  te: ['evaraina', 'pani chesthunda', 'surakshitam'],
  bn: ['keubaki', 'kaje korbe', 'nirapod'],
  mr: ['konee', 'kaam karto', 'surakshit']
}

const DRUG_ENTITIES = [
  'crocin', 'dolo', 'metastatin', 'paracetamol', 'ibuprofen',
  'insulin', 'metformin', 'aspirin', 'amoxicillin', 'cipro',
  'azithromycin', 'omeprazole', 'pantoprazole', 'atorvastatin'
]

const CONDITION_ENTITIES = [
  'fever', 'diabetes', 'hypertension', 'arthritis', 'asthma',
  'migraine', 'allergy', 'infection', 'covid', 'flu',
  'pneumonia', 'tuberculosis', 'dengue', 'malaria', 'typhoid'
]

const SYMPTOM_ENTITIES = [
  'headache', 'nausea', 'dizziness', 'rash', 'pain',
  'fatigue', 'cough', 'vomiting', 'bleeding', 'swelling',
  'insomnia', 'tremor', 'palpitations', 'breathlessness'
]

function countMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase()
  return keywords.filter(kw => lowerText.includes(kw)).length
}

function countMultiLangMatches(text: string, keywordBank: Record<string, string[]>, lang: string): number {
  let count = countMatches(text, keywordBank['en'] || [])
  if (lang !== 'en' && keywordBank[lang]) {
    count += countMatches(text, keywordBank[lang])
  }
  return count
}

function extractEntities(text: string): { type: 'drug' | 'condition' | 'symptom' | 'provider'; value: string }[] {
  const entities: { type: 'drug' | 'condition' | 'symptom' | 'provider'; value: string }[] = []
  const lowerText = text.toLowerCase()

  DRUG_ENTITIES.forEach(drug => {
    if (lowerText.includes(drug)) {
      entities.push({ type: 'drug', value: drug.charAt(0).toUpperCase() + drug.slice(1) })
    }
  })

  CONDITION_ENTITIES.forEach(condition => {
    if (lowerText.includes(condition)) {
      entities.push({ type: 'condition', value: condition.charAt(0).toUpperCase() + condition.slice(1) })
    }
  })

  SYMPTOM_ENTITIES.forEach(symptom => {
    if (lowerText.includes(symptom)) {
      entities.push({ type: 'symptom', value: symptom.charAt(0).toUpperCase() + symptom.slice(1) })
    }
  })

  return entities
}

function mockAnalyze(redactedText: string): AnalysisResult {
  const lang = detectLanguage(redactedText)

  const adverseScore = countMultiLangMatches(redactedText, ADVERSE_KEYWORDS, lang)
  const positiveScore = countMultiLangMatches(redactedText, POSITIVE_KEYWORDS, lang)
  const negativeScore = countMultiLangMatches(redactedText, NEGATIVE_KEYWORDS, lang)
  const complaintScore = countMultiLangMatches(redactedText, COMPLAINT_KEYWORDS, lang)
  const questionScore = countMultiLangMatches(redactedText, QUESTION_KEYWORDS, lang)

  const entities = extractEntities(redactedText)

  let signalType: AnalysisResult['signalType'] = 'NEUTRAL'
  let reasoning = ''

  const langLabel = { en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', mr: 'Marathi' }[lang] || lang

  if (adverseScore > 0) {
    signalType = 'ADVERSE_EVENT'
    reasoning = `[${langLabel}] Detected ${adverseScore} adverse event indicator(s): medical symptoms or side effects mentioned. `
  } else if (questionScore > 0) {
    signalType = 'QUESTION'
    reasoning = `[${langLabel}] Detected ${questionScore} question pattern(s): user seeking information. `
  } else if (complaintScore > 0) {
    signalType = 'COMPLAINT'
    reasoning = `[${langLabel}] Detected ${complaintScore} complaint indicator(s): service or access issues. `
  } else if (positiveScore > 0) {
    signalType = 'POSITIVE_EXPERIENCE'
    reasoning = `[${langLabel}] Detected ${positiveScore} positive indicator(s): favorable outcome mentioned. `
  } else {
    reasoning = `[${langLabel}] No specific signal indicators detected. `
  }

  let sentiment: AnalysisResult['sentiment'] = 'NEUTRAL'
  if (positiveScore > 0 || negativeScore > 0 || adverseScore > 0) {
    const totalNeg = negativeScore + adverseScore
    if (positiveScore > totalNeg * 1.5) {
      sentiment = 'POSITIVE'
    } else if (totalNeg > positiveScore * 1.5) {
      sentiment = 'NEGATIVE'
    } else if (positiveScore > 0 && totalNeg > 0) {
      sentiment = 'MIXED'
    } else if (positiveScore > 0) {
      sentiment = 'POSITIVE'
    } else {
      sentiment = 'NEGATIVE'
    }
  }

  const confidence = Math.min(
    0.95,
    0.5 + (Math.max(adverseScore, positiveScore, negativeScore, complaintScore, questionScore) * 0.15)
  )

  reasoning += `Sentiment: ${sentiment.toLowerCase()} (${positiveScore} positive, ${negativeScore + adverseScore} negative keywords). `

  if (entities.length > 0) {
    reasoning += `Extracted ${entities.length} healthcare entities. `
  }

  return {
    signalType,
    sentiment,
    sentimentConfidence: confidence,
    entities,
    isAdverseEvent: signalType === 'ADVERSE_EVENT',
    reasoning: reasoning.trim(),
    detectedLanguage: lang
  }
}

export async function analyzeMention(redactedText: string): Promise<AnalysisResult> {
  if (process.env.USE_MOCK_AI !== 'false') {
    return mockAnalyze(redactedText)
  }
  throw new Error('Real AI not implemented yet — set USE_MOCK_AI=true')
}
