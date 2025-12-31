import { SafetyData, SafetyEvent, Incident, TrendDataPoint, Recommendation, NewsItem } from '@/types';

// Seeded random number generator for consistent results
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate deterministic data based on country code
function generateFromSeed(countryCode: string): number {
  let seed = 0;
  for (let i = 0; i < countryCode.length; i++) {
    seed += countryCode.charCodeAt(i) * (i + 1);
  }
  return seed;
}

// Country data with coordinates and base safety scores
const countryData: Record<string, { name: string; region: string; coordinates: [number, number]; baseScore: number }> = {
  US: { name: 'United States', region: 'North America', coordinates: [37.0902, -95.7129], baseScore: 75 },
  GB: { name: 'United Kingdom', region: 'Europe', coordinates: [55.3781, -3.4360], baseScore: 82 },
  FR: { name: 'France', region: 'Europe', coordinates: [46.2276, 2.2137], baseScore: 80 },
  DE: { name: 'Germany', region: 'Europe', coordinates: [51.1657, 10.4515], baseScore: 85 },
  IT: { name: 'Italy', region: 'Europe', coordinates: [41.8719, 12.5674], baseScore: 78 },
  ES: { name: 'Spain', region: 'Europe', coordinates: [40.4637, -3.7492], baseScore: 82 },
  JP: { name: 'Japan', region: 'Asia', coordinates: [36.2048, 138.2529], baseScore: 90 },
  CN: { name: 'China', region: 'Asia', coordinates: [35.8617, 104.1954], baseScore: 70 },
  IN: { name: 'India', region: 'Asia', coordinates: [20.5937, 78.9629], baseScore: 55 },
  TH: { name: 'Thailand', region: 'Southeast Asia', coordinates: [15.8700, 100.9925], baseScore: 65 },
  VN: { name: 'Vietnam', region: 'Southeast Asia', coordinates: [14.0583, 108.2772], baseScore: 68 },
  ID: { name: 'Indonesia', region: 'Southeast Asia', coordinates: [-0.7893, 113.9213], baseScore: 60 },
  MY: { name: 'Malaysia', region: 'Southeast Asia', coordinates: [4.2105, 101.9758], baseScore: 72 },
  SG: { name: 'Singapore', region: 'Southeast Asia', coordinates: [1.3521, 103.8198], baseScore: 88 },
  PH: { name: 'Philippines', region: 'Southeast Asia', coordinates: [12.8797, 121.7740], baseScore: 58 },
  AU: { name: 'Australia', region: 'Oceania', coordinates: [-25.2744, 133.7751], baseScore: 87 },
  NZ: { name: 'New Zealand', region: 'Oceania', coordinates: [-40.9006, 174.8860], baseScore: 89 },
  CA: { name: 'Canada', region: 'North America', coordinates: [56.1304, -106.3468], baseScore: 86 },
  MX: { name: 'Mexico', region: 'North America', coordinates: [23.6345, -102.5528], baseScore: 52 },
  BR: { name: 'Brazil', region: 'South America', coordinates: [-14.2350, -51.9253], baseScore: 55 },
  AR: { name: 'Argentina', region: 'South America', coordinates: [-38.4161, -63.6167], baseScore: 58 },
  CL: { name: 'Chile', region: 'South America', coordinates: [-35.6751, -71.5430], baseScore: 70 },
  CO: { name: 'Colombia', region: 'South America', coordinates: [4.5709, -74.2973], baseScore: 54 },
  PE: { name: 'Peru', region: 'South America', coordinates: [-9.1900, -75.0152], baseScore: 62 },
  EG: { name: 'Egypt', region: 'Middle East', coordinates: [26.8206, 30.8025], baseScore: 55 },
  ZA: { name: 'South Africa', region: 'Africa', coordinates: [-30.5595, 22.9375], baseScore: 48 },
  MA: { name: 'Morocco', region: 'Africa', coordinates: [31.7917, -7.0926], baseScore: 62 },
  KE: { name: 'Kenya', region: 'Africa', coordinates: [-0.0236, 37.9062], baseScore: 50 },
  NG: { name: 'Nigeria', region: 'Africa', coordinates: [9.0820, 8.6753], baseScore: 45 },
  KR: { name: 'South Korea', region: 'Asia', coordinates: [35.9078, 127.7669], baseScore: 83 },
  TW: { name: 'Taiwan', region: 'Asia', coordinates: [23.6978, 120.9605], baseScore: 80 },
  HK: { name: 'Hong Kong', region: 'Asia', coordinates: [22.3193, 114.1694], baseScore: 72 },
  AE: { name: 'United Arab Emirates', region: 'Middle East', coordinates: [23.4241, 53.8478], baseScore: 78 },
  SA: { name: 'Saudi Arabia', region: 'Middle East', coordinates: [23.8859, 45.0792], baseScore: 65 },
  TR: { name: 'Turkey', region: 'Europe/Middle East', coordinates: [38.9637, 35.2433], baseScore: 58 },
  GR: { name: 'Greece', region: 'Europe', coordinates: [39.0742, 21.8243], baseScore: 76 },
  PT: { name: 'Portugal', region: 'Europe', coordinates: [39.3999, -8.2245], baseScore: 84 },
  NL: { name: 'Netherlands', region: 'Europe', coordinates: [52.1326, 5.2913], baseScore: 86 },
  BE: { name: 'Belgium', region: 'Europe', coordinates: [50.5039, 4.4699], baseScore: 83 },
  CH: { name: 'Switzerland', region: 'Europe', coordinates: [46.8182, 8.2275], baseScore: 91 },
  AT: { name: 'Austria', region: 'Europe', coordinates: [47.5162, 14.5501], baseScore: 87 },
  SE: { name: 'Sweden', region: 'Europe', coordinates: [60.1282, 18.6435], baseScore: 88 },
  NO: { name: 'Norway', region: 'Europe', coordinates: [60.4720, 8.4689], baseScore: 90 },
  DK: { name: 'Denmark', region: 'Europe', coordinates: [56.2639, 9.5018], baseScore: 89 },
  FI: { name: 'Finland', region: 'Europe', coordinates: [61.9241, 25.7482], baseScore: 88 },
  IE: { name: 'Ireland', region: 'Europe', coordinates: [53.1424, -7.6921], baseScore: 85 },
  CZ: { name: 'Czech Republic', region: 'Europe', coordinates: [49.8175, 15.4730], baseScore: 80 },
  PL: { name: 'Poland', region: 'Europe', coordinates: [51.9194, 19.1451], baseScore: 78 },
  HU: { name: 'Hungary', region: 'Europe', coordinates: [47.1625, 19.5033], baseScore: 75 },
  RU: { name: 'Russia', region: 'Europe/Asia', coordinates: [61.5240, 105.3188], baseScore: 45 },
  UA: { name: 'Ukraine', region: 'Europe', coordinates: [48.3794, 31.1656], baseScore: 35 },
  IL: { name: 'Israel', region: 'Middle East', coordinates: [31.0461, 34.8516], baseScore: 65 },
  IQ: { name: 'Iraq', region: 'Middle East', coordinates: [33.2232, 43.6793], baseScore: 38 },
  IR: { name: 'Iran', region: 'Middle East', coordinates: [32.4279, 53.6880], baseScore: 42 },
  PK: { name: 'Pakistan', region: 'Asia', coordinates: [30.3753, 69.3451], baseScore: 45 },
  BD: { name: 'Bangladesh', region: 'Asia', coordinates: [23.6850, 90.3563], baseScore: 48 },
  NP: { name: 'Nepal', region: 'Asia', coordinates: [28.3949, 84.1240], baseScore: 58 },
  LK: { name: 'Sri Lanka', region: 'Asia', coordinates: [7.8731, 80.7718], baseScore: 60 },
  MM: { name: 'Myanmar', region: 'Asia', coordinates: [21.9140, 95.9562], baseScore: 42 },
  KH: { name: 'Cambodia', region: 'Southeast Asia', coordinates: [12.5657, 104.9910], baseScore: 52 },
  LA: { name: 'Laos', region: 'Southeast Asia', coordinates: [19.8563, 102.4955], baseScore: 55 },
};

