'use client';

import React from 'react';
import { SafetyData } from '@/types';
import { Card, Badge, Progress } from '@/components/ui';
import { getRiskLevel } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, MapPin } from 'lucide-react';

interface SafetyScoreCardProps {
  safetyData: SafetyData;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SafetyScoreCard({ safetyData, showTrend = true, size = 'lg' }: SafetyScoreCardProps) {
  const { safetyScore, riskLevel, trend } = safetyData;

  const getRiskVariant = () => {
    switch (riskLevel) {
      case 'safe':
        return 'safe';
      case 'moderate':
        return 'moderate';
      case 'elevated':
        return 'elevated';
      case 'critical':
        return 'critical';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'deteriorating':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'deteriorating':
        return 'Deteriorating';
      default:
        return 'Stable';
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'safe':
        return 'Low Risk';
      case 'moderate':
        return 'Moderate Risk';
      case 'elevated':
        return 'Elevated Risk';
      case 'critical':
        return 'High Risk';
    }
  };

  const sizeClasses = {
    sm: 'w-20 h-20 text-2xl',
    md: 'w-28 h-28 text-4xl',
    lg: 'w-36 h-36 text-5xl',
  };

  const strokeWidth = size === 'sm' ? 6 : size === 'md' ? 5 : 4;

  const scoreColor = () => {
    if (safetyScore >= 80) return '#10b981';
    if (safetyScore >= 60) return '#f59e0b';
    if (safetyScore >= 40) return '#f97316';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;

  return (
    <Card className="p-6 flex items-center gap-6">
      <div className="relative">
        <svg className={`${sizeClasses[size]} transform -rotate-90`} viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-dark-600"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={scoreColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${sizeClasses[size]} font-bold text-gray-900 dark:text-gray-100`}>
            {safetyScore}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={getRiskVariant() as 'safe' | 'moderate' | 'elevated' | 'critical'}>
            {getRiskLabel()}
          </Badge>
          {showTrend && (
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              {getTrendIcon()}
              {getTrendText()}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Safety Score for {safetyData.countryName}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Last updated: {new Date(safetyData.lastUpdated).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}

interface CategoryBreakdownProps {
  scores: SafetyData['safetyScores'];
}

export function CategoryBreakdown({ scores }: CategoryBreakdownProps) {
  const categories = [
    { name: 'Crime & Personal Safety', key: 'crime' as const, icon: '🚨' },
    { name: 'Protests & Civil Unrest', key: 'protest' as const, icon: '✊' },
    { name: 'Health & Medical', key: 'health' as const, icon: '🏥' },
    { name: 'Natural Disasters', key: 'natural' as const, icon: '🌊' },
    { name: 'Political Stability', key: 'political' as const, icon: '🗳️' },
  ];

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'safe';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'elevated';
    return 'critical';
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Safety Breakdown</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Detailed risk analysis by category</p>
      </div>
      <div className="p-6 space-y-4">
        {categories.map((category) => {
          const score = scores[category.key];
          return (
            <div key={category.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getScoreVariant(score)}>{score}/100</Badge>
                </div>
              </div>
              <Progress value={score} variant={getScoreVariant(score)} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface RecentIncidentsProps {
  incidents: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    location: string;
    date: string;
    description: string;
  }>;
  maxItems?: number;
}

export function RecentIncidents({ incidents, maxItems = 5 }: RecentIncidentsProps) {
  const sortedIncidents = [...incidents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxItems);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Shield className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'protest':
        return '✊';
      case 'crime':
        return '🚨';
      case 'violence':
        return '💥';
      case 'health':
        return '🏥';
      case 'natural':
        return '🌊';
      case 'political':
        return '🗳️';
      default:
        return '📰';
    }
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Incidents</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Latest safety events in the area</p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-dark-700">
        {sortedIncidents.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No recent incidents reported</p>
          </div>
        ) : (
          sortedIncidents.map((incident) => (
            <div key={incident.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-lg">
                  {getIncidentIcon(incident.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {incident.title}
                    </h4>
                    {getSeverityIcon(incident.severity)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{incident.location}</span>
                    <span>•</span>
                    <span>{new Date(incident.date).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {incident.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

interface RecommendationsProps {
  recommendations: Array<{
    id: string;
    category: string;
    icon: string;
    title: string;
    advice: string;
    priority: string;
  }>;
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      default:
        return 'border-l-emerald-500';
    }
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Travel Recommendations</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Safety tips for your trip</p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-dark-700">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`px-6 py-4 border-l-4 ${getPriorityBorder(rec.priority)} hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{rec.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {rec.title}
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {rec.advice}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface DestinationHeaderProps {
  safetyData: SafetyData;
  onBack?: () => void;
}

export function DestinationHeader({ safetyData, onBack }: DestinationHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-dark-900 dark:to-dark-800 rounded-xl p-6 text-white">
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

      <div className="relative flex items-start justify-between">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            >
              ← Back to Map
            </button>
          )}
          <h1 className="text-2xl font-bold">{safetyData.countryName}</h1>
          <p className="text-sm text-gray-300 mt-1">{safetyData.region}</p>
        </div>
        <SafetyScoreCard safetyData={safetyData} showTrend size="sm" />
      </div>

      <div className="relative mt-6 flex items-center gap-4 text-sm">
        <Badge variant={safetyData.riskLevel as 'safe' | 'moderate' | 'elevated' | 'critical'}>
          {safetyData.riskLevel.charAt(0).toUpperCase() + safetyData.riskLevel.slice(1)} Risk
        </Badge>
        <span className="text-gray-300">•</span>
        <span className="text-gray-300">
          Coordinates: {safetyData.coordinates[0].toFixed(2)}°N, {Math.abs(safetyData.coordinates[1]).toFixed(2)}°W
        </span>
      </div>
    </div>
  );
}
