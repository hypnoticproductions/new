import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel, EventType } from '@/types';

// Utility function for conditional class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return then.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

// Format date to ISO string
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Get risk level from safety score
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'elevated';
  return 'critical';
}

// Get risk level color class
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'text-emerald-500';
    case 'moderate':
      return 'text-amber-500';
    case 'elevated':
      return 'text-orange-500';
    case 'critical':
      return 'text-red-500';
  }
}

// Get risk level background color class
export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'bg-emerald-500';
    case 'moderate':
      return 'bg-amber-500';
    case 'elevated':
      return 'bg-orange-500';
    case 'critical':
      return 'bg-red-500';
  }
}

// Get event type icon
export function getEventTypeIcon(type: EventType): string {
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
}

// Get event type color
export function getEventTypeColor(type: EventType): string {
  switch (type) {
    case 'protest':
      return 'orange';
    case 'crime':
      return 'red';
    case 'violence':
      return 'red';
    case 'health':
      return 'emerald';
    case 'natural':
      return 'blue';
    case 'political':
      return 'purple';
    default:
      return 'gray';
  }
}

// Calculate safety score trend
export function calculateTrend(currentScore: number, previousScore: number): 'improving' | 'stable' | 'deteriorating' {
  const difference = currentScore - previousScore;
  if (difference > 5) return 'improving';
  if (difference < -5) return 'deteriorating';
  return 'stable';
}

// Generate random safety score (for demo purposes)
export function generateRandomScore(min: number = 40, max: number = 95): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Get country flag emoji
export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Validate location input
export function validateLocation(location: string): boolean {
  const regex = /^[a-zA-Z\s,\-']+$/;
  return regex.test(location) && location.length >= 2 && location.length <= 100;
}

// Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"\'\\]/g, '')
    .slice(0, 500);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Get difference between two arrays
export function getArrayDifference<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter((item) => !arr2.includes(item));
}

// Check if array contains duplicate
export function hasDuplicates<T>(arr: T[]): boolean {
  return new Set(arr).size !== arr.length;
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Sort array by multiple keys
export function sortByMultipleKeys<T>(
  array: T[],
  keys: { key: keyof T; order: 'asc' | 'desc' }[]
): T[] {
  return [...array].sort((a, b) => {
    for (const { key, order } of keys) {
      if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}
