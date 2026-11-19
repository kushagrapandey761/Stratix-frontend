import type { FormEvent } from 'react';

interface CallsignPromptProps {
  callsign: string;
  error: string;
  onCallsignChange: (callsign: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function CallsignPrompt({
  callsign,
  error,
  onCallsignChange,
  onSubmit,
}: CallsignPromptProps) {
  return (
    <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="max-w-md w-full bg-[#141720] border border-[#292E3A] rounded-xl p-8 space-y-5 shadow-tactical-card"
      >
        <div className="text-[10px] font-tactical text-[#FF4655] tracking-widest uppercase">
          JOIN SESSION
        </div>
        <h1 className="text-xl font-display font-black text-white uppercase tracking-wider">
          Enter your callsign
        </h1>
        <p className="text-sm text-[#9298A5] font-body">
          Choose the name other operators will see in this room.
        </p>
        <div>
          <label
            htmlFor="room-callsign"
            className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5"
          >
            Callsign
          </label>
          <input
            id="room-callsign"
            autoFocus
            required
            value={callsign}
            onChange={(event) => onCallsignChange(event.target.value)}
            placeholder="e.g. TenZ, ViperProtocol"
            className="w-full bg-[#0B0D12] border border-[#292E3A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4a5160] focus:outline-none focus:border-[#FF4655] transition-colors font-body"
          />
          {error && <p className="text-[11px] text-[#FF4655] mt-1.5 font-tactical">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-[#FF4655] hover:bg-[#e03545] text-white font-display font-bold text-sm py-3 rounded-lg transition-colors"
        >
          JOIN ROOM
        </button>
      </form>
    </div>
  );
}
