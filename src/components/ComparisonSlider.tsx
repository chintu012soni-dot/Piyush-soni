import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function ComparisonSlider({ beforeImage, afterImage }: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseDown = () => setIsResizing(true);
  const onMouseMove = (e: MouseEvent) => {
    if (isResizing) handleMove(e.clientX);
  };

  const onTouchStart = () => setIsResizing(true);
  const onTouchMove = (e: TouchEvent) => {
    if (isResizing) handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsResizing(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video rounded-3xl overflow-hidden cursor-col-resize select-none border border-zinc-800 bg-zinc-900 shadow-2xl group"
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onTouchMove={onTouchMove}
      onTouchStart={onTouchStart}
    >
      {/* After Image (Base Layer) */}
      <img
        src={afterImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Before Image (Clipped Layer) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-white/80 z-10"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 h-full max-w-none object-contain pointer-events-none"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 w-px bg-white/20 transition-opacity group-hover:opacity-100 opacity-0 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      />
      
      <div
        className="absolute top-1/2 -translate-y-1/2 z-30 transition-transform hover:scale-110 active:scale-95"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-10 h-10 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-2xl transform -translate-x-1/2 cursor-grab active:cursor-grabbing">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7l-4 4m0 0l4 4m-4-4h16m-4-4l4 4m0 0l4-4" />
          </svg>
        </div>
      </div>
      
      {/* Floating Labels */}
      <div className="absolute top-6 left-6 z-20 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em]">
        Original
      </div>
      <div className="absolute top-6 right-6 z-20 px-4 py-1.5 bg-indigo-600/90 backdrop-blur-md border border-indigo-400/20 rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-xl">
        Restored
      </div>

      {/* View Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] text-white/70 uppercase tracking-widest font-medium">
        Drag to compare
      </div>
    </div>
  );
}
