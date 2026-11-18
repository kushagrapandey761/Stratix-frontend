'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchValorantMaps } from '@/lib/valorant-maps';
import type { IValorantMap } from '@/components/landing/supported-maps/IMapsResponse';

const COMPETITIVE_MAP_NAMES = [
  'Ascent',
  'Bind',
  'Haven',
  'Split',
  'Lotus',
  'Sunset',
  'Icebox',
  'Breeze',
  'Fracture',
  'Pearl',
  'Abyss',
  'Corrode',
];

export function SupportedMaps() {
  const [maps, setMaps] = useState<IValorantMap[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {

    async function loadMaps() {
      try {
        const mapData = await fetchValorantMaps();
        const mapsByName = new Map(
          mapData.map((map) => [map.displayName, map] as const),
        );
        setMaps(
          COMPETITIVE_MAP_NAMES.flatMap((name) => {
            const map = mapsByName.get(name);
            return map ? [map] : [];
          }),
        );
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load Valorant maps');
      }
    }

    void loadMaps();
    return () => {};
  }, []);

  return (
    <section id="maps" className="py-24 bg-[#141720]/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-[11px] font-tactical text-[#FF4655] tracking-widest uppercase mb-3">Map Database</div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-wider">
            All 12 Maps Supported
          </h2>
          <p className="text-sm text-[#9298A5] mt-3 max-w-xl mx-auto">
            High-fidelity minimaps for every competitive map in the current pool.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {maps.map((map) => (
            <div
              key={map.uuid}
              className="relative group overflow-hidden rounded-lg aspect-square bg-[#191D27] border border-[#292E3A] hover:border-[#FF4655]/50 transition-all cursor-pointer"
            >
              <Image
                width={400}
                height={400}
                src={map.splash}
                alt={map.displayName}
                className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-xs font-display font-bold text-white uppercase tracking-wider">{map.displayName}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <p role="alert" className="text-center text-xs text-[#FF4655] mt-6 font-tactical">{error}</p>}
      </div>
    </section>
  );
}
