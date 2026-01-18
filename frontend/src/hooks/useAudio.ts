import { useState, useRef, useEffect } from 'react';
import { Station } from '../types/station';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize Audio once on mount
  useEffect(() => {
    const audio = new Audio();
    // Try without CORS first - some stations work better this way
    audioRef.current = audio;
    
    // Setup Analyser
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const isWindows = navigator.userAgent.includes('Windows');

    if (AudioContextClass) {
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      // CRITICAL: On Windows WebView2, connecting a MediaElementSource to context.destination
      // silences cross-origin audio if CORS headers are missing (which most radio stations don't have).
      // On Mac it works fine. So we ONLY connect the source to the context for non-Windows platforms.
      if (!isWindows) {
        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
        sourceRef.current = source;
      } else {
        // On Windows, we still keep the analyser created but NOT connected to the audio source.
        // The Visualizer component will detect the lack of real data and use its built-in
        // BeatSimulator to show a pulsing animation, ensuring the user gets SOUND + VISUALS.
        console.log("Windows detected: Using native audio path to ensure sound reliability.");
      }
    }
    
    const onWaiting = () => {
      // Only show buffering if we actually ran out of data (readyState < 3)
      // AND the audio is supposed to be playing
      if (!audio.paused && audio.readyState < 3) {
        setIsBuffering(true);
      }
    };

    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsBuffering(false);
      setIsPlaying(false);
    };

    const onTimeUpdate = () => {
      // If time is moving, we are definitely NOT buffering
      if (isBuffering && !audio.paused && audio.readyState >= 3) {
        setIsBuffering(false);
      }
    };

    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => {
      setIsBuffering(false);
      setIsPlaying(false);
    };
    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
    };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audioRef.current = null;
    };
  }, []); // Run ONLY once

  // Update volume separately
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle MediaSession metadata separately
  useEffect(() => {
    if ('mediaSession' in navigator && currentStation) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: 'Radiolite',
        album: currentStation.tags || currentStation.country || '',
        artwork: [
          { src: '/logo.png', sizes: '512x512', type: 'image/png' },
          { src: '/favicon.png', sizes: '32x32', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play().catch(console.error));
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    }
  }, [currentStation]);

  const playStation = (station: Station) => {
    if (!audioRef.current) return;

    // Resume context if suspended
    const ctx = analyserRef.current?.context as any;
    if (ctx?.state === 'suspended') {
      ctx.resume();
    }

    // Reset states before starting new play
    setIsPlaying(false);
    setIsBuffering(true);
    setCurrentStation(station);

    audioRef.current.src = station.url_resolved || station.url;
    audioRef.current.load();
    audioRef.current.play()
      .catch((err) => {
        console.error("Playback failed", err);
        setIsBuffering(false);
        setIsPlaying(false);
      });

    // Analytics: Track Station Play
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://api-radiolite.onrender.com/api/v1";
      fetch(`${apiUrl}/track/station-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: station.stationuuid || station.name })
      });
    } catch (err) {
      console.error('Failed to track station play:', err);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    // Resume context if suspended
    const ctx = analyserRef.current?.context as any;
    if (ctx?.state === 'suspended') {
      ctx.resume();
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else if (currentStation) {
      setIsBuffering(true);
      audioRef.current.play().catch((err) => {
        console.error("Toggle play failed", err);
        setIsBuffering(false);
      });
    }
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  return { 
    isPlaying, 
    isBuffering, 
    currentStation, 
    volume, 
    setVolume, 
    playStation, 
    togglePlay
  };
}
