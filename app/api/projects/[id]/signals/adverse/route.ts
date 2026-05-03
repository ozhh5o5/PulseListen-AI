import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mentions = await prisma.mention.findMany({
      where: {
        projectId: id,
        isAdverseEvent: true
      },
      orderBy: { postedAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      total: mentions.length,
      mentions
    })
  } catch (error) {
    console.error('GET /api/projects/[id]/signals/adverse error:', error)
    return NextResponse.json({ error: 'Failed to fetch adverse events' }, { status: 500 })
  }
}
