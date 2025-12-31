'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/AppContext';
import { Card, Badge, Button, Input, Spinner, EmptyState } from '@/components/ui';
import { AlertCard, WatchedDestinations } from '@/components/alerts/AlertManager';
import { Alert, WatchedDestination } from '@/types';
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
  BellOff,
  Filter,
  Download,
  Check,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
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
            <Link href="/compare" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
              <TrendingUp className="h-4 w-4" /> Compare
            </Link>
            <Link href="/alerts" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
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
              <Link href="/compare" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">Compare</Link>
              <Link href="/alerts" className="px-4 py-2 text-primary-600 dark:text-primary-400">Alerts</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function AlertsContent() {
  const { alerts, dismissAlert, unreadCount, watchedDestinations, addWatchedDestination, removeWatchedDestination, countries } = useApp();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showRead, setShowRead] = useState(true);
  const [newDestination, setNewDestination] = useState('');

  const filteredAlerts = alerts
    .filter((alert) => {
      if (!showRead && alert.isRead) return false;
      if (filter !== 'all' && alert.severity !== filter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  };

  const handleAddDestination = () => {
    if (newDestination.trim()) {
      const code = newDestination.trim().substring(0, 2).toUpperCase();
      if (!watchedDestinations.includes(code)) {
        addWatchedDestination(code);
      }
      setNewDestination('');
    }
  };

  // Create sample watched destinations from state
  const watchedDestData: WatchedDestination[] = watchedDestinations.map((code, index) => {
    const country = countries.find((c) => c.countryCode === code);
    return {
      id: `watched-${index}`,
      destinationName: country?.countryName || code,
      countryCode: code,
      coordinates: country?.coordinates || [0, 0],
      alertLevel: 'all',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Alert Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor safety alerts for your watched destinations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertCounts.critical}</p>
                <p className="text-sm text-gray-500">Critical</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertCounts.high}</p>
                <p className="text-sm text-gray-500">High</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertCounts.medium}</p>
                <p className="text-sm text-gray-500">Medium</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{watchedDestinations.length}</p>
                <p className="text-sm text-gray-500">Watched</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Alerts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                  {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        filter === f
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-dark-700'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f !== 'all' && <span className="ml-1 text-gray-400">({alertCounts[f]})</span>}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={showRead}
                      onChange={(e) => setShowRead(e.target.checked)}
                      className="rounded border-gray-300 dark:border-dark-600"
                    />
                    Show read
                  </label>
                </div>
              </div>
            </Card>

            {/* Alerts List */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Alerts</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredAlerts.length} alerts matching your filters
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="critical">{unreadCount} unread</Badge>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-dark-700 max-h-[600px] overflow-y-auto">
                {filteredAlerts.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <BellOff className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No alerts found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {filter !== 'all'
                        ? `No ${filter} severity alerts matching your filters`
                        : 'Add watched destinations to receive alerts'}
                    </p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className="p-4">
                      <AlertCard
                        alert={alert}
                        onDismiss={dismissAlert}
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add Watched Destination */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Watched Destinations
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add destinations to monitor for safety alerts
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Country code (e.g., TH)"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDestination()}
                  className="input flex-1"
                  maxLength={2}
                />
                <Button onClick={handleAddDestination}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {watchedDestData.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No destinations being watched
                  </p>
                ) : (
                  watchedDestData.map((dest) => (
                    <div
                      key={dest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{dest.destinationName}</span>
                      </div>
                      <button
                        onClick={() => removeWatchedDestination(dest.countryCode)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Alert Settings */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Alert Settings
              </h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Critical alerts</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 dark:border-dark-600"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">High priority alerts</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 dark:border-dark-600"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Medium alerts</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 dark:border-dark-600"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Low priority alerts</span>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-dark-600"
                  />
                </label>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4" />
                  Mark all as read
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4" />
                  Export alert history
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4" />
                  Notification settings
                </Button>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Real-Time Monitoring
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Alerts are generated based on global news analysis. You&apos;ll receive notifications 
                    for your watched destinations as events unfold.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <AppProvider>
      <AlertsContent />
    </AppProvider>
  );
}
