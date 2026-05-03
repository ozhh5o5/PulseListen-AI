import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mention = await prisma.mention.findUnique({
      where: { id }
    })

    if (!mention) {
      return NextResponse.json({ error: 'Mention not found' }, { status: 404 })
    }

    return NextResponse.json(mention)
  } catch (error) {
    console.error('GET /api/mentions/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch mention' }, { status: 500 })
  }
}
