'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card } from '@/components/ui';
import { TrendDataPoint } from '@/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
  showEvents?: boolean;
}

export function TrendChart({ data, title = '30-Day Safety Trend', height = 300, showEvents = true }: TrendChartProps) {
  const chartData = {
    labels: data.map((point) => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Safety Score',
        data: data.map((point) => point.score),
        borderColor: '#3b82f6',
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      ...(showEvents
        ? [
            {
              label: 'Events',
              data: data.map((point) => point.events),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 6,
              yAxisID: 'y1',
            },
          ]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: showEvents,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#6b7280',
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#111827',
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            if (context.dataset.label === 'Events') {
              return `${context.dataset.label}: ${context.parsed.y} events`;
            }
            return `${context.dataset.label}: ${context.parsed.y}/100`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 10,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: number) => `${value}`,
        },
      },
      ...(showEvents
        ? {
            y1: {
              position: 'right' as const,
              min: 0,
              max: Math.max(...data.map((d) => d.events)) + 2,
              grid: {
                display: false,
              },
              ticks: {
                color: '#ef4444',
                callback: (value: number) => `${value}`,
              },
            },
          }
        : {}),
    },
  };

  return (
    <Card className="p-6">
      <div style={{ height }}>
        {/* @ts-ignore - Chart.js types are complex */}
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}

interface SafetyComparisonChartProps {
  data: Array<{
    name: string;
    score: number;
    color: string;
  }>;
  title?: string;
}

export function SafetyComparisonChart({ data, title = 'Safety Comparison' }: SafetyComparisonChartProps) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Safety Score',
        data: data.map((d) => d.score),
        backgroundColor: data.map((d) => d.color),
        borderColor: data.map((d) => d.color),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#111827',
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: { parsed: { x: number } }) => `Safety Score: ${context.parsed.x}/100`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: {
          color: '#e5e7eb',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
    },
  };

  return (
    <Card className="p-6">
      <div style={{ height: Math.max(200, data.length * 40) }}>
        {/* @ts-ignore */}
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}

interface RadarChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };
  title?: string;
}

export function RadarChart({ data, title }: RadarChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#6b7280',
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#111827',
        padding: { bottom: 20 },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          color: '#9ca3af',
          backdropColor: 'transparent',
        },
        grid: {
          color: '#e5e7eb',
        },
        angleLines: {
          color: '#e5e7eb',
        },
        pointLabels: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <Card className="p-6">
      <div style={{ height: 350 }}>
        {/* @ts-ignore */}
        <ChartJS type="radar" data={data} options={options} />
      </div>
    </Card>
  );
}

interface EventsTimelineProps {
  events: Array<{
    date: string;
    type: string;
    title: string;
    severity: string;
  }>;
}

export function EventsTimeline({ events }: EventsTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
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
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Event Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-600" />

        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <div key={index} className="relative flex items-start gap-4 pl-10">
              {/* Timeline dot */}
              <div
                className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-800 ${getSeverityColor(
                  event.severity
                )}`}
              />

              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-sm">
                {getEventIcon(event.type)}
              </div>

              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                  {event.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
