'use client';

const STEPS = [
  { num: '01', title: 'Create a Room', desc: 'Set a name, choose your visibility, and generate a unique room code in seconds.' },
  { num: '02', title: 'Invite Teammates', desc: 'Share the room code or link. Up to 10 players can join and collaborate live.' },
  { num: '03', title: 'Pick Your Map', desc: 'Choose from all 12 official Valorant maps. The minimap loads instantly.' },
  { num: '04', title: 'Draw & Strategize', desc: 'Use lines, arrows, pings, and text to build your perfect strategy on the canvas.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-[11px] font-tactical text-[#A855F7] tracking-widest uppercase mb-3">Process</div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-wider">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, index) => (
            <div key={step.num} className="relative">
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#292E3A] to-transparent z-0" />
              )}
              <div className="bg-[#191D27] border border-[#292E3A] rounded-xl p-5 relative z-10">
                <div className="text-3xl font-display font-black text-[#FF4655]/30 mb-3">{step.num}</div>
                <h3 className="font-display font-bold text-white text-base mb-1.5">{step.title}</h3>
                <p className="text-sm text-[#9298A5] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
