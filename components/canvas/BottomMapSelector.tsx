'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Map as MapIcon } from 'lucide-react';
import type { IValorantMap } from '../landing/supported-maps/IMapsResponse';
import { getMapSiteCount } from '../../lib/valorant-maps';

interface BottomMapSelectorProps {
  currentMap: IValorantMap;
  maps: IValorantMap[];
  onSelectMap: (map: IValorantMap) => void;
}

export function BottomMapSelector({ currentMap, maps, onSelectMap }: BottomMapSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-1.5 flex items-center gap-1.5 px-3 py-1 bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] hover:border-[#FF4655] rounded-full text-[10px] font-tactical text-[#9298A5] hover:text-white transition-all shadow-xl"
      >
        <MapIcon className="w-3 h-3 text-[#FF4655]" />
        <span>MAP SELECTOR ({maps.length})</span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Map Strip */}
      {isExpanded && (
        <div className="bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] rounded-xl p-2 shadow-2xl flex items-center gap-2 max-w-[85vw] overflow-x-auto scrollbar-none animate-slide-up">
          {maps.map((map) => {
            const isSelected = map.uuid === currentMap.uuid;
            const siteCount = getMapSiteCount(map);

            return (
              <button
                key={map.uuid}
                onClick={() => onSelectMap(map)}
                className={`relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border transition-all group ${
                  isSelected
                    ? 'border-[#FF4655] shadow-[0_0_15px_rgba(255,70,85,0.4)] scale-105'
                    : 'border-[#292E3A] hover:border-[#9298A5] opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={map.splash || map.displayIcon}
                  alt={map.displayName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to minimap if splash fails
                    (e.currentTarget as HTMLImageElement).src = map.displayIcon;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-display font-black text-white uppercase tracking-wider truncate">
                    {map.displayName}
                  </span>
                  <span className="text-[8px] font-tactical text-[#FF4655]">
                    {siteCount ? `${siteCount}S` : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
