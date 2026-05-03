import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        sources: true,
        _count: {
          select: { mentions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      total: projects.length,
      projects
    })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, keywords } = body

    if (!name || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        keywords: JSON.stringify(keywords),
        isActive: true
      }
    })

    await prisma.adminAction.create({
      data: {
        projectId: project.id,
        action: 'project_created',
        details: JSON.stringify({ name, keywordCount: keywords.length })
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
