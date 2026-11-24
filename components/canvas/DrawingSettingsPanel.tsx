'use client';

import React, { useRef } from 'react';

interface DrawingSettingsPanelProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  strokeWidth: number;
  onSelectStrokeWidth: (width: number) => void;
}

const STROKE_WIDTHS = [2, 4, 6, 8];

function hexToHsv(hex: string) {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: (hue + 360) % 360,
    saturation: max === 0 ? 0 : delta / max,
    brightness: max,
  };
}

function hsvToHex(hue: number, saturation: number, brightness: number) {
  const chroma = brightness * saturation;
  const hueSection = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const offset = brightness - chroma;
  const [red, green, blue] =
    hueSection < 1
      ? [chroma, secondary, 0]
      : hueSection < 2
        ? [secondary, chroma, 0]
        : hueSection < 3
          ? [0, chroma, secondary]
          : hueSection < 4
            ? [0, secondary, chroma]
            : hueSection < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];

  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function DrawingSettingsPanel({
  currentColor,
  onSelectColor,
  strokeWidth,
  onSelectStrokeWidth,
}: DrawingSettingsPanelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isPickingColor = useRef(false);
  const { hue, saturation, brightness } = hexToHsv(currentColor);

  const selectWheelColor = (clientX: number, clientY: number) => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const bounds = wheel.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) / 2;
    let x = (clientX - (bounds.left + bounds.width / 2)) / radius;
    let y = (clientY - (bounds.top + bounds.height / 2)) / radius;
    const distance = Math.hypot(x, y);

    if (distance > 1) {
      x /= distance;
      y /= distance;
    }

    const selectedHue = (Math.atan2(y, x) * (180 / Math.PI) + 90 + 360) % 360;
    onSelectColor(hsvToHex(selectedHue, Math.min(distance, 1), brightness));
  };

  const handleWheelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();

    const hueStep = event.key === 'ArrowLeft' ? -5 : event.key === 'ArrowRight' ? 5 : 0;
    const saturationStep = event.key === 'ArrowDown' ? -0.05 : event.key === 'ArrowUp' ? 0.05 : 0;
    const nextHue = (hue + hueStep + 360) % 360;
    const nextSaturation = Math.max(0, Math.min(1, saturation + saturationStep));
    onSelectColor(hsvToHex(nextHue, nextSaturation, brightness));
  };

  const markerAngle = ((hue - 90) * Math.PI) / 180;
  const markerRadius = saturation * 50;

  return (
    <div className="absolute left-4 top-[380px] z-30 flex flex-col items-center bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] rounded-xl p-2 shadow-2xl gap-2 w-40">
      {/* Stroke width selector */}
      <div className="text-[9px] font-tactical text-[#9298A5] uppercase tracking-wider text-center">
        SIZE
      </div>
      <div className="grid grid-cols-4 gap-1 w-full pb-2 border-b border-[#292E3A]">
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

      <div className="text-[9px] font-tactical text-[#9298A5] uppercase tracking-wider text-center">
        COLOR WHEEL
      </div>
      <div
        ref={wheelRef}
        role="group"
        tabIndex={0}
        aria-label={`Color wheel, selected ${currentColor}. Use arrow keys to adjust.`}
        onKeyDown={handleWheelKeyDown}
        onPointerDown={(event) => {
          event.preventDefault();
          isPickingColor.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          selectWheelColor(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (isPickingColor.current) selectWheelColor(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          isPickingColor.current = false;
        }}
        onPointerCancel={() => {
          isPickingColor.current = false;
        }}
        className="relative w-28 h-28 rounded-full border border-white/20 shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] touch-none cursor-crosshair"
        style={{
          background:
            'radial-gradient(circle, #fff 0%, transparent 72%), conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      >
        <span
          aria-hidden="true"
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.65)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${50 + Math.cos(markerAngle) * markerRadius}%`,
            top: `${50 + Math.sin(markerAngle) * markerRadius}%`,
            backgroundColor: currentColor,
          }}
        />
      </div>
      <label className="w-full flex items-center gap-2 text-[9px] font-tactical text-[#9298A5]">
        <span>BRIGHTNESS</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(brightness * 100)}
          onChange={(event) =>
            onSelectColor(hsvToHex(hue, saturation, Number(event.currentTarget.value) / 100))
          }
          aria-label="Color brightness"
          className="min-w-0 flex-1 accent-[#FF4655]"
        />
      </label>
    </div>
  );
}
