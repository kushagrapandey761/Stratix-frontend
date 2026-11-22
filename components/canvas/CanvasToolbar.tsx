'use client';

import React from 'react';
import {
  MousePointer,
  Pencil,
  Minus,
  MoveRight,
  Circle as CircleIcon,
  MapPin,
  Type,
  Eraser,
} from 'lucide-react';
import { CanvasTool } from '../../types/canvas';

interface CanvasToolbarProps {
  currentTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
}

interface ToolDefinition {
  id: CanvasTool;
  label: string;
  hotkey: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TOOLS: ToolDefinition[] = [
  {
    id: 'select',
    label: 'Select & Move',
    hotkey: 'V',
    icon: MousePointer,
    description: 'Select, drag, or delete elements',
  },
  {
    id: 'draw',
    label: 'Freehand Path',
    hotkey: 'D',
    icon: Pencil,
    description: 'Draw freehand tactical movement lines',
  },
  {
    id: 'line',
    label: 'Straight Line',
    hotkey: 'L',
    icon: Minus,
    description: 'Draw clean straight tactical vectors',
  },
  {
    id: 'arrow',
    label: 'Tactical Arrow',
    hotkey: 'A',
    icon: MoveRight,
    description: 'Draw directional pushes and flanks',
  },
  {
    id: 'circle',
    label: 'Filled Circle',
    hotkey: 'C',
    icon: CircleIcon,
    description: 'Draw filled tactical zones',
  },
  {
    id: 'ping',
    label: 'Tactical Ping',
    hotkey: 'P',
    icon: MapPin,
    description: 'Place location markers & target pings',
  },
  {
    id: 'text',
    label: 'Text Annotation',
    hotkey: 'T',
    icon: Type,
    description: 'Add tactical callouts & strategy notes',
  },
  {
    id: 'eraser',
    label: 'Eraser',
    hotkey: 'E',
    icon: Eraser,
    description: 'Click elements to erase them',
  },
];

export function CanvasToolbar({ currentTool, onSelectTool }: CanvasToolbarProps) {
  return (
    <aside className="absolute left-4 top-20 z-30 flex flex-col items-center bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] rounded-xl p-1.5 shadow-2xl gap-1.5">
      <div className="text-[9px] font-tactical text-[#9298A5] px-1 py-0.5 uppercase tracking-wider text-center border-b border-[#292E3A] pb-1 w-full">
        TOOLS
      </div>

      <div className="flex flex-col gap-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = currentTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              title={`${tool.label} (${tool.hotkey}) - ${tool.description}`}
              className={`relative group w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#FF4655] text-white shadow-[0_0_15px_rgba(255,70,85,0.4)] scale-105'
                  : 'text-[#9298A5] hover:text-white hover:bg-[#191D27]'
              }`}
            >
              <Icon className="w-4 h-4" />

              {/* Floating tooltip on hover */}
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-md bg-[#191D27] border border-[#292E3A] text-white text-xs font-display whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl flex items-center gap-2">
                <span className="font-bold">{tool.label}</span>
                <span className="font-tactical text-[10px] text-[#FF4655] bg-[#0B0D12] px-1.5 py-0.5 rounded border border-[#292E3A]">
                  {tool.hotkey}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
