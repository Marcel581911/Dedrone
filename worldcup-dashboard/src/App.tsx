import { useState } from 'react';
import Header from './components/Header';
import DealSummaryBar from './components/DealSummaryBar';
import FederalPoolBanner from './components/FederalPoolBanner';
import CityList from './components/CityList';
import MapView from './components/MapView';
import CityDetailPanel from './components/CityDetailPanel';
import { hostCities } from './data/cities';
import { federalPool } from './data/federalPool';
import type { HostCity } from './types';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<HostCity | null>(null);

  const handleCitySelect = (city: HostCity) => {
    setSelectedCity(prev => (prev?.id === city.id ? null : city));
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      <Header />
      <DealSummaryBar cities={hostCities} federalPool={federalPool} />
      <FederalPoolBanner assets={federalPool} />
      <div className="flex flex-1 overflow-hidden">
        {/* City list sidebar */}
        <div className="w-60 shrink-0">
          <CityList
            cities={hostCities}
            selectedCity={selectedCity}
            onCitySelect={handleCitySelect}
          />
        </div>

        {/* Map area */}
        <div className="relative flex-1">
          <MapView
            cities={hostCities}
            selectedCity={selectedCity}
            onCitySelect={handleCitySelect}
          />
        </div>

        {/* Detail panel */}
        {selectedCity && (
          <div className="w-[520px] shrink-0">
            <CityDetailPanel
              city={selectedCity}
              onClose={() => setSelectedCity(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
