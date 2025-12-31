'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/AppContext';
import { Card, Badge, Button, Input, Spinner, EmptyState } from '@/components/ui';
import { SafetyComparisonChart, TrendChart } from '@/components/charts/TrendCharts';
import { SafetyData } from '@/types';
import { getSafetyData, getRecentIncidents, getRecommendations } from '@/lib/mock-gdelt';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  Search,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  TrendingUp,
  Plus,
  Trash2,
  Globe,
  Home,
  ArrowRightLeft,
  Download,
  Share2,
  Check,
} from 'lucide-react';

function Header() {
  const { theme, setTheme, resolvedTheme } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
              <Home className="h-4 w-4" /> Home
            </Link>
            <Link href="/dashboard" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/compare" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
              <ArrowRightLeft className="h-4 w-4" /> Compare
            </Link>
            <Link href="/alerts" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
              <Bell className="h-4 w-4" /> Alerts
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-600">
            <nav className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">Home</Link>
              <Link href="/dashboard" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">Dashboard</Link>
              <Link href="/compare" className="px-4 py-2 text-primary-600 dark:text-primary-400">Compare</Link>
              <Link href="/alerts" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">Alerts</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function CompareContent() {
  const { countries, setSelectedCountry } = useApp();
  const [selectedDestinations, setSelectedDestinations] = useState<SafetyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SafetyData[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = countries.filter(
        (c) =>
          c.countryName.toLowerCase().includes(query.toLowerCase()) ||
          c.countryCode.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const addDestination = (country: SafetyData) => {
    if (selectedDestinations.length < 4 && !selectedDestinations.find((c) => c.id === country.id)) {
      setSelectedDestinations([...selectedDestinations, country]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeDestination = (countryId: string) => {
    setSelectedDestinations(selectedDestinations.filter((c) => c.id !== countryId));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="safe">Safe</Badge>;
    if (score >= 60) return <Badge variant="moderate">Caution</Badge>;
    if (score >= 40) return <Badge variant="elevated">Elevated</Badge>;
    return <Badge variant="critical">High Risk</Badge>;
  };

  // Sort by safety score for "safest" recommendation
  const sortedBySafety = [...selectedDestinations].sort((a, b) => b.safetyScore - a.safetyScore);
  const safestDestination = sortedBySafety[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Compare Destinations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Side-by-side safety comparison for up to 4 destinations
          </p>
        </div>

        {/* Add Destination */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Add destination to compare..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pl-10"
            />
            {searchResults.length > 0 && (
              <Card className="absolute top-full mt-1 w-full z-50">
                {searchResults.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => addDestination(country)}
                    disabled={selectedDestinations.length >= 4}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center justify-between disabled:opacity-50"
                  >
                    <div>
                      <span className="font-medium">{country.countryName}</span>
                      <span className="text-sm text-gray-500 ml-2">({country.countryCode})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getScoreColor(country.safetyScore) }}
                      />
                      <span className="text-sm">{country.safetyScore}</span>
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>
        </div>

        {/* Safest Recommendation */}
        {safestDestination && selectedDestinations.length > 1 && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Safest Option</p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {safestDestination.countryName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Highest safety score: {safestDestination.safetyScore}/100
                </p>
              </div>
              <Button
                onClick={() => setSelectedCountry(safestDestination)}
                variant="outline"
              >
                View Details
              </Button>
            </div>
          </Card>
        )}

        {/* Selected Destinations */}
        {selectedDestinations.length === 0 ? (
          <Card className="p-12 text-center">
            <Globe className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No destinations selected
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Search and add up to 4 destinations to compare safety scores
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" />
              Add Destination
            </Button>
          </Card>
        ) : (
          <>
            {/* Selected Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedDestinations.map((country) => (
                <div
                  key={country.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-dark-800 rounded-full border border-gray-200 dark:border-dark-600"
                >
                  <span className="text-sm font-medium">{country.countryName}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getScoreColor(country.safetyScore) }}
                  />
                  <button
                    onClick={() => removeDestination(country.id)}
                    className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {selectedDestinations.map((country) => {
                const incidents = getRecentIncidents(country.countryCode);
                const recommendations = getRecommendations(country);

                return (
                  <Card key={country.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {country.countryName}
                      </h3>
                      <button
                        onClick={() => removeDestination(country.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Score Circle */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-gray-200 dark:text-dark-600"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={getScoreColor(country.safetyScore)}
                            strokeWidth="8"
                            strokeDasharray={`${(country.safetyScore / 100) * 251.2} 251.2`}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {country.safetyScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mb-4">{getRiskBadge(country.safetyScore)}</div>

                    {/* Quick Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Crime</span>
                        <span className="font-medium">{country.safetyScores.crime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Health</span>
                        <span className="font-medium">{country.safetyScores.health}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Political</span>
                        <span className="font-medium">{country.safetyScores.political}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                      <p className="text-xs text-gray-500">
                        Trend: <span className="font-medium capitalize">{country.trend}</span>
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Chart */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Safety Score Comparison
              </h3>
              <SafetyComparisonChart
                data={selectedDestinations.map((c) => ({
                  name: c.countryName,
                  score: c.safetyScore,
                  color: getScoreColor(c.safetyScore),
                }))}
              />
            </Card>

            {/* Detailed Comparison Table */}
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Detailed Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Metric
                      </th>
                      {selectedDestinations.map((c) => (
                        <th
                          key={c.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {c.countryName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Overall Safety
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getScoreColor(c.safetyScore) }}
                            />
                            <span className="font-medium">{c.safetyScore}/100</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Crime & Safety
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          {c.safetyScores.crime}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Civil Unrest
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          {c.safetyScores.protest}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Health Risk
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          {c.safetyScores.health}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Natural Disasters
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          {c.safetyScores.natural}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Political Stability
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          {c.safetyScores.political}/100
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Trend
                      </td>
                      {selectedDestinations.map((c) => (
                        <td key={c.id} className="px-6 py-4 text-sm">
                          <span
                            className={`capitalize ${
                              c.trend === 'improving'
                                ? 'text-emerald-500'
                                : c.trend === 'deteriorating'
                                ? 'text-red-500'
                                : 'text-gray-500'
                            }`}
                          >
                            {c.trend}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Export Comparison
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <AppProvider>
      <CompareContent />
    </AppProvider>
  );
}
