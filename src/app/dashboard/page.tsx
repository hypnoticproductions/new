'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/AppContext';
import dynamic from 'next/dynamic';
import { SafetyMap } from '@/components/map/SafetyMap';
import {
  SafetyScoreCard,
  CategoryBreakdown,
  RecentIncidents,
  Recommendations,
  DestinationHeader,
} from '@/components/dashboard/SafetyDashboard';
import { TrendChart, RadarChart, EventsTimeline } from '@/components/charts/TrendCharts';
import { AlertFeed, NotificationBell, WatchedDestinations } from '@/components/alerts/AlertManager';
import { Card, Badge, Button, Input, Spinner, EmptyState } from '@/components/ui';
import { getSafetyData, getRecentIncidents, getRecommendations, getNewsFeed, searchDestinations } from '@/lib/mock-gdelt';
import { SafetyData } from '@/types';
import {
  Map,
  BarChart3,
  Bell,
  Search,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Globe,
  Shield,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Share2,
  ChevronRight,
  Home,
} from 'lucide-react';
import Link from 'next/link';

const MapView = dynamic(() => import('@/app/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-dark-800 rounded-xl flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  ),
});

function Header() {
  const { theme, setTheme, resolvedTheme, unreadCount, alerts } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                SafeTravel<span className="text-primary-600">Monitor</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="/dashboard" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/compare" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <TrendingUp className="h-4 w-4" />
              Compare
            </Link>
            <Link href="/alerts" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Bell className="h-4 w-4" />
              Alerts
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Alerts dropdown */}
              {showAlerts && (
                <div className="absolute right-0 mt-2 w-96 z-50">
                  <AlertFeed alerts={alerts.slice(0, 5)} maxItems={5} />
                </div>
              )}
            </div>

            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-600">
            <nav className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center gap-2">
                <Home className="h-4 w-4" /> Home
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-primary-600 dark:text-primary-400 font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link href="/compare" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Compare
              </Link>
              <Link href="/alerts" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg flex items-center gap-2">
                <Bell className="h-4 w-4" /> Alerts
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function DashboardContent() {
  const { countries, selectedCountry, setSelectedCountry, currentDestinationData, loadDestinationData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SafetyData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'incidents' | 'recommendations'>('overview');

  useEffect(() => {
    if (selectedCountry) {
      loadDestinationData(selectedCountry.countryCode);
    }
  }, [selectedCountry, loadDestinationData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults(searchDestinations(query));
    } else {
      setSearchResults([]);
    }
  };

  const displayCountry = selectedCountry || countries[0];
  const safetyData = currentDestinationData.safetyData;
  const incidents = currentDestinationData.incidents;
  const recommendations = currentDestinationData.recommendations;

  if (!displayCountry) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pl-10"
            />
            {searchResults.length > 0 && (
              <Card className="absolute top-full mt-1 w-full z-50 max-h-60 overflow-y-auto">
                {searchResults.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => {
                      setSelectedCountry(country);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center justify-between"
                  >
                    <span className="font-medium">{country.countryName}</span>
                    <Badge
                      variant={
                        country.riskLevel === 'safe'
                          ? 'safe'
                          : country.riskLevel === 'moderate'
                          ? 'moderate'
                          : country.riskLevel === 'elevated'
                          ? 'elevated'
                          : 'critical'
                      }
                    >
                      {country.safetyScore}
                    </Badge>
                  </button>
                ))}
              </Card>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Destination Header */}
        <div className="mb-8">
          <DestinationHeader safetyData={displayCountry} />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-dark-700">
          <nav className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: <Shield className="h-4 w-4" /> },
              { id: 'trends', label: 'Trends', icon: <TrendingUp className="h-4 w-4" /> },
              { id: 'incidents', label: 'Incidents', icon: <Calendar className="h-4 w-4" /> },
              { id: 'recommendations', label: 'Recommendations', icon: <BarChart3 className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Map */}
                <Card className="overflow-hidden">
                  <div className="h-[400px]">
                    <SafetyMap
                      safetyData={countries}
                      onCountrySelect={setSelectedCountry}
                      selectedCountry={displayCountry.countryCode}
                    />
                  </div>
                </Card>

                {/* Category Breakdown */}
                <CategoryBreakdown scores={displayCountry.safetyScores} />
              </>
            )}

            {activeTab === 'trends' && (
              <>
                <TrendChart
                  data={displayCountry.trendData}
                  title="30-Day Safety Trend"
                  height={350}
                />

                {/* Radar Chart for categories */}
                <RadarChart
                  data={{
                    labels: ['Crime', 'Protests', 'Health', 'Natural', 'Political'],
                    datasets: [
                      {
                        label: displayCountry.countryName,
                        data: [
                          displayCountry.safetyScores.crime,
                          displayCountry.safetyScores.protest,
                          displayCountry.safetyScores.health,
                          displayCountry.safetyScores.natural,
                          displayCountry.safetyScores.political,
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    ],
                  }}
                  title="Safety Categories Overview"
                />
              </>
            )}

            {activeTab === 'incidents' && (
              <RecentIncidents incidents={incidents} maxItems={10} />
            )}

            {activeTab === 'recommendations' && (
              <Recommendations recommendations={recommendations} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Safety Score */}
            <SafetyScoreCard safetyData={displayCountry} showTrend />

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Region</span>
                  <span className="text-sm font-medium">{displayCountry.region}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Coordinates</span>
                  <span className="text-sm font-medium">
                    {displayCountry.coordinates[0].toFixed(2)}°, {displayCountry.coordinates[1].toFixed(2)}°
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="text-sm font-medium">
                    {new Date(displayCountry.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                  <Badge
                    variant={
                      displayCountry.trend === 'improving'
                        ? 'safe'
                        : displayCountry.trend === 'deteriorating'
                        ? 'critical'
                        : 'moderate'
                    }
                  >
                    {displayCountry.trend.charAt(0).toUpperCase() + displayCountry.trend.slice(1)}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Watched Destinations */}
            <WatchedDestinations
              destinations={[]}
              onRemove={() => {}}
              onAdd={() => {}}
            />

            {/* Recent Alerts */}
            <AlertFeed alerts={[]} maxItems={3} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