// News event templates by type
const eventTemplates: Record<string, { titles: string[]; descriptions: string[] }> = {
  protest: {
    titles: [
      'Peaceful demonstration in city center',
      'Labor union rally draws thousands',
      'Environmental activists block main road',
      'Students protest tuition increases',
      'Opposition party holds rally',
    ],
    descriptions: [
      'Demonstrators gathered peacefully to voice concerns about local policies.',
      'The protest caused temporary road closures in the downtown area.',
      'Police are monitoring the situation closely.',
      'No violence reported; traffic delays expected.',
    ],
  },
  crime: {
    titles: [
      'Pickpocketing incidents reported in tourist areas',
      'Car break-ins on the rise',
      'Nightlife area robbery concerns',
      'Tourist targeted by scam artists',
      'ATM fraud warning issued',
    ],
    descriptions: [
      'Police advise visitors to be extra cautious in crowded areas.',
      'Incidents occurred mostly after dark.',
      'Local authorities have increased patrols.',
      'No serious injuries reported.',
    ],
  },
  violence: {
    titles: [
      'Isolated assault near nightlife district',
      'Bar fight injures several',
      'Robbery attempt turns violent',
    ],
    descriptions: [
      'Police responded quickly and apprehended suspects.',
      'Victims received minor injuries.',
      'Area has been secured.',
    ],
  },
  health: {
    titles: [
      'Seasonal flu cases increasing',
      'Heat health advisory issued',
      'Food safety notice for restaurants',
      'Water quality advisory lifted',
      'Vaccination recommendations updated',
    ],
    descriptions: [
      'Health officials recommend staying hydrated.',
      'Travelers should take standard precautions.',
      'No major outbreaks reported.',
    ],
  },
  natural: {
    titles: [
      'Minor earthquake felt in region',
      'Heavy rainfall causing flooding',
      'Tropical storm approaching coast',
      'Volcanic activity monitoring',
      'Wildfire near rural area',
    ],
    descriptions: [
      'No significant damage reported.',
      'Local authorities are prepared.',
      'Travel advisories may be updated.',
    ],
  },
  political: {
    titles: [
      'Election-related protests scheduled',
      'Government policy changes announced',
      'Diplomatic tensions affecting tourism',
      'New security measures implemented',
      'Political rally expected to draw crowds',
    ],
    descriptions: [
      'Travelers should avoid large gatherings.',
      'Stay updated with local news.',
      'Embassy contacts available for assistance.',
    ],
  },
};

