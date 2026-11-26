'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';
import type { IValorantMap } from '../landing/supported-maps/IMapsResponse';
import { CanvasElement } from '../../types/canvas';

const DynamicTacticalCanvas = dynamic(
  () => import('./TacticalCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] bg-[#0B0D12] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#FF4655] animate-spin" />
        <div className="text-xs font-tactical text-[#9298A5] tracking-widest uppercase">
          INITIALIZING TACTICAL RADAR CANVAS...
        </div>
      </div>
    ),
  }
);

interface CanvasWrapperProps {
  currentMap: IValorantMap;
  maps: IValorantMap[];
  onSelectMap: (map: IValorantMap) => void;
  onElementsChange?: (elements: CanvasElement[]) => void;
  onMapPointerMove?: (position: { x: number; y: number }) => void;
  initialElements?: CanvasElement[];
  roomId?: string;
}

export function CanvasWrapper(props: CanvasWrapperProps) {
  return <DynamicTacticalCanvas {...props} />;
}
