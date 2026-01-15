interface VolumeSliderProps {
  volume: number;
  setVolume: (value: number) => void;
}

export function VolumeSlider({ volume, setVolume }: VolumeSliderProps) {
  return (
    <div className="volume-slider-container group">
      <div className="volume-track">
        <div 
          className="volume-track-fill" 
          style={{ width: `${volume * 100}%` }} 
        />
      </div>
      <input 
        type="range" min="0" max="1" step="0.01" value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="custom-range"
      />
    </div>
  );
}
