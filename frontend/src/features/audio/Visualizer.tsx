import { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  className?: string;
}

// Simulated beat generator for when real audio data isn't available
class BeatSimulator {
  private time = 0;
  private beatPhase = 0;
  private bassEnergy = 0;
  private midEnergy = 0;
  private highEnergy = 0;
  
  // Simulate different frequency bands
  getBars(count: number): number[] {
    this.time += 0.016; // ~60fps
    
    // Create a beat pattern (4/4 time signature)
    const beatInterval = 0.5; // Beat every 0.5 seconds
    this.beatPhase = (this.time % beatInterval) / beatInterval;
    
    // Bass drum on beats 1 and 3
    const isBassKick = this.beatPhase < 0.15 && (Math.floor(this.time / beatInterval) % 2 === 0);
    // Snare on beats 2 and 4
    const isSnare = this.beatPhase < 0.12 && (Math.floor(this.time / beatInterval) % 2 === 1);
    // Hi-hat continuous
    const hiHat = Math.sin(this.time * 8) * 0.3 + 0.7;
    
    // Energy decay
    this.bassEnergy *= 0.85;
    this.midEnergy *= 0.88;
    this.highEnergy *= 0.92;
    
    // Trigger energy spikes
    if (isBassKick) this.bassEnergy = 1.0;
    if (isSnare) this.midEnergy = 0.9;
    this.highEnergy = hiHat * 0.6;
    
    // Add some musical variation
    const melody = Math.sin(this.time * 0.7) * 0.3 + 0.5;
    
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      const freq = i / count;
      
      // Low frequencies (bass)
      if (freq < 0.3) {
        bars.push(this.bassEnergy * (1 - freq * 2) + Math.random() * 0.1);
      }
      // Mid frequencies
      else if (freq < 0.7) {
        const midFactor = 1 - Math.abs(freq - 0.5) * 2;
        bars.push(this.midEnergy * midFactor * melody + Math.random() * 0.15);
      }
      // High frequencies
      else {
        bars.push(this.highEnergy * (freq - 0.5) + Math.random() * 0.2);
      }
    }
    
    return bars;
  }
}

export function Visualizer({ analyser, isPlaying, className = "" }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const simulatorRef = useRef<BeatSimulator>(new BeatSimulator());

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser?.frequencyBinCount || 256;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);
      
      // Try to get real audio data
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      
      // Check if we have real audio data
      const maxValue = analyser ? Math.max(...dataArray) : 0;
      const hasRealAudio = maxValue > 0;
      
      const barCount = 32;
      const barWidth = 8;
      const barPadding = 4;
      const totalWidth = barCount * (barWidth + barPadding);
      const startX = (width - totalWidth) / 2;

      // Get bar values (real or simulated)
      let barValues: number[];
      if (hasRealAudio) {
        // Use real audio data
        barValues = [];
        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.floor(Math.pow(i / barCount, 1.5) * (bufferLength / 3));
          barValues.push(dataArray[freqIndex] / 255);
        }
      } else {
        // Use simulated beats
        barValues = simulatorRef.current.getBars(barCount);
      }

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const normalizedValue = barValues[i];
        const barHeight = Math.max(8, Math.pow(normalizedValue, 0.8) * height * 0.9);

        const x = startX + i * (barWidth + barPadding);
        const y = (height - barHeight) / 2;

        // Dynamic gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (normalizedValue > 0.7) {
          gradient.addColorStop(0, '#00ff88');
          gradient.addColorStop(1, '#1db954');
        } else {
          gradient.addColorStop(0, '#1ed760');
          gradient.addColorStop(1, '#1db954');
        }
        
        ctx.fillStyle = gradient;
        
        // Glow on peaks
        if (normalizedValue > 0.6) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(29, 185, 84, 0.8)';
        } else {
          ctx.shadowBlur = 0;
        }

        // Draw rounded bar
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    if (isPlaying) {
      renderFrame();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full max-h-[80px] ${className}`}
      width={600}
      height={100}
    />
  );
}
