import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-[10px] font-tactical text-[#A855F7] tracking-widest uppercase">
          Route Stub
        </div>
        <h1 className="text-4xl font-display font-black text-white uppercase tracking-wider">
          /room/[roomId]
        </h1>
        <p className="text-sm text-[#9298A5] font-tactical">
          Tactical Workspace — room: <span className="text-white">{params.roomId}</span>
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-display font-semibold text-[#9298A5] hover:text-white transition-colors mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
