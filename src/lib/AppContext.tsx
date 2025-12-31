'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserPreferences, Alert, SafetyData } from '@/types';
import { getAllCountries, getSafetyData, getRecentIncidents, getRecommendations, getNewsFeed } from '@/lib/mock-gdelt';

interface AppContextType {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';

  // Data
  countries: SafetyData[];
  selectedCountry: SafetyData | null;
  setSelectedCountry: (country: SafetyData | null) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  unreadCount: number;

  // Watched destinations
  watchedDestinations: string[];
  addWatchedDestination: (countryCode: string) => void;
  removeWatchedDestination: (countryCode: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Current destination data
  currentDestinationData: {
    safetyData: SafetyData | null;
    incidents: ReturnType<typeof getRecentIncidents>;
    recommendations: ReturnType<typeof getRecommendations>;
    newsFeed: ReturnType<typeof getNewsFeed>;
  };
  loadDestinationData: (countryCode: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Theme state
  const [theme, setTheme] = useState<UserPreferences['theme']>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('safetravel-theme') as UserPreferences['theme'] | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme);
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    localStorage.setItem('safetravel-theme', theme);
  }, [resolvedTheme, theme]);

  // Countries data
  const [countries, setCountries] = useState<SafetyData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<SafetyData | null>(null);

  useEffect(() => {
    const data = getAllCountries();
    setCountries(data);
  }, []);

  // Current destination data
  const [currentDestinationData, setCurrentDestinationData] = useState<AppContextType['currentDestinationData']>({
    safetyData: null,
    incidents: [],
    recommendations: [],
    newsFeed: [],
  });

  const loadDestinationData = (countryCode: string) => {
    const safetyData = getSafetyData(countryCode);
    if (safetyData) {
      setCurrentDestinationData({
        safetyData,
        incidents: getRecentIncidents(countryCode),
        recommendations: getRecommendations(safetyData),
        newsFeed: getNewsFeed(countryCode),
      });
    }
  };

  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * countries.length);
      const country = countries[randomIndex];
      if (country) {
        const alertTypes: Array<'protest' | 'crime' | 'health' | 'natural' | 'political'> = [
          'protest',
          'crime',
          'health',
          'natural',
          'political',
        ];
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          destinationId: country.id,
          destinationName: country.countryName,
          type,
          severity: severities[Math.floor(Math.random() * severities.length)],
          title: `New ${type} activity reported in ${country.countryName}`,
          description: `Recent events indicate potential ${type}-related incidents. Monitor the situation.`,
          timestamp: new Date().toISOString(),
          coordinates: country.coordinates,
          recommendations: ['Stay informed', 'Follow local news', 'Exercise caution'],
          isRead: false,
        };

        setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
        setUnreadCount((prev) => prev + 1);
      }
    }, 45000); // New alert every 45 seconds

    return () => clearInterval(interval);
  }, [countries]);

  const addAlert = (alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Watched destinations
  const [watchedDestinations, setWatchedDestinations] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('safetravel-watched');
    if (stored) {
      setWatchedDestinations(JSON.parse(stored));
    }
  }, []);

  const addWatchedDestination = (countryCode: string) => {
    const updated = [...watchedDestinations, countryCode];
    setWatchedDestinations(updated);
    localStorage.setItem('safetravel-watched', JSON.stringify(updated));
  };

  const removeWatchedDestination = (countryCode: string) => {
    const updated = watchedDestinations.filter((c) => c !== countryCode);
    setWatchedDestinations(updated);
    localStorage.setItem('safetravel-watched', JSON.stringify(updated));
  };

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const value: AppContextType = {
    theme,
    setTheme,
    resolvedTheme,
    countries,
    selectedCountry,
    setSelectedCountry,
    alerts,
    addAlert,
    dismissAlert,
    unreadCount,
    watchedDestinations,
    addWatchedDestination,
    removeWatchedDestination,
    isLoading,
    setIsLoading,
    currentDestinationData,
    loadDestinationData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