// Get safety data for a country
export function getSafetyData(countryCode: string): SafetyData | null {
  const data = countryData[countryCode.toUpperCase()];
  if (!data) return null;

  const seed = generateFromSeed(countryCode);
  const variance = Math.floor(seededRandom(seed) * 20) - 10;
  const safetyScore = Math.max(30, Math.min(98, data.baseScore + variance));

  // Generate trend data for the last 30 days
  const trendData: TrendDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const daySeed = seed + i;
    const dailyScore = Math.max(30, Math.min(98, safetyScore + Math.floor(seededRandom(daySeed) * 10) - 5));
    trendData.push({
      date: date.toISOString().split('T')[0],
      score: dailyScore,
      events: Math.floor(seededRandom(daySeed + 100) * 5),
    });
  }

  // Calculate trend
  const recentAvg = trendData.slice(-7).reduce((sum, d) => sum + d.score, 0) / 7;
  const olderAvg = trendData.slice(0, 7).reduce((sum, d) => sum + d.score, 0) / 7;
  let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
  if (recentAvg - olderAvg > 3) trend = 'improving';
  else if (olderAvg - recentAvg > 3) trend = 'deteriorating';

  // Generate category scores
  const crimeScore = Math.max(20, Math.min(95, safetyScore + Math.floor(seededRandom(seed + 1) * 20) - 10));
  const protestScore = Math.max(30, Math.min(95, safetyScore + Math.floor(seededRandom(seed + 2) * 20) - 10));
  const healthScore = Math.max(40, Math.min(98, safetyScore + Math.floor(seededRandom(seed + 3) * 15) - 7));
  const naturalScore = Math.max(30, Math.min(95, safetyScore + Math.floor(seededRandom(seed + 4) * 25) - 12));
  const politicalScore = Math.max(25, Math.min(95, safetyScore + Math.floor(seededRandom(seed + 5) * 25) - 12));

  return {
    id: `saf-${countryCode.toLowerCase()}`,
    countryCode: countryCode.toUpperCase(),
    countryName: data.name,
    region: data.region,
    safetyScore,
    riskLevel: getRiskLevel(safetyScore),
    safetyScores: {
      overall: safetyScore,
      crime: crimeScore,
      protest: protestScore,
      health: healthScore,
      natural: naturalScore,
      political: politicalScore,
    },
    trend,
    trendData,
    lastUpdated: new Date().toISOString(),
    coordinates: data.coordinates,
  };
}

