import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const signals = await prisma.mention.findMany({
      where: { isAdverseEvent: true },
      orderBy: { acquiredAt: 'desc' },
      take: 50,
      include: { project: { select: { name: true } } },
    })

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('GET /api/diffusion error:', error)
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }
}
