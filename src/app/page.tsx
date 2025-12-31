'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AppProvider, useApp } from '@/lib/AppContext';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { SafetyMap } from '@/components/map/SafetyMap';
import { SafetyScoreCard, CategoryBreakdown, RecentIncidents, Recommendations } from '@/components/dashboard/SafetyDashboard';
import { TrendChart } from '@/components/charts/TrendCharts';
import { AlertFeed, NotificationBell, WatchedDestinations } from '@/components/alerts/AlertManager';
import { getSafetyData, getRecentIncidents, getRecommendations } from '@/lib/mock-gdelt';
import {
  Map,
  BarChart3,
  Bell,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Globe2,
  ChevronRight,
  Search,
} from 'lucide-react';

// Dynamic import for map to avoid SSR issues
const MapView = dynamic(() => import('@/app/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 dark:bg-dark-800 rounded-xl flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  ),
});

function Header() {
  const { theme, setTheme, resolvedTheme, unreadCount } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              SafeTravel<span className="text-primary-600">Monitor</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Map
            </Link>
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Dashboard
            </Link>
            <Link href="/compare" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Compare
            </Link>
            <Link href="/alerts" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Alerts
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadCount} onClick={() => {}} />

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

            {/* Mobile menu button */}
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
              <Link href="/" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                Map
              </Link>
              <Link href="/dashboard" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                Dashboard
              </Link>
              <Link href="/compare" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                Compare
              </Link>
              <Link href="/alerts" className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                Alerts
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <Badge variant="safe" className="mb-4">
            🌍 Real-time safety intelligence for travelers
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Know Before You <span className="text-primary-400">Go</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Make informed travel decisions with real-time safety scores, alerts, and risk assessments 
            for every destination on Earth. Powered by global news analysis in 100+ languages.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                <Globe className="h-5 w-5" />
                Explore Safety Map
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-600 text-white hover:bg-gray-800">
                <Bell className="h-5 w-5" />
                Set Up Alerts
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '195+', label: 'Countries Covered' },
            { value: '100+', label: 'Languages Analyzed' },
            { value: '24/7', label: 'Real-Time Updates' },
            { value: '50M+', label: 'Data Points Daily' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Map className="h-6 w-6" />,
      title: 'Interactive Safety Map',
      description: 'World map showing color-coded safety scores for all countries. Click to view detailed breakdowns.',
      color: 'bg-blue-500',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Safety Dashboard',
      description: 'Detailed analytics with 30-day trends, category breakdowns, and historical data.',
      color: 'bg-emerald-500',
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: 'Real-Time Alerts',
      description: 'Get notified immediately about safety events in your watched destinations.',
      color: 'bg-amber-500',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Comparison Tool',
      description: 'Compare safety metrics between multiple destinations side-by-side.',
      color: 'bg-purple-500',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Smart Recommendations',
      description: 'AI-powered safety tips based on your destination and current conditions.',
      color: 'bg-orange-500',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Travel Insurance Ready',
      description: 'Export safety reports for travel insurance and trip planning.',
      color: 'bg-cyan-500',
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need for Safe Travels
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive safety intelligence powered by advanced data analysis and real-time monitoring.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationPreview() {
  const { countries, setSelectedCountry } = useApp();
  const [previewCountry, setPreviewCountry] = useState(countries[0]);

  useEffect(() => {
    if (countries.length > 0 && !previewCountry) {
      setPreviewCountry(countries[0]);
    }
  }, [countries, previewCountry]);

  const sampleCountry = previewCountry || countries[0];
  const incidents = sampleCountry ? getRecentIncidents(sampleCountry.countryCode) : [];
  const recommendations = sampleCountry ? getRecommendations(sampleCountry) : [];

  if (!sampleCountry) {
    return (
      <div className="w-full h-[500px] bg-gray-100 dark:bg-dark-800 rounded-xl flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            See Safety Data in Action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore real-time safety information for destinations worldwide
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden h-[500px]">
              <SafetyMap
                safetyData={countries}
                onCountrySelect={setPreviewCountry}
                selectedCountry={previewCountry?.countryCode}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SafetyScoreCard safetyData={sampleCountry} />
            <CategoryBreakdown scores={sampleCountry.safetyScores} />
            <RecentIncidents incidents={incidents} maxItems={3} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Start Traveling Smarter Today
        </h2>
        <p className="text-xl text-primary-100 mb-8">
          Get real-time safety intelligence for your next adventure. Join millions of travelers who trust SafeTravel Monitor.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              <Globe className="h-5 w-5" />
              Explore the Map
            </Button>
          </Link>
          <Link href="/alerts">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
              Create Alert
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                SafeTravel<span className="text-primary-400">Monitor</span>
              </span>
            </div>
            <p className="text-sm">
              Real-time safety intelligence for travelers worldwide. Know before you go.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Safety Map</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Comparison Tool</Link></li>
              <li><Link href="/alerts" className="hover:text-white transition-colors">Alert System</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Analytics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Travel Guidelines</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Safety Tips</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Embassy Finder</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          <p>© 2024 SafeTravel Monitor. All rights reserved.</p>
          <p className="mt-2">
            Powered by GDELT global news analysis in 100+ languages.
          </p>
        </div>
      </div>
    </footer>
  );
}

function MainContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DestinationPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
