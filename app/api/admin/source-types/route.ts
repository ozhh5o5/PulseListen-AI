import { NextResponse } from 'next/server'
import { crawlerRegistry } from '@/lib/crawlers/registry'

export async function GET() {
  try {
    const sourceTypes = Object.keys(crawlerRegistry).map(type => ({
      type,
      name: type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      status: 'active'
    }))

    return NextResponse.json({ sourceTypes })
  } catch (error) {
    console.error('GET /api/admin/source-types error:', error)
    return NextResponse.json({ error: 'Failed to fetch source types' }, { status: 500 })
  }
}
