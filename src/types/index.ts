// Safety Score Types
export type RiskLevel = 'safe' | 'moderate' | 'elevated' | 'critical';

export type EventType = 
  | 'protest' 
  | 'crime' 
  | 'violence' 
  | 'health' 
  | 'natural' 
  | 'political'
  | 'general';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Safety Data Types
export interface SafetyScore {
  overall: number;
  crime: number;
  protest: number;
  health: number;
  natural: number;
  political: number;
}

export interface SafetyData {
  id: string;
  countryCode: string;
  countryName: string;
  region: string;
  safetyScore: number;
  riskLevel: RiskLevel;
  safetyScores: SafetyScore;
  trend: 'improving' | 'stable' | 'deteriorating';
  trendData: TrendDataPoint[];
  lastUpdated: string;
  coordinates: [number, number];
}

// Event and Incident Types
export interface SafetyEvent {
  id: string;
  type: EventType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location: string;
  countryCode: string;
  date: string;
  sourceUrl?: string;
  recommendations?: string[];
}

export interface Incident {
  id: string;
  type: EventType;
  severity: AlertSeverity;
  title: string;
  location: string;
  date: string;
  description: string;
}

// Alert Types
export interface Alert {
  id: string;
  destinationId: string;
  destinationName: string;
  type: EventType;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  sourceUrl?: string;
  coordinates?: [number, number];
  affectedAreas?: string[];
  recommendations?: string[];
  isRead: boolean;
}

export interface AlertConfig {
  critical: EventType[];
  important: EventType[];
  moderate: EventType[];
}

export interface WatchedDestination {
  id: string;
  destinationName: string;
  countryCode: string;
  coordinates: [number, number];
  alertLevel: 'all' | 'critical' | 'custom';
  isActive: boolean;
  createdAt: string;
}

// Chart Data Types
export interface TrendDataPoint {
  date: string;
  score: number;
  events: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

// Dashboard Types
export interface DashboardData {
  safetyData: SafetyData;
  recentIncidents: Incident[];
  recommendations: Recommendation[];
  newsFeed: NewsItem[];
}

export interface Recommendation {
  id: string;
  category: string;
  icon: string;
  title: string;
  advice: string;
  priority: 'high' | 'medium' | 'standard';
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  url: string;
}

// Comparison Types
export interface ComparisonItem {
  safetyData: SafetyData;
  rank: number;
}

export interface ComparisonMetrics {
  safetyScore: number;
  crimeRate: string;
  politicalStability: string;
  healthRisk: string;
  naturalDisasterRisk: string;
  tourismInfrastructure: string;
  overallRisk: RiskLevel;
}

// User Preferences Types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    criticalOnly: boolean;
  };
  defaultView: 'map' | 'dashboard';
  distanceUnit: 'km' | 'miles';
}

// Search Types
export interface SearchResult {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  type: 'country' | 'city' | 'region';
  coordinates: [number, number];
  safetyScore: number;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// PWA Types
export interface PWAInstallPrompt {
  dismissed: boolean;
  installTime?: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
