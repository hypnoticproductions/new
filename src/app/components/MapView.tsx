'use client';

import React from 'react';
import { SafetyData } from '@/types';
import { Spinner } from '@/components/ui';
import { SafetyMap } from '@/components/map/SafetyMap';

interface MapViewProps {
  safetyData: SafetyData[];
  onCountrySelect?: (country: SafetyData) => void;
  selectedCountry?: string;
}

// Simple wrapper - SafetyMap already handles SSR internally
export default function MapView({ safetyData, onCountrySelect, selectedCountry }: MapViewProps) {
  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden">
      <SafetyMap
        safetyData={safetyData}
        onCountrySelect={onCountrySelect}
        selectedCountry={selectedCountry}
      />
    </div>
  );
}