// Get all countries
export function getAllCountries(): SafetyData[] {
  return Object.keys(countryData).map((code) => getSafetyData(code)).filter(Boolean) as SafetyData[];
}

// Get recent incidents for a country
export function getRecentIncidents(countryCode: string, limit: number = 5): Incident[] {
  const data = countryData[countryCode.toUpperCase()];
  if (!data) return [];

  const seed = generateFromSeed(countryCode);
  const incidents: Incident[] = [];
  const eventTypes: Array<'protest' | 'crime' | 'violence' | 'health' | 'natural' | 'political'> = 
    ['protest', 'crime', 'violence', 'health', 'natural', 'political'];

  for (let i = 0; i < limit; i++) {
    const type = eventTypes[Math.floor(seededRandom(seed + i * 10) * eventTypes.length)];
    const typeIndex = eventTypes.indexOf(type);
    const templates = eventTemplates[type];
    const titleIndex = Math.floor(seededRandom(seed + i * 100) * templates.titles.length);
    
    const daysAgo = Math.floor(seededRandom(seed + i * 200) * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (type === 'violence') severity = 'high';
    else if (type === 'crime') severity = 'medium';

    incidents.push({
      id: `inc-${countryCode.toLowerCase()}-${i}`,
      type,
      severity,
      title: templates.titles[titleIndex],
      location: `${data.coordinates[0].toFixed(2)}, ${data.coordinates[1].toFixed(2)}`,
      date: date.toISOString(),
      description: templates.descriptions[Math.floor(seededRandom(seed + i * 300) * templates.descriptions.length)],
    });
  }

  return incidents;
}

// Get recommendations for a country
export function getRecommendations(safetyData: SafetyData): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { safetyScore, safetyScores, riskLevel } = safetyData;

  // Critical level recommendation
  if (riskLevel === 'critical') {
    recommendations.push({
      id: 'rec-critical',
      category: 'critical',
      icon: '🚨',
      title: 'High Risk Area',
      advice: 'Consider postponing non-essential travel. If you must travel, exercise extreme caution and maintain awareness of your surroundings at all times.',
      priority: 'high',
    });
  } else if (riskLevel === 'elevated') {
    recommendations.push({
      id: 'rec-elevated',
      category: 'caution',
      icon: '⚠️',
      title: 'Exercise Caution',
      advice: 'Stay alert in crowded areas and avoid large gatherings. Monitor local news and follow any travel advisories.',
      priority: 'medium',
    });
  }

  // Crime-specific recommendation
  if (safetyScores.crime < 65) {
    recommendations.push({
      id: 'rec-crime',
      category: 'crime',
      icon: '💰',
      title: 'Property Crime Risk',
      advice: 'Keep valuables secure and be aware of pickpocketing in tourist areas. Avoid displaying expensive items.',
      priority: 'medium',
    });
  }

  // Protest-specific recommendation
  if (safetyScores.protest < 60) {
    recommendations.push({
      id: 'rec-protest',
      category: 'protests',
      icon: '✊',
      title: 'Active Demonstrations',
      advice: 'Avoid protest areas and political gatherings. Carry ID and have an exit plan. Stay informed about local events.',
      priority: 'medium',
    });
  }

  // Health recommendation
  if (safetyScores.health < 70) {
    recommendations.push({
      id: 'rec-health',
      category: 'health',
      icon: '🏥',
      title: 'Health Precautions',
      advice: 'Check vaccination requirements and travel health advisories. Consider travel insurance with medical coverage.',
      priority: 'medium',
    });
  }

  // Natural disaster recommendation
  if (safetyScores.natural < 65) {
    recommendations.push({
      id: 'rec-natural',
      category: 'natural',
      icon: '🌊',
      title: 'Natural Hazard Awareness',
      advice: 'Be aware of weather conditions and any natural disaster risks in the region. Know emergency procedures.',
      priority: 'medium',
    });
  }

  // Always include general safety recommendation
  recommendations.push({
    id: 'rec-general',
    category: 'general',
    icon: '📱',
    title: 'Stay Connected',
    advice: 'Keep your embassy contact saved, share your location with someone trusted, and download offline maps.',
    priority: 'standard',
  });

  return recommendations;
}

