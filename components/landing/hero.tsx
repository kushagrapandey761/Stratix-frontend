'use client';

import { ArrowRight, Layers, Map, Play, Plus, Share2, Target } from 'lucide-react';

export function Hero({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#FF4655 1px, transparent 1px), linear-gradient(90deg, #FF4655 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#FF4655]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-[#A855F7]/5 blur-[80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#FF4655]/10 border border-[#FF4655]/20 rounded-full px-3 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4655] animate-pulse" />
            <span className="text-[11px] font-tactical text-[#FF4655] tracking-widest uppercase">
              Competitive Strategy Platform
            </span>
          </div>

          <h1 className="font-display font-black text-white leading-[1.05] mb-6">
            <span className="text-5xl md:text-7xl block">Your Team.</span>
            <span className="text-5xl md:text-7xl block">Your Strategy.</span>
            <span className="text-5xl md:text-7xl block text-[#FF4655]">Your Victory.</span>
          </h1>

          <p className="text-base md:text-lg text-[#9298A5] leading-relaxed mb-10 max-w-xl font-body">
            Plan, draw, and execute Valorant strategies with your team in real time. Create a private room, pick your map,
            and start building winning plays together.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 bg-[#FF4655] hover:bg-[#e03545] text-white font-display font-bold px-6 py-3.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,70,85,0.4)] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create a Room
            </button>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 border border-[#292E3A] hover:border-[#9298A5] text-[#9298A5] hover:text-white font-display font-semibold px-6 py-3.5 rounded-lg transition-all"
            >
              <Play className="w-4 h-4" />
              Explore Features
            </a>
          </div>

          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-[#292E3A]">
            {[
              { value: '12', label: 'Official Maps' },
              { value: '5v5', label: 'Team Support' },
              { value: '∞', label: 'Strategies' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-display font-black text-white">{stat.value}</div>
                <div className="text-xs font-tactical text-[#9298A5] tracking-wider uppercase mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
