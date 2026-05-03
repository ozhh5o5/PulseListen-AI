import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getCrawler } from '../lib/crawlers/registry'
import { analyzeMention } from '../lib/ai'
import { redactPII } from '../lib/pii'
import { analyzeNovelty } from '../lib/zero-shot'
import { analyzeDiffusion } from '../lib/diffusion'
import { assignGeoLocation } from '../lib/geo'
import { generateICSR } from '../lib/icsr'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding demo data...')

  console.log('Clearing existing data...')
  await prisma.iCSRReport.deleteMany()
  await prisma.mention.deleteMany()
  await prisma.source.deleteMany()
  await prisma.adminAction.deleteMany()
  await prisma.project.deleteMany()

  console.log('Creating projects...')

  const project1 = await prisma.project.create({
    data: {
      name: 'MetaStatin Safety Monitoring',
      description: 'Real-time monitoring of social media mentions for adverse events and safety signals related to MetaStatin — a fictional cholesterol-lowering drug under Phase IV surveillance.',
      keywords: JSON.stringify(['metastatin', 'side effect', 'adverse', 'headache', 'nausea', 'dizziness', 'rash']),
      isActive: true
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Indian Generic Drugs Feedback',
      description: 'Track patient experiences and sentiment for popular generic medications across India including Crocin, Dolo, and Paracetamol formulations.',
      keywords: JSON.stringify(['crocin', 'dolo', 'paracetamol', 'generic', 'fever', 'pain', 'tablet']),
      isActive: true
    }
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Dengue Outbreak Surveillance',
      description: 'Monitor social media for early signals of dengue fever outbreaks across Indian states using multilingual detection.',
      keywords: JSON.stringify(['dengue', 'mosquito', 'fever', 'platelet', 'bukhar', 'macchar']),
      isActive: true
    }
  })

  console.log('Creating sources...')

  const source1X = await prisma.source.create({
    data: { projectId: project1.id, sourceType: 'X_TWITTER', cadence: 'DAILY', config: JSON.stringify({}) }
  })
  const source1Reddit = await prisma.source.create({
    data: { projectId: project1.id, sourceType: 'REDDIT', cadence: 'DAILY', config: JSON.stringify({ subreddit: 'medicine' }) }
  })
  const source2X = await prisma.source.create({
    data: { projectId: project2.id, sourceType: 'X_TWITTER', cadence: 'REALTIME', config: JSON.stringify({}) }
  })
  const source2Reddit = await prisma.source.create({
    data: { projectId: project2.id, sourceType: 'REDDIT', cadence: 'DAILY', config: JSON.stringify({ subreddit: 'healthcare' }) }
  })
  const source3X = await prisma.source.create({
    data: { projectId: project3.id, sourceType: 'X_TWITTER', cadence: 'REALTIME', config: JSON.stringify({}) }
  })
  const source3Reddit = await prisma.source.create({
    data: { projectId: project3.id, sourceType: 'REDDIT', cadence: 'DAILY', config: JSON.stringify({ subreddit: 'india' }) }
  })

  console.log('Processing mentions from crawlers with full pipeline...')

  const sources = [
    { source: source1X, project: project1, keywords: JSON.parse(project1.keywords) },
    { source: source1Reddit, project: project1, keywords: JSON.parse(project1.keywords) },
    { source: source2X, project: project2, keywords: JSON.parse(project2.keywords) },
    { source: source2Reddit, project: project2, keywords: JSON.parse(project2.keywords) },
    { source: source3X, project: project3, keywords: JSON.parse(project3.keywords) },
    { source: source3Reddit, project: project3, keywords: JSON.parse(project3.keywords) },
  ]

  let totalMentions = 0
  let adverseCount = 0
  let piiRedactedCount = 0
  let novelCount = 0
  let icsrCount = 0

  for (const { source, project, keywords } of sources) {
    const crawler = getCrawler(source.sourceType)
    if (!crawler) continue

    const rawMentions = await crawler(JSON.parse(source.config), keywords)

    for (const raw of rawMentions) {
      // Step 1: Edge PII Redaction
      const { redactedText, piiFlags } = redactPII(raw.text)
      
      // Step 2: Multilingual AI Analysis
      const analysis = await analyzeMention(redactedText)
      
      // Step 3: Zero-Shot Novel Signal Detection
      const novelty = analyzeNovelty(redactedText, analysis.isAdverseEvent)
      
      // Step 4: Geographic Assignment
      const geo = assignGeoLocation(`${project.id}-${totalMentions}`)
      
      // Step 5: Diffusion Analysis (for adverse events)
      const diffusion = analysis.isAdverseEvent
        ? analyzeDiffusion(`${project.id}-${totalMentions}`, analysis.signalType, raw.author, raw.sourceType)
        : null

      const hasPII = Object.values(piiFlags).some(count => count > 0)
      if (hasPII) piiRedactedCount++
      if (analysis.isAdverseEvent) adverseCount++
      if (novelty.isNovelSignal) novelCount++

      const mention = await prisma.mention.create({
        data: {
          projectId: project.id,
          sourceType: raw.sourceType,
          sourceUrl: raw.url,
          authorHandle: raw.author,
          rawText: raw.text,
          redactedText,
          piiFlags: JSON.stringify(piiFlags),
          postedAt: raw.postedAt,
          signalType: analysis.signalType,
          sentiment: analysis.sentiment,
          sentimentConfidence: analysis.sentimentConfidence,
          entities: JSON.stringify(analysis.entities),
          isAdverseEvent: analysis.isAdverseEvent,
          reasoning: analysis.reasoning,
          detectedLanguage: analysis.detectedLanguage,
          noveltyScore: novelty.noveltyScore,
          isNovelSignal: novelty.isNovelSignal,
          clusterLabel: novelty.clusterLabel,
          diffusionLabel: diffusion?.label || null,
          spreadPattern: diffusion?.spreadPattern || null,
          geoState: geo.state,
          geoCity: geo.city,
          geoLat: geo.lat,
          geoLng: geo.lng,
        }
      })

      // Step 6: Generate ICSR for adverse events
      if (analysis.isAdverseEvent) {
        const icsrData = generateICSR({
          ...mention,
          postedAt: mention.postedAt,
          acquiredAt: mention.acquiredAt,
        })
        await prisma.iCSRReport.create({
          data: {
            mentionId: mention.id,
            projectId: project.id,
            reportJson: JSON.stringify(icsrData),
            severity: icsrData.severity,
            status: 'DRAFT'
          }
        })
        icsrCount++
      }

      totalMentions++
    }

    await prisma.source.update({
      where: { id: source.id },
      data: { lastCrawledAt: new Date() }
    })
  }

  console.log('Creating audit actions...')

  for (const project of [project1, project2, project3]) {
    await prisma.adminAction.create({
      data: {
        projectId: project.id,
        action: 'project_created',
        details: JSON.stringify({ name: project.name })
      }
    })
  }

  await prisma.adminAction.create({
    data: {
      action: 'system_seeded',
      details: JSON.stringify({ totalMentions, adverseCount, novelCount, icsrCount })
    }
  })

  console.log('\n✅ Seed complete!')
  console.log(`   Projects: 3`)
  console.log(`   Sources: 6`)
  console.log(`   Mentions: ${totalMentions}`)
  console.log(`   Adverse Events: ${adverseCount}`)
  console.log(`   Novel Signals: ${novelCount}`)
  console.log(`   ICSR Reports: ${icsrCount}`)
  console.log(`   PII Redacted: ${piiRedactedCount}`)
  console.log('\n🚀 Start the dev server:')
  console.log('   npm run dev')
  console.log('   Open http://localhost:3000')
}

seed()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
