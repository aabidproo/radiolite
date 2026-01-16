import { useEffect, useState } from "react";
import { useAudio } from "./hooks/useAudio";
import { useStations } from "./hooks/useStations";


// Modular UI Components
import { SearchHeader } from "./components/ui/SearchHeader";
import { StationGroupList } from "./components/station/StationGroupList";
import { StationList } from "./components/station/StationList";

import { CategoryItemGrid } from "./components/station/CategoryItemGrid";
import { PlayerFooter } from "./components/player/PlayerFooter";

// Atomic Layout Components
import { Container, ScrollArea } from "./components/ui/Layout";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const { isPlaying, isBuffering, currentStation, volume, setVolume, playStation, togglePlay } = useAudio();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Hide window when it loses focus (menu bar app feel)
  useEffect(() => {
    const currentWindow = getCurrentWindow();
    
    const hide = () => { 
      currentWindow.hide().catch(console.error);
    };

    // Force focus on mount to ensure blur triggers later
    currentWindow.setFocus().catch(console.error);

    // System-level focus listener
    const unlistenPromise = currentWindow.onFocusChanged(({ payload: isFocused }: { payload: boolean }) => {
      if (!isFocused) hide();
    });

    // Web-level fallback (standard browser blur)
    window.addEventListener('blur', hide);

    return () => {
      unlistenPromise.then((unlisten: any) => unlisten());
      window.removeEventListener('blur', hide);
    };
  }, []);

  // Update menu bar title when station changes
  useEffect(() => {
    const updateMenuBar = async () => {
      try {
        let title = "Radiolite";
        if (currentStation) {
          // Truncate long names to prevent menu bar overflow
          const maxLength = 10;
          title = currentStation.name.length > maxLength 
            ? currentStation.name.substring(0, maxLength) + "..."
            : currentStation.name;
        }
        await invoke("update_tray_title", { title });
      } catch (err) {
        console.error("Failed to update menu bar title:", err);
      }
    };
    updateMenuBar();
  }, [currentStation]);


  const { 
    stations, 
    countries, 
    languages,
    tags,
    loading, 
    searchStations, 
    getTopStations, 
    fetchCountries, 
    fetchLanguages,
    fetchTags,
    favorites, 
    toggleFavorite,
    userCountry,
    detectLocation,
    fetchNearMeStations,
    flushCache,
    nearMeStations,
    error,
    hasMore,
    resetPagination
  } = useStations();
  
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState(20);
  const [mainTab, setMainTab] = useState<'explore' | 'favorites' | 'nearMe'>(() => {
    // Optimistically start in Near Me if we have a country, otherwise Explore
    const savedCountry = localStorage.getItem('radiolite_user_country');
    return savedCountry ? 'nearMe' : 'explore';
  });
  const [exploreView, setExploreView] = useState<'categories' | 'countries' | 'languages' | 'tags'>('categories');


  // Detect location and handle initial fetch
  useEffect(() => {
    const initNearMe = async () => {
      if (!userCountry) {
        await detectLocation();
      }
    };
    initNearMe();
  }, []);

  useEffect(() => {
    if (mainTab === 'nearMe') {
      if (userCountry) {
        resetPagination();
        fetchNearMeStations(userCountry);
      } else {
        detectLocation().then(country => {
          if (country) {
            resetPagination();
            fetchNearMeStations(country);
          }
        });
      }
    } else if (mainTab === 'explore') {
      if (selectedCountry) {
        resetPagination();
        searchStations("", { country: selectedCountry }, { resetOffset: true });
      } else if (selectedLanguage) {
        resetPagination();
        searchStations("", { language: selectedLanguage }, { resetOffset: true });
      } else if (selectedTag) {
        resetPagination();
        searchStations("", { tag: selectedTag }, { resetOffset: true });
      } else {
        // If no filter selected, ensure we are in categories view
        if (exploreView === 'categories') {
          getTopStations();
        } else {
          if (exploreView === 'countries') fetchCountries();
          else if (exploreView === 'languages') fetchLanguages();
          else if (exploreView === 'tags') fetchTags();
          getTopStations();
        }
      }
    }
  }, [mainTab, selectedCountry, selectedLanguage, selectedTag, userCountry, exploreView]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStations(search);
  };

  const handleSelectItem = (type: 'country' | 'language' | 'tag', value: string) => {
    setVisibleItems(20);
    // Reset other filters when a new one is selected to prevent conflicting results
    setSelectedCountry(type === 'country' ? value : null);
    setSelectedLanguage(type === 'language' ? value : null);
    setSelectedTag(type === 'tag' ? value : null);
  };

  const loadMoreItems = () => {
    setVisibleItems(prev => prev + 20);
  };

  const handleLoadMoreStations = () => {
    if (mainTab === 'nearMe' && userCountry) {
      fetchNearMeStations(userCountry, { append: true });
    } else if (mainTab === 'explore') {
      searchStations('', { 
        country: selectedCountry || undefined, 
        language: selectedLanguage || undefined, 
        tag: selectedTag || undefined 
      }, { append: true });
    }
  };

  const isFav = (s: any) => favorites.some(f => f.stationuuid === s.stationuuid);

  const playNext = () => {
    if (!currentStation) return;
    
    // Determine the active station list
    let activeList = stations;
    if (mainTab === 'favorites') {
      activeList = favorites;
    } else if (mainTab === 'nearMe' && nearMeStations.length > 0 && !search) {
      activeList = nearMeStations;
    }
    
    const currentIndex = activeList.findIndex(s => s.stationuuid === currentStation.stationuuid);
    if (currentIndex !== -1 && activeList.length > 0) {
      const nextIndex = (currentIndex + 1) % activeList.length;
      playStation(activeList[nextIndex]);
    }
  };

  const playPrevious = () => {
    if (!currentStation) return;
    
    // Determine the active station list
    let activeList = stations;
    if (mainTab === 'favorites') {
      activeList = favorites;
    } else if (mainTab === 'nearMe' && nearMeStations.length > 0 && !search) {
      activeList = nearMeStations;
    }
    
    const currentIndex = activeList.findIndex(s => s.stationuuid === currentStation.stationuuid);
    if (currentIndex !== -1 && activeList.length > 0) {
      const prevIndex = currentIndex === 0 ? activeList.length - 1 : currentIndex - 1;
      playStation(activeList[prevIndex]);
    }
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    const success = await flushCache();
    if (success) {
      const promises = [];
      if (mainTab === 'nearMe' && userCountry) {
        promises.push(fetchNearMeStations(userCountry));
      } else if (mainTab === 'explore') {
        promises.push(getTopStations());
        if (exploreView === 'countries') promises.push(fetchCountries());
        else if (exploreView === 'languages') promises.push(fetchLanguages());
        else if (exploreView === 'tags') promises.push(fetchTags());
      }
      await Promise.all(promises);
    }
    setIsManualRefreshing(false);
  };

  return (
    <Container>
      <div className="page-header">
        <div className="search-header-container">
            <SearchHeader 
              search={search} 
              setSearch={setSearch} 
              onSearch={handleSearch} 
              onRefresh={handleRefresh}
              isLoading={isManualRefreshing}
            />
        </div>
        
        {!search && (
          <div className="chip-tabs-container">
             <div 
              className={`chip-tab ${mainTab === 'nearMe' ? 'active' : ''}`}
              onClick={() => setMainTab('nearMe')}
            >
              Near Me
            </div>
            <div 
              className={`chip-tab ${mainTab === 'explore' ? 'active' : ''}`}
              onClick={() => setMainTab('explore')}
            >
              Explore
            </div>
            <div 
              className={`chip-tab ${mainTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setMainTab('favorites')}
            >
              Favorites {favorites.length > 0 && `(${favorites.length})`}
            </div>
          </div>
        )}
      </div>

      <ScrollArea>
        {error ? (
          <div className="px-4 py-8 text-center mt-12">
            <div className="text-red-500/80 mb-6 text-sm flex flex-col gap-2">
              <span className="font-semibold text-lg text-white">Connection Issue</span>
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="chip-tab active"
              style={{ display: 'inline-block', padding: '10px 24px' }}
            >
              Retry Connection
            </button>
            <div className="mt-8 text-muted text-xs px-8 leading-relaxed">
              Make sure your backend server is running. <br/>
              Run: <code className="bg-white/5 p-1 rounded">cd backend && ../.venv/bin/uvicorn app.main:app --reload</code>
            </div>
          </div>
        ) : search ? (
          <div key="search">
            <StationList 
              stations={stations}
              title={search ? `Results for "${search}"` : 'Search stations'}
              loading={loading}
              currentStation={currentStation}
              onPlay={playStation}
            />
          </div>
        ) : (
          <>
            {mainTab === 'nearMe' && (
              <div key="nearMe" className="mt-4">
                <div className="px-4 mb-2">
                  <h2 className="section-title">
                    Stations in {userCountry || 'your area'}
                  </h2>
                </div>
                <StationGroupList 
                  stations={mainTab === 'nearMe' ? (stations.length > 0 ? stations : nearMeStations) : stations}
                  loading={loading}
                  currentStation={currentStation}
                  onPlay={playStation}
                />
                {hasMore && stations.length >= 100 && (
                  <div className="load-more-container">
                    <button 
                      disabled={loading}
                      className="load-more-btn"
                      onClick={handleLoadMoreStations}
                    >
                      {loading ? 'Merging Stations...' : 'Load More Stations'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {mainTab === 'favorites' && (
              <div key="favorites" className="mt-4">
                <div className="px-4 mb-2">
                  <h2 className="section-title">Your Favorites</h2>
                </div>
                <StationList 
                  stations={favorites}
                  title=""
                  currentStation={currentStation}
                  onPlay={playStation}
                  accentTitle
                />
                {favorites.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted text-sm">
                    No favorites yet. Start exploring!
                  </div>
                )}
              </div>
            )}

            {mainTab === 'explore' && (
              <div key="explore" className="mt-4">
                {selectedCountry || selectedLanguage || selectedTag ? (
                  <div>
                    <div className="px-4 mb-4">
                      <div 
                        className="text-accent text-sm cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSelectedCountry(null);
                          setSelectedLanguage(null);
                          setSelectedTag(null);
                        }}
                      >
                        ← Back to {selectedCountry ? 'countries' : selectedLanguage ? 'languages' : 'genres'}
                      </div>
                    </div>
                    <StationGroupList 
                      stations={stations}
                      loading={loading}
                      currentStation={currentStation}
                      onPlay={playStation}
                    />
                    
                    {hasMore && stations.length >= 100 && (
                      <div className="load-more-container">
                        <button 
                          disabled={loading}
                          className="load-more-btn"
                          onClick={handleLoadMoreStations}
                        >
                          {loading ? 'Merging Stations...' : 'Load More Stations'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : exploreView === 'categories' ? (
                  <div key="categories-landing">
                    <h2 className="section-title">Browse by Category</h2>
                    <div className="explore-grid">
                      <div className="explore-card" onClick={() => setExploreView('countries')}>
                        <span className="explore-card-title">By Country</span>
                        <span className="explore-card-subtitle">{countries.length || '...'} Nations</span>
                      </div>
                      <div className="explore-card" onClick={() => setExploreView('languages')}>
                        <span className="explore-card-title">By Language</span>
                        <span className="explore-card-subtitle">{languages.length || '...'} Tongues</span>
                      </div>
                      <div className="explore-card" onClick={() => setExploreView('tags')}>
                        <span className="explore-card-title">By Genre</span>
                        <span className="explore-card-subtitle">{tags.length || '...'} Styles</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pb-8">
                    <div className="px-4 mb-4">
                      <div 
                        className="text-accent text-sm cursor-pointer flex items-center gap-2"
                        onClick={() => setExploreView('categories')}
                      >
                        ← Back to explore
                      </div>
                    </div>
                    <h2 className="section-title mb-4">
                      Browse by {exploreView === 'countries' ? 'Country' : exploreView === 'languages' ? 'Language' : 'Genre'}
                    </h2>
                    
                    <CategoryItemGrid 
                      items={
                        exploreView === 'countries' ? countries :
                        exploreView === 'languages' ? languages :
                        tags
                      }
                      onSelect={(val: string) => handleSelectItem(
                        exploreView === 'countries' ? 'country' :
                        exploreView === 'languages' ? 'language' :
                        'tag',
                        val
                      )}
                      loading={
                        loading && (
                          (exploreView === 'countries' && countries.length === 0) ||
                          (exploreView === 'languages' && languages.length === 0) ||
                          (exploreView === 'tags' && tags.length === 0)
                        )
                      }
                    />

                    {(exploreView === 'countries' ? countries : exploreView === 'languages' ? languages : tags).length > visibleItems && (
                      <div className="load-more-container">
                        <button 
                          className="load-more-btn"
                          onClick={loadMoreItems}
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ScrollArea>

      <PlayerFooter 
        currentStation={currentStation}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        volume={volume}
        setVolume={setVolume}
        togglePlay={togglePlay}
        toggleFavorite={toggleFavorite}
        isFav={isFav}
        onNext={playNext}
        onPrevious={playPrevious}
      />
    </Container>
  );
}

export default App;
