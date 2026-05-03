import type { Crawler } from './types'
import { crawlX } from './x'
import { crawlReddit } from './reddit'

export const crawlerRegistry: Record<string, Crawler> = {
  X_TWITTER: crawlX,
  REDDIT: crawlReddit,
}

export function getCrawler(sourceType: string): Crawler | undefined {
  return crawlerRegistry[sourceType]
}
