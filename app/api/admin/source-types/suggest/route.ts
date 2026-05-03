import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    let sourceType = 'FORUM'
    let config = {}

    if (url.includes('reddit.com')) {
      sourceType = 'REDDIT'
      const subredditMatch = url.match(/\/r\/([^\/]+)/)
      config = { subreddit: subredditMatch ? subredditMatch[1] : 'healthcare' }
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      sourceType = 'X_TWITTER'
      const usernameMatch = url.match(/\/([^\/]+)$/)
      config = { username: usernameMatch ? usernameMatch[1] : '' }
    } else if (url.includes('quora.com')) {
      sourceType = 'QUORA'
      config = { topic: 'healthcare' }
    }

    return NextResponse.json({
      suggestion: {
        sourceType,
        config,
        cadence: 'DAILY',
        reasoning: `Detected ${sourceType} pattern in URL. Suggested daily monitoring with default configuration.`
      }
    })
  } catch (error) {
    console.error('POST /api/admin/source-types/suggest error:', error)
    return NextResponse.json({ error: 'Failed to suggest source' }, { status: 500 })
  }
}
