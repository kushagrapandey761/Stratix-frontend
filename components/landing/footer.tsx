import { BrandLogo } from '../ui/brand-logo';

export function Footer() {
  return (
    <footer className="border-t border-[#292E3A] py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BrandLogo size={24} />
        </div>
        <p className="text-xs text-[#9298A5] font-tactical">
          Not affiliated with Riot Games. Valorant and all related marks are property of Riot Games, Inc.
        </p>
        <p className="text-xs text-[#9298A5] font-tactical">© 2025 STRATIX</p>
      </div>
    </footer>
  );
}
