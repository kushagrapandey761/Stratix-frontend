'use client';

import { Layers, Map, Share2, Shield, Users, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: Map,
    title: 'All 12 Maps',
    desc: 'Every official Valorant map — Ascent, Bind, Haven, Split, and more — rendered with high-res minimaps.',
    color: '#FF4655',
  },
  {
    icon: Users,
    title: 'Real-Time Rooms',
    desc: "Invite your team into a private room. See everyone's cursor, drawings, and placements live.",
    color: '#A855F7',
  },
  {
    icon: Zap,
    title: 'Full Drawing Suite',
    desc: 'Lines, arrows, freehand paths, pings, and text annotations — with undo/redo and color coding.',
    color: '#00F0FF',
  },
  {
    icon: Shield,
    title: 'Save Strategies',
    desc: 'Store unlimited strategies per map. Revisit and iterate on your playbook between matches.',
    color: '#22c55e',
  },
  {
    icon: Layers,
    title: 'Agent Assignment',
    desc: 'Assign agents to players, color-code their paths, and build cohesive team compositions.',
    color: '#eab308',
  },
  {
    icon: Share2,
    title: 'Instant Sharing',
    desc: 'Share a room code or invite link. Teammates join in seconds, no account needed.',
    color: '#3b82f6',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#141720]/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-[11px] font-tactical text-[#FF4655] tracking-widest uppercase mb-3">Capabilities</div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-wider">
            Everything Your Team Needs
          </h2>
          <p className="text-sm text-[#9298A5] mt-3 max-w-xl mx-auto">
            Built for competitive Valorant teams. Every tool designed around how pros actually plan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#191D27] border border-[#292E3A] rounded-xl p-5 group hover:border-[#3a3f4d] transition-all"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${feature.color}18`, border: `1px solid ${feature.color}30` }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="font-display font-bold text-white text-base mb-1.5">{feature.title}</h3>
              <p className="text-sm text-[#9298A5] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
