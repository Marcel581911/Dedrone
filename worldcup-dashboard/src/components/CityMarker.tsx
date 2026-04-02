import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { HostCity } from '../types';

interface CityMarkerProps {
  city: HostCity;
  isSelected: boolean;
  onClick: (city: HostCity) => void;
}

function getCityStatus(city: HostCity): 'all-delivered' | 'has-issues' | 'in-progress' | 'no-data' {
  const hasData = city.equipment.length > 0 || city.tracker.length > 0;
  if (!hasData) return 'no-data';
  const activeTrackers = city.tracker.filter(t => t.dealClosedWon !== '-' && t.dealClosedWon !== '');
  if (activeTrackers.length === 0) return 'has-issues';
  const allShipped = activeTrackers.length > 0 && activeTrackers.every(t => {
    const s = t.shipmentStatus.toLowerCase();
    return s === 'shipped' || s === 'in progress';
  });
  if (allShipped) return 'all-delivered';
  const hasShipped = activeTrackers.some(t => {
    const s = t.shipmentStatus.toLowerCase();
    return s === 'shipped' || s === 'in progress' || s === 'partially shipped' || s.includes('shipping');
  });
  if (hasShipped) return 'in-progress';
  return 'has-issues';
}

export default function CityMarker({ city, isSelected, onClick }: CityMarkerProps) {
  const status = getCityStatus(city);
  const trackerCount = city.tracker.length;

  const label = trackerCount > 0 ? `${trackerCount}` : '-';

  const icon = L.divIcon({
    className: `city-marker ${status} ${isSelected ? 'selected' : ''}`,
    html: `<span>${label}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <Marker
      position={[city.lat, city.lng]}
      icon={icon}
      eventHandlers={{ click: () => onClick(city) }}
    >
      <Popup>
        <div className="text-center">
          <strong>{city.city}</strong>
          <br />
          <span className="text-slate-300 text-xs">{city.venue}</span>
          <br />
          {trackerCount > 0 ? (
            <span className="text-xs text-blue-400">{trackerCount} accounts</span>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
