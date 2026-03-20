import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { HostCity } from '../types';

interface CityMarkerProps {
  city: HostCity;
  isSelected: boolean;
  onClick: (city: HostCity) => void;
}

function getCityStatus(city: HostCity): 'all-delivered' | 'has-issues' | '' {
  const allDelivered = city.equipment.every(e => e.delivered === 'delivered');
  const hasOpenDeals = city.equipment.some(e => e.dealStatus === 'open');
  if (allDelivered) return 'all-delivered';
  if (hasOpenDeals) return 'has-issues';
  return '';
}

export default function CityMarker({ city, isSelected, onClick }: CityMarkerProps) {
  const status = getCityStatus(city);
  const totalEquipment = city.equipment.reduce((sum, e) => sum + e.quantity, 0);

  const icon = L.divIcon({
    className: `city-marker ${status} ${isSelected ? 'selected' : ''}`,
    html: `<span>${totalEquipment}</span>`,
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
          <span className="text-xs text-blue-400">{totalEquipment} units deployed</span>
        </div>
      </Popup>
    </Marker>
  );
}
