import { MapContainer, TileLayer } from 'react-leaflet';
import CityMarker from './CityMarker';
import type { HostCity } from '../types';

interface MapViewProps {
  cities: HostCity[];
  selectedCity: HostCity | null;
  onCitySelect: (city: HostCity) => void;
}

export default function MapView({ cities, selectedCity, onCitySelect }: MapViewProps) {
  return (
    <MapContainer
      center={[35.0, -100.0]}
      zoom={4}
      minZoom={3}
      maxZoom={10}
      className="h-full w-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {cities.map(city => (
        <CityMarker
          key={city.id}
          city={city}
          isSelected={selectedCity?.id === city.id}
          onClick={onCitySelect}
        />
      ))}
    </MapContainer>
  );
}
