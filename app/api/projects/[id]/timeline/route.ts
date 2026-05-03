import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subDays, format, eachDayOfInterval } from 'date-fns'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = subDays(new Date(), days)
    
    const mentions = await prisma.mention.findMany({
      where: {
        projectId: id,
        postedAt: {
          gte: startDate
        }
      },
      select: {
        postedAt: true,
        signalType: true
      }
    })

    const dayBuckets = eachDayOfInterval({
      start: startDate,
      end: new Date()
    }).map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      ADVERSE_EVENT: 0,
      POSITIVE_EXPERIENCE: 0,
      QUESTION: 0,
      COMPLAINT: 0,
      NEUTRAL: 0,
      total: 0
    }))

    mentions.forEach(mention => {
      if (mention.postedAt && mention.signalType) {
        const dayKey = format(mention.postedAt, 'yyyy-MM-dd')
        const bucket = dayBuckets.find(b => b.date === dayKey)
        if (bucket && mention.signalType in bucket) {
          (bucket as any)[mention.signalType]++
          bucket.total++
        }
      }
    })

    return NextResponse.json({ timeline: dayBuckets })
  } catch (error) {
    console.error('GET /api/projects/[id]/timeline error:', error)
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 })
  }
}
