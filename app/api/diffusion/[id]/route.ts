import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeDiffusion } from '@/lib/diffusion'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mention = await prisma.mention.findUnique({
      where: { id },
      include: { project: true }
    })

    if (!mention) {
      return NextResponse.json({ error: 'Mention not found' }, { status: 404 })
    }

    const result = analyzeDiffusion(
      mention.id,
      mention.signalType || 'UNKNOWN',
      mention.authorHandle,
      mention.sourceType
    )

    return NextResponse.json({ mention, result })
  } catch (error) {
    console.error('GET /api/diffusion/[id] error:', error)
    return NextResponse.json({ error: 'Failed to analyze diffusion' }, { status: 500 })
  }
}
