import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCrawler } from '@/lib/crawlers/registry'
import { analyzeMention } from '@/lib/ai'
import { redactPII } from '@/lib/pii'
import { analyzeNovelty } from '@/lib/zero-shot'
import { analyzeDiffusion } from '@/lib/diffusion'
import { assignGeoLocation } from '@/lib/geo'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const source = await prisma.source.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const crawler = getCrawler(source.sourceType)
    if (!crawler) {
      return NextResponse.json({ error: 'Crawler not found' }, { status: 400 })
    }

    const keywords = JSON.parse(source.project.keywords)
    const config = JSON.parse(source.config)
    
    const rawMentions = await crawler(config, keywords)

    let processedCount = 0
    for (const raw of rawMentions) {
      try {
        const { redactedText, piiFlags } = redactPII(raw.text)
        const analysis = await analyzeMention(redactedText)
        const novelty = analyzeNovelty(redactedText, analysis.isAdverseEvent)
        const geo = assignGeoLocation(`${source.projectId}-${processedCount}`)
        const diffusion = analysis.isAdverseEvent
          ? analyzeDiffusion(`${source.projectId}-${processedCount}`, analysis.signalType, raw.author, raw.sourceType)
          : null

        await prisma.mention.create({
          data: {
            projectId: source.projectId,
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
        processedCount++
      } catch (writeErr) {
        // On Vercel, the DB is read-only; skip writes gracefully
        console.warn('Write skipped (read-only fs):', writeErr)
        return NextResponse.json({
          success: false,
          error: 'Database is read-only in this deployment. Data was pre-seeded during build.',
        }, { status: 409 })
      }
    }

    try {
      await prisma.source.update({
        where: { id },
        data: { lastCrawledAt: new Date() }
      })

      await prisma.adminAction.create({
        data: {
          projectId: source.projectId,
          action: 'crawl_triggered',
          details: JSON.stringify({ sourceType: source.sourceType, mentionsFound: processedCount })
        }
      })
    } catch {
      // Ignore write failures on read-only deployments
    }

    return NextResponse.json({ 
      success: true, 
      mentionsProcessed: processedCount 
    })
  } catch (error) {
    console.error('POST /api/sources/[id]/crawl error:', error)
    return NextResponse.json({ error: 'Failed to crawl source' }, { status: 500 })
  }
}
