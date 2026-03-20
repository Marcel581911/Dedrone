import type { HostCity } from '../types';

export const hostCities: HostCity[] = [
  // ───────────────────────── NEW YORK / NEW JERSEY ─────────────────────────
  {
    id: 'nyc',
    city: 'New York / New Jersey',
    state: 'NJ',
    country: 'US',
    venue: 'MetLife Stadium',
    lat: 40.8135,
    lng: -74.0745,
    equipment: [
      // ── NYPD ──
      { id: 'nyc-nypd-1', name: 'RF-560 Sensor', model: 'RF-560', quantity: 5, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-2', name: 'ESR Radar', model: 'EchoShield SR', quantity: 4, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-3', name: 'PTZ Camera', model: 'Standard PTZ', quantity: 1, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-4', name: 'AI Connector', model: 'AI Connector 1.0', quantity: 1, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-5', name: 'D-Fend EnforceAir2', model: 'EnforceAir2', quantity: 2, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-6', name: 'Dedrone Defender II', model: 'Defender II (GPS)', quantity: 2, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-7', name: 'Tactical Titan 3', model: 'Titan 3 Portable', quantity: 3, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-8', name: 'Tactical RF-310', model: 'RF-310 Portable', quantity: 3, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-9', name: 'Tactical RF-560', model: 'RF-560 Portable', quantity: 2, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-10', name: 'Tactical ESR Radar', model: 'ESR Portable', quantity: 1, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-11', name: 'Tactical PTZ Camera', model: 'PTZ Portable', quantity: 1, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-12', name: 'Tactical Offline Server', model: 'Offline Server', quantity: 1, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-13', name: 'Starlink HW Kit', model: 'Starlink Mini', quantity: 3, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-nypd-14', name: 'Camera Mount', model: 'Camera Mount', quantity: 1, ownership: 'SLTT', ownerName: 'NYPD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      // ── Morris County DPS ──
      { id: 'nyc-morris-1', name: 'RF-560 Sensor', model: 'RF-560 (TEL)', quantity: 80, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-2', name: 'RF-900 Sensor', model: 'RF-900', quantity: 27, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-3', name: 'ESR Radar', model: 'EchoShield SR', quantity: 4, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-4', name: 'AI Connector', model: 'AI Connector 1.0', quantity: 1, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-5', name: 'FLIR Ranger HDC 350', model: 'HDC 350', quantity: 1, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-6', name: 'Box Server', model: 'Box Server', quantity: 1, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-7', name: '3M Mast', model: 'Mast 3M', quantity: 111, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-8', name: 'Starlink HW Kit', model: 'Starlink Mini', quantity: 80, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'nyc-morris-9', name: 'Battery Pack', model: 'Battery USA', quantity: 36, ownership: 'SLTT', ownerName: 'Morris County DPS', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
    ],
    supportTeam: [],
  },

  // ───────────────────────── LOS ANGELES ─────────────────────────
  {
    id: 'la',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    venue: 'SoFi Stadium',
    lat: 33.9535,
    lng: -118.3392,
    equipment: [],
    supportTeam: [],
  },

  // ───────────────────────── DALLAS ─────────────────────────
  {
    id: 'dallas',
    city: 'Dallas',
    state: 'TX',
    country: 'US',
    venue: 'AT&T Stadium',
    lat: 32.7473,
    lng: -97.0945,
    equipment: [
      { id: 'dal-1', name: 'Dedrone Defender II', model: 'Defender II (GPS)', quantity: 5, ownership: 'SLTT', ownerName: 'Dallas PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'dal-2', name: 'RapidResponse w/ ELR Radar', model: 'DRR + ELR', quantity: 5, ownership: 'SLTT', ownerName: 'Dallas PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'dal-3', name: 'Titan 3', model: 'Titan 3 Kit', quantity: 7, ownership: 'SLTT', ownerName: 'Dallas PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'dal-4', name: 'Starlink HW Kit', model: 'Starlink Mini', quantity: 5, ownership: 'SLTT', ownerName: 'Dallas PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
    ],
    supportTeam: [],
  },

  // ───────────────────────── SAN FRANCISCO BAY AREA ─────────────────────────
  {
    id: 'sf',
    city: 'San Francisco Bay Area',
    state: 'CA',
    country: 'US',
    venue: "Levi's Stadium",
    lat: 37.4033,
    lng: -121.9694,
    equipment: [],
    supportTeam: [],
  },

  // ───────────────────────── MIAMI ─────────────────────────
  {
    id: 'miami',
    city: 'Miami',
    state: 'FL',
    country: 'US',
    venue: 'Hard Rock Stadium',
    lat: 25.958,
    lng: -80.2389,
    equipment: [
      { id: 'mia-1', name: 'Dedrone Defender II', model: 'Defender II (GPS)', quantity: 8, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-2', name: 'RI Radar', model: 'RI Radar', quantity: 8, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-3', name: 'Aluma Trailer w/ EchoGuard', model: 'Aluma Trailer SR', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-4', name: 'RF-360 Sensor', model: 'RF-360', quantity: 20, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-5', name: 'RF-560 Sensor', model: 'RF-560', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-6', name: 'PTZ Camera', model: 'Standard PTZ', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-7', name: 'AI Connector', model: 'AI Connector 1.0', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-8', name: 'Camera Mount', model: 'Camera Mount', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-9', name: 'RapidResponse (Short Range)', model: 'DRR Refresh SR', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'mia-10', name: 'Fixed Site Standard+', model: 'Fixed Site Refresh', quantity: 4, ownership: 'SLTT', ownerName: 'Miami-Dade Sheriff Office', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
    ],
    supportTeam: [],
  },

  // ───────────────────────── ATLANTA ─────────────────────────
  {
    id: 'atlanta',
    city: 'Atlanta',
    state: 'GA',
    country: 'US',
    venue: 'Mercedes-Benz Stadium',
    lat: 33.7553,
    lng: -84.4006,
    equipment: [
      { id: 'atl-1', name: 'Dedrone Defender II', model: 'Defender II (GPS)', quantity: 7, ownership: 'SLTT', ownerName: 'GA Bureau of Investigation', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'atl-2', name: 'Aluma Trailer w/ EchoGuard', model: 'Aluma Trailer SR', quantity: 3, ownership: 'SLTT', ownerName: 'GA Bureau of Investigation', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'atl-3', name: 'Multi-Node Full Spectrum Kit', model: 'Full Spectrum', quantity: 2, ownership: 'SLTT', ownerName: 'GA Bureau of Investigation', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
    ],
    supportTeam: [],
  },

  // ───────────────────────── HOUSTON ─────────────────────────
  {
    id: 'houston',
    city: 'Houston',
    state: 'TX',
    country: 'US',
    venue: 'NRG Stadium',
    lat: 29.6847,
    lng: -95.4107,
    equipment: [],
    supportTeam: [],
  },

  // ───────────────────────── PHILADELPHIA ─────────────────────────
  {
    id: 'philly',
    city: 'Philadelphia',
    state: 'PA',
    country: 'US',
    venue: 'Lincoln Financial Field',
    lat: 39.9008,
    lng: -75.1675,
    equipment: [
      { id: 'phi-1', name: 'D-Fend EnforceAir2', model: 'EnforceAir2', quantity: 5, ownership: 'SLTT', ownerName: 'Philadelphia PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'phi-2', name: 'Titan 3', model: 'Titan 3 Kit', quantity: 2, ownership: 'SLTT', ownerName: 'Philadelphia PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
    ],
    supportTeam: [],
  },

  // ───────────────────────── SEATTLE ─────────────────────────
  {
    id: 'seattle',
    city: 'Seattle',
    state: 'WA',
    country: 'US',
    venue: 'Lumen Field',
    lat: 47.5952,
    lng: -122.3316,
    equipment: [],
    supportTeam: [],
  },

  // ───────────────────────── KANSAS CITY ─────────────────────────
  {
    id: 'kc',
    city: 'Kansas City',
    state: 'MO',
    country: 'US',
    venue: 'Arrowhead Stadium',
    lat: 39.0489,
    lng: -94.4839,
    equipment: [
      // ── Kansas City PD ──
      { id: 'kc-kcpd-1', name: 'Aluma Trailer w/ EchoGuard', model: 'Aluma Trailer SR', quantity: 1, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-2', name: 'RF-560 Sensor', model: 'RF-560', quantity: 5, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-3', name: 'RF-360 Sensor', model: 'RF-360', quantity: 13, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-4', name: 'Tactical Titan 3', model: 'Titan 3 Portable', quantity: 1, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-5', name: 'Tactical Offline Server', model: 'Offline Server', quantity: 1, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-6', name: 'Tactical Network Kit', model: 'Network Kit', quantity: 1, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-7', name: '3M Mast', model: 'Mast 3M', quantity: 1, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-kcpd-8', name: 'Starlink HW Kit', model: 'Starlink Mini', quantity: 1, ownership: 'SLTT', ownerName: 'Kansas City PD', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      // ── Moniteau County Sheriff ──
      { id: 'kc-mon-1', name: 'Multi-Node Full Spectrum Kit', model: 'Full Spectrum', quantity: 1, ownership: 'SLTT', ownerName: 'Moniteau County Sheriff', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-mon-2', name: 'Aluma Trailer w/ EchoGuard', model: 'Aluma Trailer SR', quantity: 1, ownership: 'SLTT', ownerName: 'Moniteau County Sheriff', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
      { id: 'kc-mon-3', name: 'Starlink HW Kit', model: 'Starlink Mini', quantity: 1, ownership: 'SLTT', ownerName: 'Moniteau County Sheriff', dealStatus: 'open', deliveryReady: 'no', delivered: 'pending' },
    ],
    supportTeam: [],
  },

  // ───────────────────────── BOSTON ─────────────────────────
  {
    id: 'boston',
    city: 'Boston',
    state: 'MA',
    country: 'US',
    venue: 'Gillette Stadium',
    lat: 42.0909,
    lng: -71.2643,
    equipment: [],
    supportTeam: [],
  },

  // ───────────────────────── VANCOUVER ─────────────────────────
  {
    id: 'vancouver',
    city: 'Vancouver',
    state: 'BC',
    country: 'CA',
    venue: 'BC Place',
    lat: 49.2768,
    lng: -123.112,
    equipment: [],
    supportTeam: [],
  },
];
