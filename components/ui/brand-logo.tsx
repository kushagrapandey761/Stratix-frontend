import Image from 'next/image';

interface BrandLogoProps {
  size?: number;
  showTag?: boolean;
}

export function BrandLogo({ size = 32, showTag = false }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/stratix-mark.svg" alt="" width={size} height={size} />
      <span
        className={`font-display font-black text-white tracking-widest uppercase ${
          size < 28 ? 'text-sm' : size < 32 ? 'text-base' : 'text-lg'
        }`}
      >
        STRATIX
      </span>
      {showTag && (
        <span className="text-[9px] font-tactical text-[#FF4655] tracking-widest border border-[#FF4655]/30 px-1 py-0.5 rounded">
          TACTICAL
        </span>
      )}
    </span>
  );
}
