import { useState } from "react";

import { Heart, Play, Pause, SkipBack, SkipForward, MoreHorizontal } from "lucide-react";
import { Station } from "../../types/station";
import { VolumeSlider } from "./VolumeSlider";
import { IconButton } from "../../components/ui/IconButton";
import { Heading, Subheading } from "../../components/ui/Typography";
import { MoreMenu } from "./MoreMenu";

interface PlayerFooterProps {
  currentStation: Station | null;
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  setVolume: (value: number) => void;
  togglePlay: () => void;
  toggleFavorite: (s: Station) => void;
  isFav: (s: Station) => boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function PlayerFooter({
  currentStation,
  isPlaying,
  isBuffering,
  volume,
  setVolume,
  togglePlay,
  toggleFavorite,
  isFav,
  onNext,
  onPrevious,
}: PlayerFooterProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <footer className="player-footer">
      <div className="player-content">
        {/* Top Row: Station Info & Heart */}
        <div className="flex items-start justify-between mb-10">
          <div className="min-w-0 flex-1 station-info-container">
            <div className="marquee-container">
              <div className="marquee-content">
                <Heading className="text-[#1db954] marquee-text">
                  {currentStation?.name || 'Radiolite'}
                </Heading>
                <Heading className="text-[#1db954] marquee-text">
                  {currentStation?.name || 'Radiolite'}
                </Heading>
                <Heading className="text-[#1db954] marquee-text">
                  {currentStation?.name || 'Radiolite'}
                </Heading>
              </div>
            </div>
            <Subheading className="mt-3">
              {currentStation ? `${currentStation.country}` : 'Select a station'}
            </Subheading>
          </div>
          
          <div className="flex gap-2 mt-2">
            <IconButton 
              icon={Heart}
              onClick={() => currentStation && toggleFavorite(currentStation)}
              isActive={currentStation ? isFav(currentStation) : false}
              activeColor="text-white"
              fill={currentStation && isFav(currentStation) ? "white" : "none"}
              size={32}
            />
          </div>
        </div>

        {/* Bottom Row: Controls & Slider */}
        <div className="player-controls-row">
          <div className="playback-buttons">
            <IconButton 
              icon={SkipBack} 
              size={28} 
              fill="currentColor" 
              strokeWidth={0}
              onClick={onPrevious}
              disabled={!currentStation}
            />
            
            {isBuffering ? (
              <button 
                onClick={togglePlay}
                disabled={!currentStation}
                className="icon-btn btn-active-white"
              >
                <div className="player-loading-spinner" />
              </button>
            ) : (
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
            )}

            <IconButton 
              icon={SkipForward} 
              size={28} 
              fill="currentColor" 
              strokeWidth={0}
              onClick={onNext}
              disabled={!currentStation}
            />
          </div>

          <VolumeSlider volume={volume} setVolume={setVolume} />

          <div className="more-menu-container">
            <IconButton 
              icon={MoreHorizontal} 
              size={28} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
            <MoreMenu 
              isOpen={isMenuOpen} 
              onClose={() => setIsMenuOpen(false)} 
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
