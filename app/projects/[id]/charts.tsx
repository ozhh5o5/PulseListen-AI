'use client'

import dynamic from 'next/dynamic'

// Dynamically import Tremor charts — prevents SSR crash on Vercel
const BarChart = dynamic(() => import('@tremor/react').then(m => m.BarChart), {
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading chart...</div>
})

const LineChart = dynamic(() => import('@tremor/react').then(m => m.LineChart), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Loading chart...</div>
})

interface SentimentChartProps {
  data: { name: string; value: number }[]
}

interface SignalChartProps {
  data: { name: string; count: number }[]
}

interface TimelineChartProps {
  data: { date: string; mentions: number }[]
}

export function SentimentChart({ data }: SentimentChartProps) {
  if (!data.length) return <p className="text-slate-500 text-center py-8 text-sm">No data</p>
  return (
    <BarChart
      data={data}
      index="name"
      categories={['value']}
      colors={['cyan']}
      showLegend={false}
      className="h-48"
    />
  )
}

export function SignalChart({ data }: SignalChartProps) {
  if (!data.length) return <p className="text-slate-500 text-center py-8 text-sm">No data</p>
  return (
    <BarChart
      data={data}
      index="name"
      categories={['count']}
      colors={['emerald']}
      showLegend={false}
      className="h-48"
    />
  )
}

export function TimelineChart({ data }: TimelineChartProps) {
  if (!data.length) return <p className="text-slate-500 text-center py-8 text-sm">No timeline data</p>
  return (
    <LineChart
      data={data}
      index="date"
      categories={['mentions']}
      colors={['cyan']}
      yAxisWidth={40}
      showLegend={false}
      className="h-64"
    />
  )
}
