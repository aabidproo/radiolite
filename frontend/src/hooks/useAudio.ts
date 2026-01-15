import { useState, useRef, useEffect } from 'react';
import { Station } from '../types/station';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playStation = (station: Station) => {
    if (audioRef.current) {
      audioRef.current.src = station.url_resolved || station.url;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setCurrentStation(station);
        })
        .catch((err) => {
          console.error("Playback failed", err);
          setIsPlaying(false);
        });
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (currentStation) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(console.error);
      }
    }
  };

  return {
    isPlaying,
    currentStation,
    volume,
    setVolume,
    playStation,
    togglePlay,
  };
}
