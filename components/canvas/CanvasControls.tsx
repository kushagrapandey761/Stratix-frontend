'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  elementsCount: number;
}

export function CanvasControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  elementsCount,
}: CanvasControlsProps) {
  const handleClearWithConfirm = () => {
    if (elementsCount === 0) return;
    if (window.confirm('Clear all tactical drawings from this map?')) {
      onClear();
    }
  };

  return (
    <div className="absolute top-4 left-20 z-30 flex items-center gap-2">
      {/* Undo / Redo group */}
      <div className="flex items-center bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] rounded-lg p-1 shadow-xl">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-[#191D27] text-[#9298A5] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="p-1.5 rounded hover:bg-[#191D27] text-[#9298A5] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] rounded-lg p-1 shadow-xl gap-1">
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[#191D27] text-[#9298A5] hover:text-white transition-all"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-tactical text-slate-300 px-1 select-none min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[#191D27] text-[#9298A5] hover:text-white transition-all"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onResetZoom}
          title="Reset View (1:1)"
          className="p-1.5 rounded hover:bg-[#191D27] text-[#9298A5] hover:text-white transition-all ml-0.5 border-l border-[#292E3A]"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Clear canvas */}
      <button
        onClick={handleClearWithConfirm}
        disabled={elementsCount === 0}
        title="Clear All Drawings"
        className="flex items-center gap-1.5 bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] hover:border-[#FF4655] rounded-lg px-2.5 py-1.5 text-xs font-display font-semibold text-[#9298A5] hover:text-[#FF4655] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xl"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Clear</span>
      </button>

      {/* Quick shortcuts helper pill */}
      <div className="hidden lg:flex items-center gap-2 bg-[#141720]/90 border border-[#292E3A] rounded-lg px-2.5 py-1 text-[10px] font-tactical text-[#9298A5]">
        <span>HINTS:</span>
        <span className="text-slate-300">Space + Drag</span> to Pan
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">Wheel</span> to Zoom
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">V</span> Select
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">Del</span> Remove
      </div>
    </div>
  );
}
