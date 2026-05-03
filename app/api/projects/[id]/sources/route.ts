import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sources = await prisma.source.findMany({
      where: { projectId: id },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json({
      total: sources.length,
      sources
    })
  } catch (error) {
    console.error('GET /api/projects/[id]/sources error:', error)
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { sourceType, cadence, config } = body

    if (!sourceType || !cadence) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const source = await prisma.source.create({
      data: {
        projectId: id,
        sourceType,
        cadence,
        config: JSON.stringify(config || {})
      }
    })

    await prisma.adminAction.create({
      data: {
        projectId: id,
        action: 'source_added',
        details: JSON.stringify({ sourceType, cadence })
      }
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects/[id]/sources error:', error)
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
  }
}
