import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const actions = await prisma.adminAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      total: actions.length,
      actions
    })
  } catch (error) {
    console.error('GET /api/admin/actions error:', error)
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 })
  }
}
