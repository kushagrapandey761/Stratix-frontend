'use client';

import React, { useEffect } from 'react';
import { Mic, MicOff, Headphones, VolumeX, Radio } from 'lucide-react';

interface VoiceControlsProps {
  isMicEnabled: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeakingLocally: boolean;
  micError: string | null;
  onEnableMic: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
}

export function VoiceControls({
  isMicEnabled,
  isMuted,
  isDeafened,
  isSpeakingLocally,
  micError,
  onEnableMic,
  onToggleMute,
  onToggleDeafen,
}: VoiceControlsProps) {
  // Keyboard shortcut: Press 'M' to toggle mute (when not focused in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        if (isMicEnabled) {
          e.preventDefault();
          onToggleMute();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMicEnabled, onToggleMute]);

  if (!isMicEnabled) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onEnableMic}
          title="Connect to Tactical Voice Comms (P2P Encrypted)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF4655]/10 border border-[#FF4655]/40 text-[#FF4655] hover:bg-[#FF4655] hover:text-white transition-all text-xs font-display font-bold shadow-lg shadow-[#FF4655]/10 group"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>JOIN VOICE</span>
        </button>
        {micError && (
          <span className="text-[10px] font-tactical text-[#FF4655] hidden lg:inline truncate max-w-[150px]" title={micError}>
            ⚠️ {micError}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-[#191D27] border border-[#292E3A] rounded-lg p-1 shadow-md">
      {/* Microphone Mute / Unmute Button */}
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Unmute Microphone (M)' : 'Mute Microphone (M)'}
        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-display font-bold transition-all ${
          isMuted
            ? 'bg-[#FF4655]/20 text-[#FF4655] border border-[#FF4655]/30'
            : isSpeakingLocally
            ? 'bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
            : 'bg-[#141720] text-slate-200 border border-[#292E3A] hover:border-slate-400'
        }`}
      >
        {isMuted ? (
          <MicOff className="w-3.5 h-3.5" />
        ) : (
          <Mic className={`w-3.5 h-3.5 ${isSpeakingLocally ? 'text-green-400 scale-110' : ''}`} />
        )}
        <span className="text-[10px] font-tactical">
          {isMuted ? 'MUTED' : isSpeakingLocally ? 'TALKING' : 'VOICE ON'}
        </span>
      </button>

      {/* Deafen / Undeafen Button */}
      <button
        onClick={onToggleDeafen}
        title={isDeafened ? 'Undeafen Voice' : 'Deafen (Mute incoming teammates)'}
        className={`p-1.5 rounded transition-all ${
          isDeafened
            ? 'bg-[#FF4655]/20 text-[#FF4655] border border-[#FF4655]/30'
            : 'text-[#9298A5] hover:text-white hover:bg-[#141720]'
        }`}
      >
        {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
