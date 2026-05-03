export interface RawMention {
  url: string | null
  author: string | null
  text: string
  postedAt: Date | null
  sourceType: 'X_TWITTER' | 'REDDIT' | 'FORUM' | 'QUORA'
}

export type Crawler = (config: any, keywords: string[]) => Promise<RawMention[]>
