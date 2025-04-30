'use client';

import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Zoom from 'wavesurfer.js/dist/plugins/zoom.esm.js';
import Minimap from 'wavesurfer.js/dist/plugins/minimap.esm.js';

type TrackType = 'A' | 'B' | 'C';

const AudioCompare = () => {
  const [activeTrack, setActiveTrack] = useState<TrackType>('A');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isChangingTrackRef = useRef(false);
  
  // Use a single global position instead of track-specific positions
  const globalPositionRef = useRef(0);
  
  // Create separate audio files for each track to avoid blob URL issues
  const createAudioFile = (track: TrackType): string => {
    return `/${track}.mp3?nocache=${Date.now()}`;
  };
  
  // Track current time with manual polling to avoid circular updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (wavesurferRef.current && !isChangingTrackRef.current) {
        try {
          const time = wavesurferRef.current.getCurrentTime();
          setCurrentTime(time);
          
          // Store current time as the global position
          globalPositionRef.current = time;
        } catch (e) {
          // Ignore errors during time tracking
        }
      }
    }, 250);
    
    return () => clearInterval(interval);
  }, [activeTrack]);
  
  // Handle track changes and wavesurfer initialization
  useEffect(() => {
    isChangingTrackRef.current = true;
    setIsLoading(true);
    
    // Save global position if we have a wavesurfer instance
    if (wavesurferRef.current) {
      try {
        // Store the current time as global position
        globalPositionRef.current = wavesurferRef.current.getCurrentTime();
        
        // Destroy the previous instance
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      } catch (error) {
        console.error("Error destroying previous wavesurfer:", error);
      }
    }
    
    // Only create if the container exists
    if (!waveformRef.current || !minimapRef.current) {
      isChangingTrackRef.current = false;
      setIsLoading(false);
      return;
    }
    
    try {
      // Create a new instance with a direct file URL
      const audioUrl = createAudioFile(activeTrack);
      
      // Initialize with zoom and minimap plugins
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#6c757d',
        progressColor: '#4F4A85',
        height: 150,
        cursorColor: '#333',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        responsive: true,
        minPxPerSec: 50, // Default zoom level
        url: audioUrl, // Use URL directly instead of media element
        plugins: [
          Zoom.create({
            // Zoom plugin options
            maxZoom: 100, // Maximum zoom level
            scale: 0.5 // Amount to zoom on each step
          }),
          Minimap.create({
            container: minimapRef.current,
            waveColor: '#ddd',
            progressColor: '#999',
            height: 30,
            barWidth: 2,
            barGap: 1,
            barRadius: 1
          })
        ]
      });
      
      // Set up event listeners
      wavesurfer.on('ready', () => {
        // Apply zoom level after the track is loaded
        wavesurfer.zoom(zoomLevel);
        
        // Apply the global position to this track
        if (globalPositionRef.current > 0) {
          const duration = wavesurfer.getDuration() || 1;
          // Avoid seeking too close to the end which can cause issues
          const seekPos = Math.min(globalPositionRef.current / duration, 0.99);
          wavesurfer.seekTo(seekPos);
        }
        
        // Resume playing if it was playing before
        if (isPlaying) {
          wavesurfer.play();
        }
        
        setIsLoading(false);
        isChangingTrackRef.current = false;
      });
      
      // Use one-way data flow for play/pause state to avoid loops
      wavesurfer.on('play', () => {
        if (!isPlaying) setIsPlaying(true);
      });
      
      wavesurfer.on('pause', () => {
        if (isPlaying) setIsPlaying(false);
      });
      
      wavesurfer.on('finish', () => {
        if (isPlaying) setIsPlaying(false);
      });
      
      wavesurfer.on('error', (err: Error) => {
        console.error(`Wavesurfer error for track ${activeTrack}:`, err);
        setIsLoading(false);
        isChangingTrackRef.current = false;
      });
      
      // Store the instance
      wavesurferRef.current = wavesurfer;
    } catch (error) {
      console.error("Error initializing wavesurfer:", error);
      setIsLoading(false);
      isChangingTrackRef.current = false;
    }
    
    // Clean up on unmount
    return () => {
      try {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      } catch (error) {
        console.error("Error cleaning up:", error);
      }
    };
  }, [activeTrack, isPlaying, zoomLevel]);
  
  // Handle play state changes separately
  useEffect(() => {
    if (!wavesurferRef.current || isChangingTrackRef.current) return;
    
    if (isPlaying && !wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.play();
    } else if (!isPlaying && wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.pause();
    }
  }, [isPlaying]);
  
  // Handle track switching
  const handleTrackSwitch = (track: TrackType) => {
    if (track === activeTrack || isChangingTrackRef.current) return;
    
    // Store global position before switching
    if (wavesurferRef.current) {
      try {
        globalPositionRef.current = wavesurferRef.current.getCurrentTime();
      } catch (error) {
        console.error("Error getting current time:", error);
      }
    }
    
    // Switch tracks
    setActiveTrack(track);
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (isLoading || isChangingTrackRef.current) return;
    setIsPlaying(!isPlaying);
  };
  
  // Handle zoom level change
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setZoomLevel(value);
    
    // Apply zoom directly if wavesurfer instance exists and not loading
    if (wavesurferRef.current && !isChangingTrackRef.current && !isLoading) {
      try {
        wavesurferRef.current.zoom(value);
      } catch (error) {
        console.error("Error applying zoom:", error);
      }
    }
  };
  
  // Format time display (MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center space-x-4 mb-8">
        {(['A', 'B', 'C'] as TrackType[]).map((track) => (
          <button
            key={track}
            onClick={() => handleTrackSwitch(track)}
            disabled={isLoading && track !== activeTrack}
            className={`
              w-32 h-16 text-xl font-bold border-2 rounded-md
              transition-colors duration-200 flex items-center justify-center
              ${activeTrack === track 
                ? 'border-green-500 bg-green-100 text-green-800' 
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100'}
              ${isLoading && track !== activeTrack ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {track}
          </button>
        ))}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 min-h-[200px] flex flex-col">
        <div ref={waveformRef} className="w-full flex-1"></div>
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="text-gray-500">Loading {activeTrack}.mp3...</div>
          </div>
        )}
        <div className="mt-2 w-full bg-gray-100 border border-gray-200 rounded p-1">
          <div ref={minimapRef} className="w-full h-[30px]"></div>
        </div>
        <div className="text-xs text-gray-400 text-right mt-1">
          Current Track: {activeTrack} | Time: {formatTime(currentTime)}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        
        <div className="flex items-center gap-4">
          <div className="text-gray-700 font-mono">
            {formatTime(currentTime)}
          </div>
          
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`
              px-6 py-2 rounded-md transition-colors duration-200 text-white
              ${!isLoading
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                : 'bg-blue-300 cursor-not-allowed'}
            `}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioCompare;