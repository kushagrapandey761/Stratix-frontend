'use client';

import Link from 'next/link';
import { ChevronRight, Globe, Lock, Map, Plus, Share2, Shield, Target, Users, Zap } from 'lucide-react';

export function Navbar({ onCreateClick, onJoinClick }: { onCreateClick: () => void; onJoinClick: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#292E3A] bg-[#0B0D12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-[#FF4655] flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-black text-white text-lg tracking-widest uppercase">STRATIX</span>
          <span className="text-[9px] font-tactical text-[#FF4655] tracking-widest border border-[#FF4655]/30 px-1 py-0.5 rounded">
            TACTICAL
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Maps'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-display font-medium text-[#9298A5] hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onJoinClick}
            className="hidden sm:block text-sm font-display font-semibold text-[#9298A5] hover:text-white transition-colors px-3 py-1.5"
          >
            Join Room
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 text-sm font-display font-bold text-white bg-[#FF4655] hover:bg-[#e03545] transition-colors px-4 py-2 rounded"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Room
          </button>
        </div>
      </div>
    </nav>
  );
}
