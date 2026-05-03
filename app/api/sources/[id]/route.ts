import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { cadence, config } = body

    const updateData: any = {}
    if (cadence !== undefined) updateData.cadence = cadence
    if (config !== undefined) updateData.config = JSON.stringify(config)

    const source = await prisma.source.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(source)
  } catch (error) {
    console.error('PUT /api/sources/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 })
  }
}
