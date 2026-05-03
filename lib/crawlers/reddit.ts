import { readFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'date-fns'
import type { Crawler, RawMention } from './types'

export const crawlReddit: Crawler = async (config, keywords) => {
  const csvPath = join(process.cwd(), 'data', 'mock_mentions_reddit.csv')
  
  try {
    const csvContent = readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) return []
    
    const mentions: RawMention[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"$/)
      
      if (!match) continue
      
      const [, url, author, text, postedAt, sourceType] = match
      
      const lowerText = text.toLowerCase()
      const hasKeyword = keywords.some(kw => lowerText.includes(kw.toLowerCase()))
      
      if (hasKeyword) {
        mentions.push({
          url: url || null,
          author: author || null,
          text,
          postedAt: postedAt ? parse(postedAt, 'yyyy-MM-dd HH:mm:ss', new Date()) : null,
          sourceType: sourceType as 'REDDIT'
        })
      }
    }
    
    return mentions
  } catch (error) {
    console.error('Reddit crawler error:', error)
    return []
  }
}