// Get news feed for a country
export function getNewsFeed(countryCode: string, limit: number = 10): NewsItem[] {
  const data = countryData[countryCode.toUpperCase()];
  if (!data) return [];

  const seed = generateFromSeed(countryCode);
  const news: NewsItem[] = [];
  const sources = ['Reuters', 'BBC News', 'AP News', 'The Guardian', 'Al Jazeera', 'Local News'];
  const headlines = [
    'Tourism industry shows signs of recovery',
    'New cultural festival announced',
    'Government invests in infrastructure',
    'Local economy grows steadily',
    'New flight routes connect to major cities',
    'Historic sites reopen after renovation',
    'Travelers praise local hospitality',
    'New hotel openings expected this year',
    'Cultural preservation efforts underway',
    'Sustainable tourism initiatives launched',
  ];

  for (let i = 0; i < limit; i++) {
    const daysAgo = Math.floor(seededRandom(seed + i * 50) * 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const sentimentValue = seededRandom(seed + i * 100);
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (sentimentValue > 0.6) sentiment = 'positive';
    else if (sentimentValue < 0.4) sentiment = 'negative';

    news.push({
      id: `news-${countryCode.toLowerCase()}-${i}`,
      headline: headlines[Math.floor(seededRandom(seed + i * 150) * headlines.length)],
      source: sources[Math.floor(seededRandom(seed + i * 200) * sources.length)],
      date: date.toISOString(),
      sentiment,
      url: `https://example.com/news/${countryCode.toLowerCase()}/${i}`,
    });
  }

  return news;
}

// Search destinations
export function searchDestinations(query: string): SafetyData[] {
  const lowercaseQuery = query.toLowerCase();
  return getAllCountries().filter(
    (country) =>
      country.countryName.toLowerCase().includes(lowercaseQuery) ||
      country.countryCode.toLowerCase().includes(lowercaseQuery) ||
      country.region.toLowerCase().includes(lowercaseQuery)
  );
}

// Helper function to get risk level
function getRiskLevel(score: number): 'safe' | 'moderate' | 'elevated' | 'critical' {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'elevated';
  return 'critical';
}
