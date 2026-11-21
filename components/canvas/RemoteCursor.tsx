'use client';

import React from 'react';

interface RemoteCursorProps {
  userName: string;
  color: string;
  x: number;
  y: number;
}

export function RemoteCursor({ userName, color, x, y }: RemoteCursorProps) {
  return (
    <div
      className="absolute top-0 left-0 pointer-events-none z-50 transition-transform duration-75 ease-out select-none will-change-transform"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* Tactical cursor icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        <path
          d="M4.5 3.5L18.5 10.5L11.5 13.5L8.5 20.5L4.5 3.5Z"
          fill={color}
          stroke="#0B0D12"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Operator callsign pill */}
      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded flex items-center gap-1.5 shadow-xl border backdrop-blur-sm whitespace-nowrap"
        style={{
          backgroundColor: '#141720ee',
          borderColor: color,
          boxShadow: `0 0 10px ${color}33`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] font-display font-bold text-white tracking-wide">
          {userName}
        </span>
      </div>
    </div>
  );
}
