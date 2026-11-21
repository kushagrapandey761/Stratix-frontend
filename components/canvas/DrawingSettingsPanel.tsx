'use client';

import React from 'react';

interface DrawingSettingsPanelProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  strokeWidth: number;
  onSelectStrokeWidth: (width: number) => void;
}

const TACTICAL_COLORS = [
  { hex: '#FF4655', label: 'Enemy / Execute' },
  { hex: '#22C55E', label: 'Push / Rotate' },
  { hex: '#3B82F6', label: 'Utility / Smokes' },
  { hex: '#EAB308', label: 'Hazard / Flash' },
  { hex: '#A855F7', label: 'Fake / Alt Strat' },
  { hex: '#00F0FF', label: 'Objective / Spike' },
  { hex: '#FFFFFF', label: 'Neutral Callout' },
];

const STROKE_WIDTHS = [2, 4, 6, 8];

export function DrawingSettingsPanel({
  currentColor,
  onSelectColor,
  strokeWidth,
  onSelectStrokeWidth,
}: DrawingSettingsPanelProps) {
  return (
    <div className="absolute left-4 top-[380px] z-30 flex flex-col items-center bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] rounded-xl p-2 shadow-2xl gap-2 w-14">
      {/* Stroke width selector */}
      <div className="text-[9px] font-tactical text-[#9298A5] uppercase tracking-wider text-center">
        SIZE
      </div>
      <div className="grid grid-cols-2 gap-1 w-full pb-2 border-b border-[#292E3A]">
        {STROKE_WIDTHS.map((width) => (
          <button
            key={width}
            onClick={() => onSelectStrokeWidth(width)}
            title={`Stroke width: ${width}px`}
            className={`h-6 rounded flex items-center justify-center transition-all ${
              strokeWidth === width
                ? 'bg-[#FF4655] text-white font-bold'
                : 'bg-[#191D27] text-[#9298A5] hover:text-white'
            }`}
          >
            <span className="text-[10px] font-tactical">{width}</span>
          </button>
        ))}
      </div>

      {/* Color palette */}
      <div className="text-[9px] font-tactical text-[#9298A5] uppercase tracking-wider text-center">
        COLOR
      </div>
      <div className="flex flex-col gap-1.5 items-center">
        {TACTICAL_COLORS.map((c) => {
          const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              onClick={() => onSelectColor(c.hex)}
              title={c.label}
              className={`w-6 h-6 rounded-full transition-transform relative ${
                isSelected
                  ? 'scale-125 ring-2 ring-white shadow-lg'
                  : 'hover:scale-110 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
