import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Film } from 'lucide-react';

interface BlackHoleVideoBackgroundProps {
  isCosmicView: boolean;
}

export const BlackHoleVideoBackground: React.FC<BlackHoleVideoBackgroundProps> = ({
  isCosmicView
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<'stationary' | 'orbit'>('stationary');
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Toggle video playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Switch between stationary accretion disk and 360 orbit camera angle
  const handleSwitchVideo = (type: 'stationary' | 'orbit') => {
    setSelectedVideo(type);
    setVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted in some browsers if unmuted, but it's muted
      });
    }
  }, [selectedVideo]);

  const currentVideoSrc =
    selectedVideo === 'stationary'
      ? '/videos/supermassive_black_hole.mp4'
      : '/videos/black_hole_orbit.mp4';

  const currentWebmSrc =
    selectedVideo === 'stationary'
      ? '/videos/supermassive_black_hole.webm'
      : undefined;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Background Video Element - Interstellar Real Supermassive Black Hole Simulation */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setVideoLoaded(true)}
        key={selectedVideo}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-100' : 'opacity-80'
        }`}
      >
        {currentWebmSrc && <source src={currentWebmSrc} type="video/webm" />}
        <source src={currentVideoSrc} type="video/mp4" />
      </video>

      {/* Subtle cinematic cosmic vignette overlay to keep text ultra-crisp */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.65)_100%)] pointer-events-none" />

      {/* Floating Video Controls in Bottom-Left (Pointer-events auto) */}
      <div
        className={`fixed bottom-6 left-6 z-50 pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/70 border border-amber-500/30 backdrop-blur-xl shadow-2xl transition-opacity duration-300 ${
          isCosmicView ? 'opacity-90 hover:opacity-100' : 'opacity-80 hover:opacity-100'
        }`}
      >
        {/* Play / Pause Toggle */}
        <button
          onClick={togglePlay}
          title={isPlaying ? 'Видеог түр зогсоох' : 'Видеог тоглуулах'}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-amber-500/20 text-amber-300 hover:text-white transition cursor-pointer border border-white/10"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Video Mode Selection */}
        <div className="flex items-center gap-1 text-[11px] font-medium font-mono text-slate-300">
          <button
            onClick={() => handleSwitchVideo('stationary')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              selectedVideo === 'stationary'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'hover:text-amber-300 text-slate-400'
            }`}
          >
            Гаргантюа
          </button>
          <button
            onClick={() => handleSwitchVideo('orbit')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              selectedVideo === 'orbit'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'hover:text-amber-300 text-slate-400'
            }`}
          >
            360 Тойрог
          </button>
        </div>

        {/* Indicator badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 pl-2 border-l border-white/10 text-[10px] text-amber-300 font-sans">
          <Film className="w-3 h-3 text-amber-400" />
          <span>Бодит бичлэг</span>
        </span>
      </div>
    </div>
  );
};
