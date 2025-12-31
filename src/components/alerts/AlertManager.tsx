'use client';

import React, { useState } from 'react';
import { Alert, WatchedDestination } from '@/types';
import { Card, Badge, Button, Input } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import {
  Bell,
  BellOff,
  Trash2,
  Plus,
  X,
  Check,
  AlertTriangle,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
  onAction?: (alert: Alert) => void;
}

export function AlertCard({ alert, onDismiss, onAction }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityVariant = () => {
    switch (alert.severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'elevated';
      case 'medium':
        return 'moderate';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'protest':
        return '✊';
      case 'crime':
        return '🚨';
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
    <Card
      className={`p-4 border-l-4 transition-all cursor-pointer ${
        alert.severity === 'critical'
          ? 'border-l-red-500'
          : alert.severity === 'high'
          ? 'border-l-orange-500'
          : alert.severity === 'medium'
          ? 'border-l-amber-500'
          : 'border-l-gray-300'
      } ${!alert.isRead ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-lg">
          {getEventIcon(alert.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getSeverityIcon()}
            <Badge variant={getSeverityVariant() as 'safe' | 'moderate' | 'elevated' | 'critical'}>
              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
            </Badge>
            {!alert.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>

          <h4 className="font-medium text-gray-900 dark:text-gray-100">{alert.title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.description}</p>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {alert.destinationName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRelativeTime(alert.timestamp)}
            </span>
          </div>

          {isExpanded && alert.recommendations && alert.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendations:
              </p>
              <ul className="space-y-1">
                {alert.recommendations.map((rec, index) => (
                  <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <Check className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isExpanded && alert.sourceUrl && (
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mt-3 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              View Source
            </a>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(alert.id);
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

interface AlertFeedProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  maxItems?: number;
  showFilters?: boolean;
}

export function AlertFeed({ alerts, onDismiss, maxItems, showFilters = true }: AlertFeedProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const filteredAlerts =
    filter === 'all'
      ? alerts
      : alerts.filter((alert) => alert.severity === filter);

  const displayAlerts = maxItems ? filteredAlerts.slice(0, maxItems) : filteredAlerts;

  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {alerts.length} alerts for your watched destinations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showFilters && (
              <>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      filter === f
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-dark-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== 'all' && (
                      <span className="ml-1 text-gray-400">({alertCounts[f]})</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-dark-700 max-h-[500px] overflow-y-auto">
        {displayAlerts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <BellOff className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No alerts matching your filter</p>
          </div>
        ) : (
          displayAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
          ))
        )}
      </div>

      {maxItems && alerts.length > maxItems && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-dark-700">
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all {alerts.length} alerts →
          </button>
        </div>
      )}
    </Card>
  );
}

interface WatchedDestinationsProps {
  destinations: WatchedDestination[];
  onRemove: (id: string) => void;
  onAdd: (destination: { name: string; countryCode: string }) => void;
}

export function WatchedDestinations({ destinations, onRemove, onAdd }: WatchedDestinationsProps) {
  const [newDestination, setNewDestination] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newDestination.trim()) {
      onAdd({ name: newDestination.trim(), countryCode: newDestination.trim().substring(0, 2).toUpperCase() });
      setNewDestination('');
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Watched Destinations</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {destinations.length} destinations being monitored
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
          <div className="flex gap-2">
            <Input
              placeholder="Enter destination name..."
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-dark-700">
        {destinations.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <MapPin className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No destinations being watched</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add destinations to receive real-time alerts
            </p>
          </div>
        ) : (
          destinations.map((dest) => (
            <div
              key={dest.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{dest.destinationName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Alert level: {dest.alertLevel} • Added {formatRelativeTime(dest.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dest.isActive ? (
                  <Badge variant="safe">Active</Badge>
                ) : (
                  <Badge variant="moderate">Paused</Badge>
                )}
                <button
                  onClick={() => onRemove(dest.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
