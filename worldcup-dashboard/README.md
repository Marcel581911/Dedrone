# FIFA World Cup 2026 - Dedrone Deal Dashboard

Interactive dashboard for tracking Dedrone equipment deployments across the 12 FIFA World Cup 2026 host venues in North America (11 US cities + Vancouver).

## Features

- **Interactive Map** — North American map with clickable markers for each host city
- **Deal Tracking** — Track deal status (Open/Closed), delivery readiness, and delivery status
- **Equipment Inventory** — View all Dedrone equipment deployed at each venue with ownership details (Federal, SLTT, Private)
- **Support Team** — See on-site and virtual support personnel assigned to each venue
- **Summary Dashboard** — Real-time overview of overall delivery progress across all cities

## Host Cities

| City | Venue | Country |
|------|-------|---------|
| New York/New Jersey | MetLife Stadium | US |
| Los Angeles | SoFi Stadium | US |
| Dallas | AT&T Stadium | US |
| San Francisco Bay Area | Levi's Stadium | US |
| Miami | Hard Rock Stadium | US |
| Atlanta | Mercedes-Benz Stadium | US |
| Houston | NRG Stadium | US |
| Philadelphia | Lincoln Financial Field | US |
| Seattle | Lumen Field | US |
| Kansas City | Arrowhead Stadium | US |
| Boston | Gillette Stadium | US |
| Vancouver | BC Place | Canada |

## Getting Started

```bash
cd worldcup-dashboard
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech Stack

- React 19 + TypeScript
- Vite
- Leaflet + react-leaflet (interactive map)
- Tailwind CSS v4 (styling)
- Lucide React (icons)
