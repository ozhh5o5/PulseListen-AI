import { faker } from '@faker-js/faker'
import { writeFileSync } from 'fs'
import { join } from 'path'

faker.seed(42)

const DRUGS = ['Crocin', 'Dolo', 'MetaStatin', 'paracetamol', 'ibuprofen', 'insulin', 'metformin']
const CONDITIONS = ['fever', 'diabetes', 'hypertension', 'arthritis', 'headache']

const ADVERSE_TEMPLATES = [
  'I took {drug} yesterday and now I have severe headache and nausea',
  'Anyone else experiencing dizziness after taking {drug}? Side effects are terrible',
  'Warning: {drug} gave me a bad rash and vomiting. Had to stop',
  '{drug} caused me fever and chills. Is this normal?',
  'Experienced severe allergic reaction to {drug}. Be careful!',
  'Day 3 on {drug} and having constant headaches. Anyone else?',
  'My {condition} medication {drug} is giving me side effects - bleeding and pain',
]

const POSITIVE_TEMPLATES = [
  '{drug} is amazing! Helped with my {condition} so much',
  'Great results with {drug}. Highly recommend for {condition}',
  '{drug} worked wonders. My {condition} is much better now',
  'Life-changing medication. {drug} helped me manage {condition}',
  'Excellent experience with {drug}. No side effects, just relief',
  'Been taking {drug} for weeks now. Fantastic for {condition}',
  'Thankful for {drug}. My {condition} symptoms are gone',
]

const COMPLAINT_TEMPLATES = [
  '{drug} is so expensive! Can\'t afford it anymore',
  'Pharmacy says {drug} is unavailable. Poor service',
  'Waited 2 hours for {drug}. Terrible experience',
  '{drug} quality has gone down. What a waste of money',
  'Overpriced and delayed delivery of {drug}',
  'Customer service for {drug} inquiry was rude',
]

const QUESTION_TEMPLATES = [
  'Anyone tried {drug} for {condition}? Does it work?',
  'Is {drug} safe during pregnancy? Need advice',
  'How long does {drug} take to work for {condition}?',
  'Should I take {drug} with food? Any recommendations?',
  'Can I combine {drug} with other medications?',
  'What\'s the right dosage of {drug} for {condition}?',
]

const NEUTRAL_TEMPLATES = [
  'Just picked up {drug} from the pharmacy',
  'Doctor prescribed {drug} for my {condition}',
  'Starting {drug} treatment tomorrow',
  'Refilling my {drug} prescription today',
  'Reading about {drug} side effects',
]

function addPII(text: string, piiChance: number): string {
  if (Math.random() < 0.10) {
    text += ` Contact me at ${faker.internet.email()}`
  }
  if (Math.random() < 0.08) {
    const phone = `+91 ${faker.number.int({ min: 6000000000, max: 9999999999 })}`
    text += ` Call ${phone}`
  }
  if (Math.random() < 0.05) {
    const age = faker.number.int({ min: 25, max: 75 })
    text += ` I am ${age} years old`
  }
  if (Math.random() < 0.02) {
    const pan = `${faker.string.alpha({ length: 5, casing: 'upper' })}${faker.number.int({ min: 1000, max: 9999 })}${faker.string.alpha({ length: 1, casing: 'upper' })}`
    text += ` PAN: ${pan}`
  }
  return text
}

function generateMention(type: 'adverse' | 'positive' | 'complaint' | 'question' | 'neutral'): string {
  let template = ''
  
  switch (type) {
    case 'adverse':
      template = faker.helpers.arrayElement(ADVERSE_TEMPLATES)
      break
    case 'positive':
      template = faker.helpers.arrayElement(POSITIVE_TEMPLATES)
      break
    case 'complaint':
      template = faker.helpers.arrayElement(COMPLAINT_TEMPLATES)
      break
    case 'question':
      template = faker.helpers.arrayElement(QUESTION_TEMPLATES)
      break
    case 'neutral':
      template = faker.helpers.arrayElement(NEUTRAL_TEMPLATES)
      break
  }
  
  const text = template
    .replace('{drug}', faker.helpers.arrayElement(DRUGS))
    .replace('{condition}', faker.helpers.arrayElement(CONDITIONS))
  
  return addPII(text, 0.2)
}

function generateCSV(sourceType: 'X_TWITTER' | 'REDDIT', count: number): string {
  const rows: string[] = []
  rows.push('"url","author","text","posted_at","source_type"')
  
  const distribution = [
    { type: 'adverse', count: Math.floor(count * 0.25) },
    { type: 'positive', count: Math.floor(count * 0.30) },
    { type: 'complaint', count: Math.floor(count * 0.20) },
    { type: 'question', count: Math.floor(count * 0.15) },
    { type: 'neutral', count: Math.floor(count * 0.10) },
  ]
  
  for (const { type, count: typeCount } of distribution) {
    for (let i = 0; i < typeCount; i++) {
      const daysAgo = faker.number.int({ min: 0, max: 30 })
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      date.setHours(faker.number.int({ min: 0, max: 23 }))
      date.setMinutes(faker.number.int({ min: 0, max: 59 }))
      
      const url = sourceType === 'X_TWITTER' 
        ? `https://x.com/${faker.internet.displayName().replace(/\s+/g, '_')}/status/${faker.number.int({ min: 1000000000000000000, max: 9999999999999999999 })}`
        : `https://reddit.com/r/${faker.helpers.arrayElement(['medicine', 'healthcare', 'pharmacy'])}/comments/${faker.string.alphanumeric(6)}`
      
      const author = sourceType === 'X_TWITTER'
        ? `@${faker.internet.displayName().replace(/\s+/g, '_')}`
        : `u/${faker.internet.displayName().replace(/\s+/g, '_')}`
      
      const text = generateMention(type as any)
      const postedAt = date.toISOString().replace('T', ' ').split('.')[0]
      
      rows.push(`"${url}","${author}","${text}","${postedAt}","${sourceType}"`)
    }
  }
  
  return rows.join('\n')
}

console.log('Generating mock data with seed 42...')

const xCSV = generateCSV('X_TWITTER', 80)
const redditCSV = generateCSV('REDDIT', 70)

const dataDir = join(process.cwd(), 'data')
writeFileSync(join(dataDir, 'mock_mentions_x.csv'), xCSV)
writeFileSync(join(dataDir, 'mock_mentions_reddit.csv'), redditCSV)

console.log('✓ Generated data/mock_mentions_x.csv (80 mentions)')
console.log('✓ Generated data/mock_mentions_reddit.csv (70 mentions)')
console.log('Done!')
