// ─── Geographic Data Engine ───
// Maps mentions to Indian states/cities for heatmap visualization

export interface GeoPoint {
  state: string
  city: string
  lat: number
  lng: number
}

// Major Indian cities with coordinates
const INDIAN_CITIES: GeoPoint[] = [
  { state: 'Karnataka', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { state: 'Karnataka', city: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { state: 'Karnataka', city: 'Hubli', lat: 15.3647, lng: 75.1240 },
  { state: 'Maharashtra', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { state: 'Maharashtra', city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { state: 'Maharashtra', city: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { state: 'Tamil Nadu', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { state: 'Tamil Nadu', city: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { state: 'Tamil Nadu', city: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { state: 'Telangana', city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { state: 'Telangana', city: 'Warangal', lat: 17.9784, lng: 79.5941 },
  { state: 'Delhi', city: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { state: 'Uttar Pradesh', city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { state: 'Uttar Pradesh', city: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { state: 'Uttar Pradesh', city: 'Noida', lat: 28.5355, lng: 77.3910 },
  { state: 'West Bengal', city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { state: 'West Bengal', city: 'Siliguri', lat: 26.7271, lng: 88.3953 },
  { state: 'Gujarat', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { state: 'Gujarat', city: 'Surat', lat: 21.1702, lng: 72.8311 },
  { state: 'Rajasthan', city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { state: 'Rajasthan', city: 'Jodhpur', lat: 26.2389, lng: 73.0243 },
  { state: 'Madhya Pradesh', city: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { state: 'Madhya Pradesh', city: 'Indore', lat: 22.7196, lng: 75.8577 },
  { state: 'Kerala', city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { state: 'Kerala', city: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
  { state: 'Punjab', city: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { state: 'Punjab', city: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
  { state: 'Andhra Pradesh', city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { state: 'Andhra Pradesh', city: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
  { state: 'Bihar', city: 'Patna', lat: 25.6093, lng: 85.1376 },
  { state: 'Odisha', city: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { state: 'Assam', city: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { state: 'Jharkhand', city: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { state: 'Chhattisgarh', city: 'Raipur', lat: 21.2514, lng: 81.6296 },
  { state: 'Haryana', city: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { state: 'Goa', city: 'Panaji', lat: 15.4909, lng: 73.8278 },
]

// Assign a deterministic geo location based on mention content hash
export function assignGeoLocation(mentionId: string): GeoPoint {
  const hash = mentionId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const idx = hash % INDIAN_CITIES.length
  return INDIAN_CITIES[idx]
}

export interface StateAggregation {
  state: string
  totalMentions: number
  adverseEvents: number
  novelSignals: number
  topCity: string
  cities: { city: string; count: number }[]
}

export function aggregateByState(
  mentions: Array<{ geoState: string | null; geoCity: string | null; isAdverseEvent: boolean; isNovelSignal: boolean }>
): StateAggregation[] {
  const stateMap: Record<string, { total: number; adverse: number; novel: number; cities: Record<string, number> }> = {}

  for (const m of mentions) {
    if (!m.geoState) continue
    if (!stateMap[m.geoState]) {
      stateMap[m.geoState] = { total: 0, adverse: 0, novel: 0, cities: {} }
    }
    stateMap[m.geoState].total++
    if (m.isAdverseEvent) stateMap[m.geoState].adverse++
    if (m.isNovelSignal) stateMap[m.geoState].novel++
    if (m.geoCity) {
      stateMap[m.geoState].cities[m.geoCity] = (stateMap[m.geoState].cities[m.geoCity] || 0) + 1
    }
  }

  return Object.entries(stateMap)
    .map(([state, data]) => {
      const citiesArr = Object.entries(data.cities)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
      return {
        state,
        totalMentions: data.total,
        adverseEvents: data.adverse,
        novelSignals: data.novel,
        topCity: citiesArr[0]?.city || 'Unknown',
        cities: citiesArr
      }
    })
    .sort((a, b) => b.totalMentions - a.totalMentions)
}

export function getAllStates(): string[] {
  return [...new Set(INDIAN_CITIES.map(c => c.state))].sort()
}

export { INDIAN_CITIES }
