import { useEffect, useState, useRef } from "react";
import { useAudio } from "./hooks/useAudio";
import { useStations } from "./hooks/useStations";

// Feature Components
import { SearchHeader } from "./features/ui/SearchHeader";
import { MainTabs } from "./features/navigation/MainTabs";
import { GlobalSearchView } from "./features/search/GlobalSearchView";
import { NearMeView } from "./features/near-me/NearMeView";
import { FavoritesView } from "./features/favorites/FavoritesView";
import { ExploreView } from "./features/explore/ExploreView";
import { PlayerFooter } from "./features/audio/PlayerFooter";

// Layout Components
import { Container, ScrollArea } from "./layout/Layout";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const { isPlaying, isBuffering, currentStation, volume, setVolume, playStation, togglePlay } = useAudio();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Hide window when it loses focus
  useEffect(() => {
    const currentWindow = getCurrentWindow();
    const hide = () => { currentWindow.hide().catch(console.error); };
    currentWindow.setFocus().catch(console.error);
    const unlistenPromise = currentWindow.onFocusChanged(({ payload: isFocused }: { payload: boolean }) => {
      if (!isFocused) hide();
    });
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
    stations, countries, languages, tags, loading, 
    searchStations, fetchCountries, fetchLanguages, fetchTags, fetchStats,
    favorites, toggleFavorite, userCountry, detectLocation, detectLocationWithPermission, fetchNearMeStations,
    flushCache, nearMeStations, error, hasMore, resetPagination,
    searchGlobal, globalSearchResults, clearGlobalSearch, stats,
    featuredStations, getFeaturedStations, featuredLoading,
    categoriesLoading, nearMeLoading, userCountryCode
  } = useStations();
  
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [mainTab, setMainTab] = useState<'explore' | 'favorites' | 'nearMe'>('explore');
  const [exploreView, setExploreView] = useState<'categories' | 'countries' | 'languages' | 'tags'>('categories');

  useEffect(() => {
    const initApp = async () => { 
      // Always fetch or restore from cache on launch
      fetchStats();
      if (tags.length === 0) fetchTags();
      if (countries.length === 0) fetchCountries();
      if (languages.length === 0) fetchLanguages();
      if (!userCountry) await detectLocation(); 
    };
    
    // Analytics: Track App Open
    const trackAppOpen = async () => {
      try {
        // 1. Get or Create Persistent UUID
        let userId = localStorage.getItem('radiolite_user_id');
        if (!userId) {
          userId = crypto.randomUUID();
          localStorage.setItem('radiolite_user_id', userId);
        }

        const apiUrl = import.meta.env.VITE_API_URL || "https://api-radiolite.onrender.com/api/v1";
        await fetch(`${apiUrl}/track/app-open`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: userId,
            country_code: userCountryCode || "Unknown" 
          })
        });
      } catch (err) {
        console.error('Failed to track app open:', err);
      }
    };

    initApp();
    trackAppOpen();
  }, []);

  useEffect(() => {
    if (mainTab === 'nearMe') {
      if (userCountryCode) { resetPagination(); fetchNearMeStations(userCountryCode); }
      else { detectLocation().then(c => { if (c) { resetPagination(); fetchNearMeStations(c); }}); }
    } else if (mainTab === 'explore') {
      if (selectedCountry) { resetPagination(); searchStations("", { country: selectedCountry }, { resetOffset: true }); }
      else if (selectedLanguage) { resetPagination(); searchStations("", { language: selectedLanguage }, { resetOffset: true }); }
      else if (selectedTag) { resetPagination(); searchStations("", { tag: selectedTag }, { resetOffset: true }); }
      else {
        // Landing Page: handeld by init effect
      }
    }
  }, [mainTab, selectedCountry, selectedLanguage, selectedTag, userCountryCode, exploreView, resetPagination, fetchNearMeStations, detectLocation, searchStations]);

  useEffect(() => { if (!search) clearGlobalSearch(); }, [search]);

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollTop = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const diff = scrollTop - lastScrollTop.current;
    
    // Always show at the top
    if (scrollTop < 10) {
      setShowHeader(true);
      lastScrollTop.current = scrollTop;
      return;
    }

    // Guard: Don't hide header if we're near the bottom to prevent flickering
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20;
    if (isNearBottom && diff > 0) {
      lastScrollTop.current = scrollTop;
      return;
    }

    // Small threshold to prevent jitter
    if (Math.abs(diff) < 5) return;

    if (diff > 0) {
      // Scrolling down
      if (showHeader) setShowHeader(false);
    } else {
      // Scrolling up
      if (!showHeader) setShowHeader(true);
    }
    lastScrollTop.current = scrollTop;
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); searchGlobal(search); };

  const handleSelectItem = (type: 'country' | 'language' | 'tag', value: string) => {
    setMainTab('explore');
    setSelectedCountry(type === 'country' ? value : null);
    setSelectedLanguage(type === 'language' ? value : null);
    setSelectedTag(type === 'tag' ? value : null);
    setShowHeader(true); // Ensure header shows when selecting category
  };

  const loadMoreItems = async () => {
    if (exploreView === 'countries') await fetchCountries({ append: true });
    else if (exploreView === 'languages') await fetchLanguages({ append: true });
    else if (exploreView === 'tags') await fetchTags({ append: true });
  };

  const handleLoadMoreSearch = () => {
    if (search) {
      searchStations(search, {}, { append: true });
    }
  };

  const handleLoadMoreStations = () => {
    if (mainTab === 'nearMe' && userCountryCode) fetchNearMeStations(userCountryCode, { append: true });
    else if (mainTab === 'explore') {
      searchStations('', { 
        country: selectedCountry || undefined, 
        language: selectedLanguage || undefined, 
        tag: selectedTag || undefined 
      }, { append: true });
    }
  };

  const isFav = (s: any) => favorites.some(f => f.stationuuid === s.stationuuid);

  const playNextPrevious = (direction: 'next' | 'prev') => {
    if (!currentStation) return;
    let activeList = stations;
    if (mainTab === 'favorites') activeList = favorites;
    else if (mainTab === 'nearMe' && nearMeStations.length > 0 && !search) activeList = nearMeStations;
    
    const currentIndex = activeList.findIndex(s => s.stationuuid === currentStation.stationuuid);
    if (currentIndex !== -1 && activeList.length > 0) {
      const offset = direction === 'next' ? 1 : -1;
      const nextIndex = (currentIndex + offset + activeList.length) % activeList.length;
      playStation(activeList[nextIndex]);
    }
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    if (await flushCache()) {
      const promises = [];
      if (mainTab === 'nearMe' && userCountryCode) promises.push(fetchNearMeStations(userCountryCode));
      else if (mainTab === 'explore') {
        if (exploreView === 'categories') {
          promises.push(fetchStats());
          promises.push(fetchTags());
          promises.push(fetchCountries());
          promises.push(fetchLanguages());
        } else {
          if (exploreView === 'countries') promises.push(fetchCountries());
          else if (exploreView === 'languages') promises.push(fetchLanguages());
          else if (exploreView === 'tags') promises.push(fetchTags());
        }
      }
      await Promise.all(promises);
    }
    setIsManualRefreshing(false);
  };

  return (
    <Container>
      <div className={`page-header ${!showHeader ? 'tabs-hidden' : ''}`}>
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
          <MainTabs 
            activeTab={mainTab} 
            setActiveTab={setMainTab} 
            favoritesCount={favorites.length}
          />
        )}
      </div>

      <ScrollArea onScroll={handleScroll}>
        {error ? (
          <div className="px-4 py-8 text-center mt-12">
            <div className="text-red-500/80 mb-6 text-sm flex flex-col gap-2">
              <span className="font-medium text-lg text-white">Connection Issue</span>
              {error}
            </div>
            <button onClick={() => window.location.reload()} className="chip-tab active" style={{ display: 'inline-block', padding: '10px 24px' }}>
              Retry Connection
            </button>
          </div>
        ) : search ? (
          <GlobalSearchView 
            loading={loading}
            globalSearchResults={globalSearchResults}
            currentStation={currentStation}
            playStation={playStation}
            stations={stations}
            hasMore={hasMore && (stations.length > 0 || (globalSearchResults?.stations?.length || 0) >= 20)}
            onLoadMoreStations={handleLoadMoreSearch}
            onClearSearch={() => setSearch("")}
            onSelectCategory={handleSelectItem}
          />
        ) : (
          <>
            {mainTab === 'nearMe' && (
              <NearMeView 
                userCountry={userCountry}
                nearMeStations={nearMeStations}
                loading={nearMeLoading}
                currentStation={currentStation}
                playStation={playStation}
                hasMore={hasMore}
                onLoadMore={handleLoadMoreStations}
                onDetectWithPermission={() => detectLocationWithPermission().then((c: string | null) => { if (c) { resetPagination(); fetchNearMeStations(c); }})}
              />
            )}
            {mainTab === 'favorites' && (
              <FavoritesView 
                favorites={favorites}
                currentStation={currentStation}
                playStation={playStation}
              />
            )}
            {mainTab === 'explore' && (
              <ExploreView 
                exploreView={exploreView}
                setExploreView={setExploreView}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                countries={countries}
                languages={languages}
                tags={tags}
                stations={stations}
                loading={loading}
                currentStation={currentStation}
                playStation={playStation}
                hasMore={hasMore}
                onLoadMoreStations={handleLoadMoreStations}
                onLoadMoreCategories={loadMoreItems}
                handleSelectItem={handleSelectItem}
                stats={stats}
                featuredStations={featuredStations}
                getFeaturedStations={getFeaturedStations}
                featuredLoading={featuredLoading}
                categoriesLoading={categoriesLoading}
              />
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
        onNext={() => playNextPrevious('next')}
        onPrevious={() => playNextPrevious('prev')}
      />
    </Container>
  );
}

export default App;


