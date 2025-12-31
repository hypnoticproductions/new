'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SafetyData } from '@/types';
import { Card } from '@/components/ui';
import { getRiskLevel } from '@/lib/utils';
import { MapPin, Search, Layers } from 'lucide-react';
import { Input } from '@/components/ui';

// Dynamic import for Leaflet map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// World GeoJSON data (simplified)
const worldGeoJson = {
  type: 'FeatureCollection',
  features: [
    // This would typically be loaded from a separate file
    // For demo purposes, we'll use country markers instead
  ],
};

// Color mapping for risk levels
const getRiskColor = (score: number): string => {
  const level = getRiskLevel(score);
  switch (level) {
    case 'safe':
      return '#10b981';
    case 'moderate':
      return '#f59e0b';
    case 'elevated':
      return '#f97316';
    case 'critical':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

// Sample country centroids for markers
const countryCentroids: Record<string, [number, number]> = {
  US: [37.0902, -95.7129],
  GB: [55.3781, -3.4360],
  FR: [46.2276, 2.2137],
  DE: [51.1657, 10.4515],
  IT: [41.8719, 12.5674],
  ES: [40.4637, -3.7492],
  JP: [36.2048, 138.2529],
  CN: [35.8617, 104.1954],
  IN: [20.5937, 78.9629],
  TH: [15.8700, 100.9925],
  VN: [14.0583, 108.2772],
  ID: [-0.7893, 113.9213],
  AU: [-25.2744, 133.7751],
  CA: [56.1304, -106.3468],
  MX: [23.6345, -102.5528],
  BR: [-14.2350, -51.9253],
  KR: [35.9078, 127.7669],
  SG: [1.3521, 103.8198],
  AE: [23.4241, 53.8478],
  ZA: [-30.5595, 22.9375],
  EG: [26.8206, 30.8025],
  TR: [38.9637, 35.2433],
  GR: [39.0742, 21.8243],
  PT: [39.3999, -8.2245],
  NL: [52.1326, 5.2913],
  CH: [46.8182, 8.2275],
  AT: [47.5162, 14.5501],
  SE: [60.1282, 18.6435],
  NO: [60.4720, 8.4689],
  DK: [56.2639, 9.5018],
  FI: [61.9241, 25.7482],
  IE: [53.1424, -7.6921],
  BE: [50.5039, 4.4699],
  PL: [51.9194, 19.1451],
  CZ: [49.8175, 15.4730],
  HU: [47.1625, 19.5033],
  RO: [45.9432, 24.9668],
  UA: [48.3794, 31.1656],
  RU: [61.5240, 105.3188],
  IL: [31.0461, 34.8516],
  SA: [23.8859, 45.0792],
  PK: [30.3753, 69.3451],
  BD: [23.6850, 90.3563],
  PH: [12.8797, 121.7740],
  MY: [4.2105, 101.9758],
  NZ: [-40.9006, 174.8860],
  AR: [-38.4161, -63.6167],
  CL: [-35.6751, -71.5430],
  CO: [4.5709, -74.2973],
  PE: [-9.1900, -75.0152],
  NG: [9.0820, 8.6753],
  KE: [-0.0236, 37.9062],
  MA: [31.7917, -7.0926],
};

interface SafetyMapProps {
  safetyData: SafetyData[];
  onCountrySelect?: (country: SafetyData) => void;
  selectedCountry?: string;
}

export function SafetyMap({ safetyData, onCountrySelect, selectedCountry }: SafetyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState<'safety' | 'crime' | 'health'>('safety');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredData = safetyData.filter(
    (country) =>
      country.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.countryCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredData.length > 0 && onCountrySelect) {
      onCountrySelect(filteredData[0]);
    }
  };

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[500px] bg-gray-100 dark:bg-dark-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Card className="p-2 min-w-[250px]">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none focus:outline-none placeholder:text-gray-400"
            />
          </form>
        </Card>

        {/* Search results dropdown */}
        {searchQuery && filteredData.length > 0 && (
          <Card className="p-2 max-h-[200px] overflow-y-auto">
            {filteredData.slice(0, 5).map((country) => (
              <button
                key={country.id}
                onClick={() => {
                  onCountrySelect?.(country);
                  setSearchQuery('');
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center justify-between"
              >
                <span>{country.countryName}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRiskColor(country.safetyScore) }}
                />
              </button>
            ))}
          </Card>
        )}
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Card className="p-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveLayer('safety')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeLayer === 'safety'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              Safety
            </button>
            <button
              onClick={() => setActiveLayer('crime')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeLayer === 'crime'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              Crime
            </button>
            <button
              onClick={() => setActiveLayer('health')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeLayer === 'health'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              Health
            </button>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="p-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Level</p>
          <div className="space-y-1">
            {[
              { level: 'Safe', color: '#10b981', score: '80-100' },
              { level: 'Caution', color: '#f59e0b', score: '60-79' },
              { level: 'Elevated', color: '#f97316', score: '40-59' },
              { level: 'High Risk', color: '#ef4444', score: '0-39' },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.level}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {safetyData.map((country) => {
          const coordinates = countryCentroids[country.countryCode] || country.coordinates;
          const score =
            activeLayer === 'safety'
              ? country.safetyScore
              : activeLayer === 'crime'
              ? country.safetyScores.crime
              : country.safetyScores.health;
          const color = getRiskColor(score);

          return (
            <Marker
              key={country.id}
              position={coordinates}
              eventHandlers={{
                click: () => onCountrySelect?.(country),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {country.countryName}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Safety Score: <span className="font-medium">{country.safetyScore}/100</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Risk Level:{' '}
                      <span
                        className="font-medium"
                        style={{ color }}
                      >
                        {country.riskLevel.charAt(0).toUpperCase() + country.riskLevel.slice(1)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Trend: {country.trend.charAt(0).toUpperCase() + country.trend.slice(1)}
                    </p>
                  </div>
                  <button
                    onClick={() => onCountrySelect?.(country)}
                    className="mt-3 w-full px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

interface CountryLayerProps {
  data: SafetyData[];
  onCountryClick?: (country: SafetyData) => void;
}

export function CountryLayer({ data, onCountryClick }: CountryLayerProps) {
  // This would typically render country polygons using GeoJSON
  // For demo purposes, we're using markers instead
  return null;
}

interface EventMarkersProps {
  events: Array<{
    id: string;
    coordinates: [number, number];
    type: string;
    severity: string;
    title: string;
  }>;
  onEventClick?: (event: {
    id: string;
    coordinates: [number, number];
    type: string;
    severity: string;
    title: string;
  }) => void;
}

export function EventMarkers({ events, onEventClick }: EventMarkersProps) {
  return (
    <>
      {events.map((event) => (
        <Marker
          key={event.id}
          position={event.coordinates}
          eventHandlers={{
            click: () => onEventClick?.(event),
          }}
        >
          <Popup>
            <div className="p-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{event.type}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
