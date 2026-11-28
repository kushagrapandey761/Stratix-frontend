'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BrandLogo } from '../ui/brand-logo';

export function Navbar({ onCreateClick, onJoinClick }: { onCreateClick: () => void; onJoinClick: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#292E3A] bg-[#0B0D12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo showTag />
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
          <Link
            href="/dashboard"
            className="text-sm font-display font-medium text-[#9298A5] hover:text-white transition-colors"
          >
            Public Rooms
          </Link>
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
