'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';

export function CtaSection({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="bg-[#191D27] border border-[#292E3A] rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF4655] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF4655]/5 via-transparent to-[#A855F7]/5 pointer-events-none" />
          <div className="relative">
            <div className="text-[11px] font-tactical text-[#FF4655] tracking-widest uppercase mb-4">
              Ready to Dominate?
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-wider mb-4">
              Plan Smarter.
              <br />
              Win More.
            </h2>
            <p className="text-sm text-[#9298A5] mb-8 max-w-lg mx-auto">
              Your team is waiting. Create your first room and start building
              strategies that win.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={onCreateClick}
                className="flex items-center gap-2 bg-[#FF4655] hover:bg-[#e03545] text-white font-display font-bold px-8 py-3.5 rounded-lg transition-all hover:shadow-[0_0_30px_rgba(255,70,85,0.5)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Your Room
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 border border-[#292E3A] hover:border-[#9298A5] text-[#9298A5] hover:text-white font-display font-semibold px-8 py-3.5 rounded-lg transition-all"
              >
                View Dashboard
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
