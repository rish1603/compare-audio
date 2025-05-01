'use client';

import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Zoom from 'wavesurfer.js/dist/plugins/zoom.esm.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js';

type TrackType = 'A' | 'B' | 'C';

// Pre-build audio URLs to avoid cache issues
const getAudioUrl = (track: TrackType) => {
  // In production, use a fixed version to enable browser caching
  // In development, use timestamp to avoid cache during development
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Use a fixed version string that you can update when audio changes
    // This allows browsers to cache the audio files effectively
    return `/${track}.mp3?v=1.0.0`;
  } else {
    // In development, use timestamp to avoid caching
    return `/${track}.mp3?v=${Date.now()}`;
  }
};

// Loading status types for detailed feedback
type LoadingStage = 
  | 'initializing' 
  | 'loading-audio' 
  | 'generating-waveform'
  | 'ready';

const AudioCompare = () => {
  const [activeTrack, setActiveTrack] = useState<TrackType>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level
  const [tracksInitialized, setTracksInitialized] = useState<Record<TrackType, boolean>>({
    A: false,
    B: false,
    C: false
  });
  
  // Track detailed loading status for better user feedback
  const [loadingStatus, setLoadingStatus] = useState<Record<TrackType, LoadingStage>>({
    A: 'initializing',
    B: 'initializing',
    C: 'initializing'
  });
  
  // Add a state to delay showing loading indicators
  const [showLoading, setShowLoading] = useState(false);
  
  // Refs for multiple waveform containers
  const waveformRefs = useRef<Record<TrackType, HTMLDivElement | null>>({
    A: null,
    B: null,
    C: null
  });
  
  // Refs for multiple minimap containers
  const minimapRefs = useRef<Record<TrackType, HTMLDivElement | null>>({
    A: null,
    B: null,
    C: null
  });
  
  // Refs for multiple wavesurfer instances
  const wavesurferRefs = useRef<Record<TrackType, WaveSurfer | null>>({
    A: null,
    B: null,
    C: null
  });
  
  // Track loading states separately from initialization
  const trackLoadedRef = useRef<Record<TrackType, boolean>>({
    A: false,
    B: false,
    C: false
  });
  
  // Use a single global position to sync tracks
  const globalPositionRef = useRef(0);
  const isChangingTrack = useRef(false);

  // Apply zoom to a single track
  const applyZoomToTrack = (track: TrackType) => {
    try {
      const wavesurfer = wavesurferRefs.current[track];
      if (wavesurfer && tracksInitialized[track] && trackLoadedRef.current[track]) {
        // Check if audio is actually loaded before attempting to zoom
        if (wavesurfer.getDuration() > 0) {
          wavesurfer.zoom(zoomLevel);
        }
      }
    } catch (error) {
      console.error(`Error applying zoom to ${track}:`, error);
    }
  };
  
  // Create all wavesurfer instances on mount
  useEffect(() => {
    // Set a timeout to only show loading indicators after 1 second
    // This prevents flickering for cached files
    const loadingTimeout = setTimeout(() => {
      setShowLoading(true);
    }, 1000);
    
    // Function to initialize a track
    const initializeTrack = async (track: TrackType) => {
      // Skip if already initialized or containers aren't ready
      if (tracksInitialized[track] || !waveformRefs.current[track] || !minimapRefs.current[track]) {
        return;
      }
      
      // Clean up any existing instances for this track
      if (wavesurferRefs.current[track]) {
        try {
          wavesurferRefs.current[track]!.destroy();
          wavesurferRefs.current[track] = null;
          trackLoadedRef.current[track] = false;
        } catch (e) {
          console.error(`Error cleaning up existing instance for ${track}:`, e);
        }
      }
      
      try {
        // Set the loading state for this track
        if (track === activeTrack) {
          setIsLoading(true);
        }
        
        // Update loading status to loading audio
        setLoadingStatus(prev => ({
          ...prev,
          [track]: 'loading-audio'
        }));
        
        // Build full URL with cache buster to avoid caching issues
        const audioUrl = getAudioUrl(track);
        
        // Create wavesurfer instance with proper settings
        const wavesurfer = WaveSurfer.create({
          container: waveformRefs.current[track]!,
          waveColor: '#6c757d',
          progressColor: '#4F4A85',
          height: 150,
          cursorColor: '#333',
          cursorWidth: 2,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          responsive: true,
          minPxPerSec: 50,
          url: audioUrl,
          plugins: [
            Zoom.create({
              maxZoom: 100,
              scale: 0.5
            }),
            Minimap.create({
              container: minimapRefs.current[track]!,
              waveColor: '#ddd',
              progressColor: '#999',
              height: 30,
              barWidth: 2,
              barGap: 1,
              barRadius: 1
            })
          ]
        });
        
        // Store the instance immediately so we can reference it
        wavesurferRefs.current[track] = wavesurfer;
        
        // Add loading events for user feedback
        wavesurfer.on('loading', (percent: number) => {
          console.log(`Loading track ${track}: ${percent}%`);
          
          if (percent >= 100) {
            setLoadingStatus(prev => ({
              ...prev,
              [track]: 'generating-waveform'
            }));
          }
        });
        
        // Track ready event
        wavesurfer.on('ready', () => {
          console.log(`Track ${track} ready`);
          
          // Mark this track as initialized and loaded
          setTracksInitialized(prev => ({
            ...prev,
            [track]: true
          }));
          trackLoadedRef.current[track] = true;
          
          setLoadingStatus(prev => ({
            ...prev,
            [track]: 'ready'
          }));
          
          // Apply zoom after audio is loaded and we know it's ready
          try {
            wavesurfer.zoom(zoomLevel);
          } catch (e) {
            console.error(`Error applying zoom to ${track} after load:`, e);
          }
          
          // If this is the active track, mark loading as complete
          if (track === activeTrack) {
            setIsLoading(false);
          }
          
          // Hide all tracks except the active one
          if (track !== activeTrack && waveformRefs.current[track]) {
            waveformRefs.current[track]!.style.display = 'none';
            minimapRefs.current[track]!.style.display = 'none';
          }
        });
        
        // Event handlers
        wavesurfer.on('play', () => {
          if (track === activeTrack && !isPlaying) {
            setIsPlaying(true);
          }
        });
        
        wavesurfer.on('pause', () => {
          if (track === activeTrack && isPlaying) {
            setIsPlaying(false);
          }
        });
        
        wavesurfer.on('finish', () => {
          setIsPlaying(false);
          // Update the global position to the end
          globalPositionRef.current = wavesurfer.getDuration();
          setCurrentTime(wavesurfer.getDuration());
        });
        
        wavesurfer.on('timeupdate', (time: number) => {
          if (track === activeTrack && !isChangingTrack.current) {
            setCurrentTime(time);
            globalPositionRef.current = time;
          }
        });
        
        wavesurfer.on('error', (err: Error) => {
          console.error(`Wavesurfer error for track ${track}:`, err);
          if (track === activeTrack) {
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error(`Error initializing track ${track}:`, error);
        if (track === activeTrack) {
          setIsLoading(false);
        }
      }
    };
    
    // Initialize all tracks
    const tracks: TrackType[] = ['A', 'B', 'C'];
    tracks.forEach(initializeTrack);
    
    // Clean up all instances on unmount
    return () => {
      clearTimeout(loadingTimeout);
      Object.entries(wavesurferRefs.current).forEach(([track, wavesurfer]) => {
        if (wavesurfer) {
          try {
            wavesurfer.destroy();
          } catch (e) {
            console.error(`Error destroying ${track}:`, e);
          }
        }
      });
    };
  }, []); // Only run on mount, not on every activeTrack change
  
  // Apply zoom level changes separately
  useEffect(() => {
    // Only try to apply zoom to initialized tracks
    Object.keys(tracksInitialized)
      .filter(track => tracksInitialized[track as TrackType] && trackLoadedRef.current[track as TrackType])
      .forEach(track => {
        applyZoomToTrack(track as TrackType);
      });
  }, [zoomLevel, tracksInitialized]);
  
  // Handle play/pause state changes
  useEffect(() => {
    const wavesurfer = wavesurferRefs.current[activeTrack];
    
    if (!wavesurfer || !tracksInitialized[activeTrack] || isChangingTrack.current || !trackLoadedRef.current[activeTrack]) {
      return;
    }
    
    try {
      if (isPlaying && !wavesurfer.isPlaying()) {
        wavesurfer.play();
      } else if (!isPlaying && wavesurfer.isPlaying()) {
        wavesurfer.pause();
      }
    } catch (error) {
      console.error(`Error controlling playback for track ${activeTrack}:`, error);
    }
  }, [isPlaying, activeTrack, tracksInitialized]);
  
  // Handle track switching
  const handleTrackSwitch = (track: TrackType) => {
    if (track === activeTrack || isChangingTrack.current) return;
    if (!tracksInitialized[track] || !trackLoadedRef.current[track]) {
      // Don't switch to uninitialized track
      console.log(`Can't switch to track ${track} - not ready yet`);
      return;
    }
    
    isChangingTrack.current = true;
    setIsLoading(true); // Show loading indicator when switching
    
    try {
      // Pause current track if playing
      const currentWavesurfer = wavesurferRefs.current[activeTrack];
      if (currentWavesurfer && trackLoadedRef.current[activeTrack]) {
        try {
          if (currentWavesurfer.isPlaying()) {
            currentWavesurfer.pause();
          }
          
          // Store current position to global position
          globalPositionRef.current = currentWavesurfer.getCurrentTime();
        } catch (e) {
          console.error(`Error pausing track ${activeTrack}:`, e);
        }
        
        // Hide current track
        if (waveformRefs.current[activeTrack]) {
          waveformRefs.current[activeTrack]!.style.display = 'none';
          minimapRefs.current[activeTrack]!.style.display = 'none';
        }
      }
      
      // Show new track
      if (waveformRefs.current[track]) {
        waveformRefs.current[track]!.style.display = 'block';
        minimapRefs.current[track]!.style.display = 'block';
      }
      
      // Set position of new track to match global position
      const newWavesurfer = wavesurferRefs.current[track];
      if (newWavesurfer && trackLoadedRef.current[track]) {
        try {
          // Make sure we have a duration (audio is loaded)
          if (newWavesurfer.getDuration() > 0) {
            const duration = newWavesurfer.getDuration();
            const seekPos = Math.min(globalPositionRef.current / duration, 0.99);
            
            // Seek to position
            newWavesurfer.seekTo(seekPos);
            
            // Continue playing if was playing
            if (isPlaying) {
              // Small delay to avoid issues
              setTimeout(() => {
                try {
                  newWavesurfer.play();
                } catch (e) {
                  console.error(`Error playing track ${track} after switch:`, e);
                }
              }, 100);
            }
          }
        } catch (e) {
          console.error(`Error seeking track ${track}:`, e);
        }
      }
      
      // Update active track
      setActiveTrack(track);
    } catch (error) {
      console.error('Error switching tracks:', error);
    } finally {
      setTimeout(() => {
        isChangingTrack.current = false;
        setIsLoading(false);  
      }, 200);
    }
  };
  
  // Toggle play/pause for active track
  const togglePlayPause = () => {
    if (isChangingTrack.current) return;
    
    const wavesurfer = wavesurferRefs.current[activeTrack];
    if (!wavesurfer || !tracksInitialized[activeTrack] || !trackLoadedRef.current[activeTrack]) return;
    
    try {
      if (isPlaying) {
        wavesurfer.pause();
        setIsPlaying(false);
      } else {
        wavesurfer.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error(`Error toggling playback:`, error);
    }
  };
  
  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate overall loading progress for display
  const getLoadingMessage = () => {
    const loadingTrack = Object.entries(loadingStatus).find(([track, status]) => 
      status !== 'ready'
    );
    
    if (!loadingTrack) return null;
    
    const [track, status] = loadingTrack;
    
    switch (status) {
      case 'initializing':
        return `Initializing Track ${track}...`;
      case 'loading-audio':
        return `Loading ${track}.mp3 audio data...`;
      case 'generating-waveform':
        return `Generating Track ${track} waveform...`;
      default:
        return `Processing Track ${track}...`;
    }
  };
  
  // Count how many tracks are fully ready
  const readyTracksCount = Object.values(loadingStatus).filter(status => status === 'ready').length;
  
  // Sync time display with active wavesurfer instance
  useEffect(() => {
    if (!isChangingTrack.current && wavesurferRefs.current[activeTrack] && trackLoadedRef.current[activeTrack]) {
      // Set up a timer to update the current time
      const timeUpdateInterval = setInterval(() => {
        try {
          const wavesurfer = wavesurferRefs.current[activeTrack];
          if (wavesurfer && wavesurfer.isPlaying()) {
            const time = wavesurfer.getCurrentTime();
            setCurrentTime(time);
            globalPositionRef.current = time;
          }
        } catch (error) {
          console.error('Error updating time:', error);
        }
      }, 250); // Update 4 times per second
      
      return () => clearInterval(timeUpdateInterval);
    }
  }, [activeTrack, isPlaying]);
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center space-x-4 mb-8">
        {(['A', 'B', 'C'] as TrackType[]).map((track) => (
          <button
            key={track}
            onClick={() => handleTrackSwitch(track)}
            disabled={!tracksInitialized[track] || !trackLoadedRef.current[track] || (isLoading && track !== activeTrack)}
            className={`
              w-32 h-16 text-xl font-bold border-2 rounded-md
              transition-colors duration-200 flex items-center justify-center
              ${activeTrack === track 
                ? 'border-green-500 bg-green-100 text-green-800' 
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'}
              ${(!tracksInitialized[track] || !trackLoadedRef.current[track] || (isLoading && track !== activeTrack)) 
                ? 'opacity-50 cursor-not-allowed' 
                : ''}
            `}
          >
            {track} 
            {loadingStatus[track] !== 'ready' && (
              <span className="ml-1 text-xs">
                {loadingStatus[track] === 'initializing' && '⋯'}
                {loadingStatus[track] === 'loading-audio' && '↓'}
                {loadingStatus[track] === 'generating-waveform' && '⟳'}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Loading progress indicator - only show after delay */}
      {showLoading && readyTracksCount < 3 && (
        <div className="mb-4 text-center">
          <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-800 font-medium">
              {getLoadingMessage() || 'Processing audio...'}
            </div>
            <div className="mt-1 text-xs text-blue-600">
              {readyTracksCount} of 3 tracks ready
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 min-h-[250px] flex flex-col">
        {/* Waveform containers */}
        <div className="w-full" style={{ height: '150px' }}>
          {(['A', 'B', 'C'] as TrackType[]).map((track) => (
            <div 
              key={`waveform-${track}`}
              ref={(el) => {
                waveformRefs.current[track] = el;
                return undefined;
              }}
              className="w-full h-full"
              style={{ 
                display: activeTrack === track ? 'block' : 'none',
              }}
            />
          ))}
        </div>
        
        {/* Minimap containers */}
        <div className="mt-4 w-full bg-gray-100 border border-gray-200 rounded p-1">
          <div className="w-full" style={{ height: '30px' }}>
            {(['A', 'B', 'C'] as TrackType[]).map((track) => (
              <div 
                key={`minimap-${track}`}
                ref={(el) => {
                  minimapRefs.current[track] = el;
                  return undefined;
                }}
                className="w-full h-full"
                style={{ 
                  display: activeTrack === track ? 'block' : 'none',
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="text-xs text-gray-400 text-right mt-1">
          Current Track: {activeTrack} | Time: {formatTime(currentTime)}
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !tracksInitialized[activeTrack] || !trackLoadedRef.current[activeTrack]}
          className={`
            px-6 py-2 rounded-md transition-colors duration-200 text-white
            ${(!isLoading && tracksInitialized[activeTrack] && trackLoadedRef.current[activeTrack])
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
              : 'bg-blue-300 cursor-not-allowed'}
          `}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        {Object.values(tracksInitialized).some((v, i) => !v || !trackLoadedRef.current[(['A', 'B', 'C'] as TrackType[])[i]]) && (
          <div className="text-xs text-gray-500">
            Initializing tracks...
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCompare;