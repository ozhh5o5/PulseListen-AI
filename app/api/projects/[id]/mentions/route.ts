import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = req.nextUrl.searchParams
    const signalType = searchParams.get('signalType')
    const sentiment = searchParams.get('sentiment')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { projectId: id }
    
    if (signalType) {
      where.signalType = signalType
    }
    
    if (sentiment) {
      where.sentiment = sentiment
    }
    
    if (from || to) {
      where.postedAt = {}
      if (from) where.postedAt.gte = new Date(from)
      if (to) where.postedAt.lte = new Date(to)
    }

    const mentions = await prisma.mention.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      take: 100
    })

    return NextResponse.json({
      total: mentions.length,
      mentions
    })
  } catch (error) {
    console.error('GET /api/projects/[id]/mentions error:', error)
    return NextResponse.json({ error: 'Failed to fetch mentions' }, { status: 500 })
  }
}
