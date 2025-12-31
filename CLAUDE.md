# CLAUDE.md

This file provides guidance to Claude when working with the SafeTravel Monitor project.

## Project Overview

SafeTravel Monitor is a real-time travel safety intelligence platform built with Next.js 14. It aggregates global news data (via GDELT API) to provide safety scores, alerts, and risk assessments for tourist destinations worldwide.

## Key Technologies

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React-Leaflet** for interactive maps
- **Chart.js** for data visualization
- **Supabase** for backend services
- **PWA** capabilities with service worker

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the component structure in `src/components/`
- Use the utility functions from `src/lib/utils.ts`
- Maintain consistent naming conventions:
  - Components: PascalCase (e.g., `SafetyMap.tsx`)
  - Hooks: camelCase with "use" prefix (e.g., `useGDELT.ts`)
  - Utilities: camelCase (e.g., `utils.ts`)
  - Types: PascalCase (e.g., `SafetyData`)

### Component Guidelines

1. **UI Components** (`src/components/ui/`)
   - Create reusable base components
   - Follow shadcn/ui patterns
   - Support dark mode via Tailwind's `dark:` classes
   - Include proper TypeScript interfaces

2. **Map Components** (`src/components/map/`)
   - Use dynamic imports to avoid SSR issues with Leaflet
   - Handle loading states gracefully
   - Include proper accessibility attributes

3. **Dashboard Components** (`src/components/dashboard/`)
   - Create data-rich visualization components
   - Include proper loading and error states
   - Support responsive design

4. **Chart Components** (`src/components/charts/`)
   - Use Chart.js with react-chartjs-2
   - Configure for dark/light themes
   - Include proper tooltips and legends

### Data Management

- Use the AppContext from `src/lib/AppContext.tsx` for global state
- Mock data is generated in `src/lib/mock-gdelt.ts`
- For production, integrate with real GDELT API
- Implement proper caching strategies

### Styling

- Use Tailwind CSS utility classes
- Follow the color scheme defined in `tailwind.config.js`
- Implement dark mode support with the `dark:` prefix
- Use CSS variables for theme colors

### Testing

- Test all interactive components
- Verify responsive behavior at all breakpoints
- Check dark mode implementation
- Test PWA functionality

## Common Tasks

### Adding a New Feature

1. Create components in appropriate directory
2. Add types to `src/types/index.ts`
3. Update AppContext if needed
4. Add to relevant page
5. Update documentation

### Modifying the Map

1. Update `src/components/map/SafetyMap.tsx`
2. Handle SSR with dynamic imports
3. Test with various screen sizes
4. Verify marker clustering

### Adding New Countries

1. Update `src/lib/mock-gdelt.ts` with country data
2. Add to `countryData` object
3. Set appropriate base safety scores
4. Test in dashboard and comparison views

## Important Notes

- Always use dynamic imports for Leaflet components to avoid SSR errors
- Include proper loading states for async operations
- Support both dark and light themes
- Make components accessible with proper ARIA attributes
- Use the mock GDELT service for development; enable real API in production

## File Structure Reference

```
src/
├── app/                    # Pages and layouts
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── map/              # Map components
│   ├── dashboard/        # Dashboard components
│   ├── charts/           # Chart components
│   └── alerts/           # Alert components
├── lib/                   # Utilities and services
│   ├── utils.ts          # Helper functions
│   ├── mock-gdelt.ts     # Mock data service
│   └── AppContext.tsx    # Global state
└── types/                 # TypeScript definitions
```

## GDELT Integration

For production use:
1. Set `ENABLE_REAL_GDelt=true` in environment
2. Configure GDELT API credentials
3. Implement proper rate limiting
4. Set up caching with Supabase

## Performance Considerations

- Use dynamic imports for heavy components
- Implement code splitting with Next.js
- Cache API responses appropriately
- Optimize map tile loading
- Use proper image optimization
