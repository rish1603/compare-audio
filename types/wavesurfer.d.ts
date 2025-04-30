declare module 'wavesurfer.js' {
  interface WaveSurferOptions {
    container: HTMLElement | string;
    waveColor?: string;
    progressColor?: string;
    cursorColor?: string;
    height?: number;
    cursorWidth?: number;
    barWidth?: number;
    barGap?: number;
    barRadius?: number;
    responsive?: boolean;
    url?: string;
    [key: string]: any;
  }

  interface WaveSurferEvents {
    ready: () => void;
    play: () => void;
    pause: () => void;
    finish: () => void;
    audioprocess: (time: number) => void;
    seeking: (time: number) => void;
    interaction: () => void;
    [key: string]: any;
  }

  class WaveSurfer {
    static create(options: WaveSurferOptions): WaveSurfer;
    
    on<K extends keyof WaveSurferEvents>(event: K, callback: WaveSurferEvents[K]): this;
    on(event: string, callback: Function): this;
    
    un<K extends keyof WaveSurferEvents>(event: K, callback: WaveSurferEvents[K]): this;
    un(event: string, callback: Function): this;
    
    load(url: string): this;
    play(start?: number, end?: number): this;
    pause(): this;
    stop(): this;
    destroy(): void;
    
    isPlaying(): boolean;
    getCurrentTime(): number;
    getDuration(): number;
    setVolume(volume: number): this;
    getVolume(): number;
    
    seekTo(progress: number): this;
    skip(seconds: number): this;
    
    setMute(mute: boolean): this;
    getMute(): boolean;
    
    setHeight(height: number): this;
    zoom(pxPerSec: number): this;
  }
  
  export default WaveSurfer;
} 