import Link from 'next/link';
import { ArrowLeft, Radio } from 'lucide-react';

export function RoomError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#141720] border border-[#FF4655]/40 rounded-xl p-8 text-center space-y-4 shadow-tactical-card">
        <div className="w-12 h-12 rounded-full bg-[#FF4655]/10 border border-[#FF4655]/30 flex items-center justify-center mx-auto text-[#FF4655]">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <div className="text-[10px] font-tactical text-[#FF4655] tracking-widest uppercase">
          CONNECTION ABORTED
        </div>
        <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">
          Access Denied
        </h2>
        <p className="text-sm text-[#9298A5] font-body">{message}</p>
        <div className="pt-4 flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#191D27] border border-[#292E3A] text-xs font-display font-bold text-white hover:border-[#FF4655] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  );
}
