# SafeTravel Monitor

<p align="center">
  <img src="/icons/icon-192.png" alt="SafeTravel Monitor Logo" width="128" height="128"/>
</p>

<p align="center">
  <strong>Know before you go.</strong><br />
  Real-time travel safety intelligence platform for travelers worldwide.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

SafeTravel Monitor is a real-time safety intelligence platform that aggregates global news data to provide safety scores, alerts, and risk assessments for tourist destinations worldwide. The platform empowers travelers to make informed decisions by analyzing global news coverage in 100+ languages.

### Core Value Proposition

> **"Know before you go"** - Real-time safety intelligence for every destination on Earth, powered by analysis of global news coverage.

### Target Users

- **International Travelers** - Individual travelers planning trips abroad
- **Travel Agencies** - Professional travel planners and consultants
- **Corporate Travel Managers** - Business travel coordinators
- **Digital Nomads** - Remote workers traveling internationally
- **Study Abroad Programs** - Educational institutions with international programs
- **Travel Bloggers** - Content creators providing travel information

---

## Features

### 1. Interactive Global Safety Map 🗺️

A world map displaying color-coded safety scores for all countries with interactive features:

- **Color-coded Countries**: Green (Safe), Yellow (Caution), Orange (Elevated Risk), Red (High Risk)
- **Click Interactions**: Click any country to view detailed safety breakdown
- **Zoom Functionality**: City-level safety data with granular filtering
- **Search**: Jump to specific destinations quickly
- **Layer Toggles**: Filter by Crime, Protests, Health, Natural Disasters, Political Unrest

### 2. Destination Safety Dashboard 📊

Comprehensive analytics for selected destinations:

- **Overall Safety Score** (0-100)
- **Category Breakdown**: Crime, Protest, Health, Natural Disaster, Political
- **30-Day Trend Chart**: Historical safety trends visualization
- **Recent Incidents Timeline**: Last 7 days of safety events
- **News Sentiment Analysis**: Media tone and coverage analysis
- **Global Comparison**: Benchmark against worldwide averages

### 3. Real-Time Alert System 🔔

Push notifications and email alerts for safety events:

- **Unlimited Watch List**: Track as many destinations as needed
- **Alert Types**: All events, Critical only, or Custom filters
- **Delivery Methods**: Email, Browser Push, or Both
- **Alert History**: Complete log of all notifications
- **Snooze Functionality**: Temporarily pause notifications
- **One-Click Unsubscribe**: Easy destination removal

### 4. GDELT Data Integration Engine ⚙️

Backend service for data processing:

- **GDELT API Wrapper**: Robust API integration with retry logic
- **Smart Caching**: 24-hour cache with Supabase for performance
- **Scoring Algorithm**: Normalized safety scoring system
- **Rate Limiting**: Built-in request throttling
- **Background Jobs**: Periodic data updates
- **Analytics**: API usage tracking and monitoring

### 5. Travel Recommendations Engine 💡

AI-powered safety recommendations:

- **Personalized Advice**: Based on destination and current conditions
- **Area-Specific Guidance**: Neighborhood safety information
- **Time-Based Tips**: Day vs. night safety considerations
- **Health Precautions**: Vaccination and health requirements
- **Emergency Contacts**: Embassy and emergency service information
- **Transportation Safety**: Safe transportation options

### 6. Comparison Tool 📈

Side-by-side destination comparison:

- **Multi-Destination Support**: Compare up to 5 destinations
- **Visual Comparison**: Charts and graphs for easy analysis
- **Safest Option Highlighting**: Automatic recommendation
- **PDF Export**: Download comparison reports

### 7. Mobile PWA 📱

Installable mobile application:

- **PWA Manifest**: Full app installation support
- **Offline Functionality**: Access cached data without internet
- **Push Notifications**: Real-time alert delivery
- **Add to Home Screen**: One-tap installation
- **App-Like Experience**: Smooth navigation and interactions

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **React-Leaflet** | Interactive mapping |
| **Chart.js** | Data visualization |
| **Lucide React** | Icon system |
| **Inter** | Primary typeface |

### Backend & Data

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, Auth, Storage |
| **GDELT API** | Global news and events data |
| **Vercel** | Deployment and hosting |

### External Services (Free Tier)

- **Maps**: OpenStreetMap tiles
- **Email**: Resend (100/day free)
- **Analytics**: Vercel Analytics
- **Monitoring**: Sentry (free tier)

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager
- Supabase account (optional for development)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/safetravel-monitor.git
cd safetravel-monitor
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration (optional for development).

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
safetravel-monitor/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles
│   │   ├── dashboard/          # Dashboard page
│   │   ├── compare/            # Comparison page
│   │   └── alerts/             # Alerts page
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── map/                # Map components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── charts/             # Chart components
│   │   └── alerts/             # Alert components
│   ├── lib/                    # Utilities and services
│   │   ├── utils.ts            # Helper functions
│   │   ├── mock-gdelt.ts       # Mock GDELT service
│   │   └── AppContext.tsx      # Global state
│   └── types/                  # TypeScript definitions
│       └── index.ts
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Adding New Features

1. **Components**: Add new components in `src/components/`
2. **Pages**: Add new pages in `src/app/`
3. **Utilities**: Add helpers in `src/lib/`
4. **Types**: Define interfaces in `src/types/`

### Database Setup

For full functionality, set up Supabase:

1. Create a new Supabase project
2. Run the SQL migrations from `supabase/schema.sql`
3. Configure environment variables

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

- **Netlify**: Supported via Next.js adapter
- **Docker**: Containerized deployment available
- **Traditional**: Node.js server setup required

---

## API Integration

### GDELT API

The platform uses the GDELT Project's free API for global news analysis:

- **Documentation**: https://www.gdeltproject.org/
- **API Endpoint**: `https://api.gdeltproject.org/api/v2`
- **No API key required** for basic usage

### Data Processing

The mock GDELT service simulates real data for development. To enable real GDELT integration:

1. Set `ENABLE_REAL_GDELT=true` in environment variables
2. Configure appropriate caching strategies
3. Monitor API usage and rate limits

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **GDELT Project** for providing global news data
- **OpenStreetMap** for map tiles
- **Leaflet** for interactive mapping
- **Chart.js** for data visualization
- **Next.js** team for the React framework

---

## Support

- **Documentation**: [docs.safetravel.example.com](https://docs.safetravel.example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/safetravel-monitor/issues)
- **Email**: support@safetravel.example.com

---

<p align="center">
  Made with ❤️ for travelers worldwide
</p>
