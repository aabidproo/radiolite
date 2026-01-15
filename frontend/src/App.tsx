import { useEffect, useState } from "react";
import { useAudio } from "./hooks/useAudio";
import { useStations } from "./hooks/useStations";


// Modular UI Components
import { SearchHeader } from "./components/ui/SearchHeader";
import { StationGroupList } from "./components/station/StationGroupList";
import { StationList } from "./components/station/StationList";

import { CountryList } from "./components/station/CountryList";
import { PlayerFooter } from "./components/player/PlayerFooter";

// Atomic Layout Components
import { Container, ScrollArea } from "./components/ui/Layout";
import { Navigation } from "./components/layout/Navigation";
import { getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  const { isPlaying, currentStation, volume, setVolume, playStation, togglePlay } = useAudio();
  
  // Hide window when it loses focus (menu bar app feel)
  useEffect(() => {
    const win = getCurrentWindow();
    
    const hide = () => { 
      win.hide().catch(console.error);
    };

    // Force focus on mount to ensure blur triggers later
    win.setFocus().catch(console.error);

    // System-level focus listener
    const unlistenPromise = win.onFocusChanged(({ payload: isFocused }) => {
      if (!isFocused) hide();
    });

    // Web-level fallback (standard browser blur)
    window.addEventListener('blur', hide);

    return () => {
      unlistenPromise.then(unlisten => unlisten());
      window.removeEventListener('blur', hide);
    };
  }, []);

  const { 
    stations, 
    countries, 
    loading, 
    searchStations, 
    getTopStations, 
    fetchCountries, 
    favorites, 
    toggleFavorite 
  } = useStations();
  
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("explore");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [visibleCountries, setVisibleCountries] = useState(20);

  const loadMoreCountries = () => {
    setVisibleCountries(prev => prev + 20);
  };

  // Reset pagination when tab changes
  useEffect(() => {
    if (activeTab === 'explore' && !selectedCountry) {
      setVisibleCountries(20);
    }
  }, [activeTab, selectedCountry]);

  useEffect(() => {
    if (activeTab === 'explore') {
      if (selectedCountry) {
        searchStations("", selectedCountry);
      } else {
        fetchCountries();
        getTopStations();
      }
    }
  }, [activeTab, selectedCountry]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStations(search);
  };

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
  };

  const isFav = (s: any) => favorites.some(f => f.stationuuid === s.stationuuid);

  return (
    <Container>
      <ScrollArea>
        {activeTab === 'explore' && (
          <div key="explore">
            <h1 className="page-header">Explore</h1>
            
            {selectedCountry ? (
              <div>
                <div 
                  className="mb-4 px-4 text-accent text-sm cursor-pointer flex items-center gap-2"
                  onClick={() => setSelectedCountry(null)}
                >
                  ← Back to countries
                </div>
                <StationGroupList 
                  stations={stations}
                  loading={loading}
                  currentStation={currentStation}
                  onPlay={playStation}
                />
              </div>
            ) : (
                <div className="mt-4 pb-8">
                  <h2 className="section-title px-4">Browse by Country</h2>
                  {loading && countries.length === 0 ? (
                    <div className="loading-container">
                      <div className="loading-spinner" />
                    </div>
                  ) : (
                    <>
                      <CountryList 
                        countries={[...countries]
                          .sort((a, b) => b.stationcount - a.stationcount)
                          .slice(0, visibleCountries)
                        } 
                        onSelectCountry={handleSelectCountry} 
                      />
                      {visibleCountries < countries.length && (
                        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                            <button 
                              onClick={loadMoreCountries}
                              style={{ 
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '8px'
                              }}
                              className="hover:text-white transition-colors"
                            >
                              Load More Countries
                            </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div key="favorites">
            <h1 className="page-header">Favorites</h1>
            <StationList 
              stations={favorites}
              title="Your saved stations"
              currentStation={currentStation}
              onPlay={playStation}
              accentTitle
            />
          </div>
        )}

        {activeTab === 'search' && (
          <div key="search">
            <h1 className="page-header">Search</h1>
            <SearchHeader 
              search={search} 
              setSearch={setSearch} 
              onSearch={handleSearch} 
            />
            <StationList 
              stations={stations}
              title={search ? 'Search results' : 'Search stations'}
              loading={loading}
              currentStation={currentStation}
              onPlay={playStation}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div key="settings" className="p-4">
            <h1 className="page-header">Settings</h1>
            <div className="text-muted text-sm px-4">
              Settings coming soon
            </div>
          </div>
        )}
      </ScrollArea>

      <PlayerFooter 
        currentStation={currentStation}
        isPlaying={isPlaying}
        volume={volume}
        setVolume={setVolume}
        togglePlay={togglePlay}
        toggleFavorite={toggleFavorite}
        isFav={isFav}
      />

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </Container>
  );
}

export default App;
