import { StationList } from "../../components/station/StationList";

interface FavoritesViewProps {
  favorites: any[];
  currentStation: any;
  playStation: (station: any) => void;
}

export function FavoritesView({
  favorites,
  currentStation,
  playStation
}: FavoritesViewProps) {
  return (
    <div key="favorites" className="mt-5">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="section-title mb-0 leading-none">Your Favorites</h2>
      </div>
      <StationList 
        stations={favorites}
        title=""
        currentStation={currentStation}
        onPlay={playStation}
      />
      {favorites.length === 0 && (
        <div className="px-4 py-8 text-center text-muted text-sm">
          No favorites yet. Start exploring!
        </div>
      )}
    </div>
  );
}
