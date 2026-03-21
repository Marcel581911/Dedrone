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
  const hasShipped = city.tracker.some(t => t.shipmentStatus.toLowerCase().includes('shipped') || t.shipmentStatus.toLowerCase().includes('shipping'));
  if (hasShipped) return 'in-progress';
  const hasClosed = city.tracker.some(t => t.dealClosedWon.toLowerCase() === 'yes' || t.dealClosedWon.toLowerCase() === 'order submitted');
  if (hasClosed) return 'has-issues';
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
