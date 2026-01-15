import { Heart, Play, Pause, SkipBack, SkipForward, MoreHorizontal } from "lucide-react";
import { Station } from "../../types/station";
import { VolumeSlider } from "./VolumeSlider";
import { IconButton } from "../ui/IconButton";
import { Heading, Subheading } from "../ui/Typography";

interface PlayerFooterProps {
  currentStation: Station | null;
  isPlaying: boolean;
  volume: number;
  setVolume: (value: number) => void;
  togglePlay: () => void;
  toggleFavorite: (s: Station) => void;
  isFav: (s: Station) => boolean;
}

export function PlayerFooter({
  currentStation,
  isPlaying,
  volume,
  setVolume,
  togglePlay,
  toggleFavorite,
  isFav
}: PlayerFooterProps) {
  return (
    <footer className="player-footer">
      <div className="player-content">
        {/* Top Row: Station Info & Heart */}
        <div className="flex items-start justify-between mb-10">
          <div className="min-w-0 flex-1">
            <Heading className="text-[#1db954]">
              {currentStation?.name || 'Radiolite'}
            </Heading>
            <Subheading className="mt-3">
              {currentStation ? `${currentStation.country}` : 'Select a station'}
            </Subheading>
          </div>
          <IconButton 
            icon={Heart}
            onClick={() => currentStation && toggleFavorite(currentStation)}
            isActive={currentStation ? isFav(currentStation) : false}
            activeColor="text-white"
            fill={currentStation && isFav(currentStation) ? "white" : "none"}
            size={32}
            className="mt-2"
          />
        </div>

        {/* Bottom Row: Controls & Slider */}
        <div className="player-controls-row">
          <div className="playback-buttons">
            <IconButton icon={SkipBack} size={28} fill="currentColor" strokeWidth={0} />
            
            <IconButton 
              icon={isPlaying ? Pause : Play} 
              size={28} 
              onClick={togglePlay}
              disabled={!currentStation}
              activeColor="text-white"
              isActive={true}
              fill="currentColor"
              strokeWidth={0}
            />

            <IconButton icon={SkipForward} size={28} fill="currentColor" strokeWidth={0} />
          </div>

          <VolumeSlider volume={volume} setVolume={setVolume} />

          <IconButton icon={MoreHorizontal} size={28} />
        </div>
      </div>
    </footer>
  );
}
