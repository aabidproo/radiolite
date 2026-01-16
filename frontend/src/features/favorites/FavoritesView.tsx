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
    <div key="favorites" className="mt-4">
      <h2 className="section-title px-4 mb-2">Your Favorites</h2>
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
