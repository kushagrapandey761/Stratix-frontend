'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Globe, Lock, X } from 'lucide-react';

export function CreateRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'created'>('form');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const createRoomCode = () => 'STRAT-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCreate = () => {
    if (!name.trim()) return;
    setCode(createRoomCode());
    setStep('created');
  };

  const handleClose = () => {
    setStep('form');
    setName('');
    setDesc('');
    setCode('');
    onClose();
  };

  const handleCopy = () => {
    const roomCode = code || createRoomCode();
    navigator.clipboard.writeText(`https://stratix.gg/room/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-[#141720] border border-[#292E3A] rounded-xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[#292E3A]">
          <div>
            <div className="text-[10px] font-tactical text-[#FF4655] tracking-widest uppercase mb-0.5">
              {step === 'form' ? 'New War Room' : 'Room Created'}
            </div>
            <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">
              {step === 'form' ? 'Create Room' : 'Share & Invite'}
            </h2>
          </div>
          <button onClick={handleClose} className="text-[#9298A5] hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5">
                Room Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ascent B-Site Execute"
                className="w-full bg-[#0B0D12] border border-[#292E3A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4a5160] focus:outline-none focus:border-[#FF4655] transition-colors font-body"
              />
            </div>

            <div>
              <label className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief strategy overview..."
                rows={2}
                className="w-full bg-[#0B0D12] border border-[#292E3A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4a5160] focus:outline-none focus:border-[#FF4655] transition-colors resize-none font-body"
              />
            </div>

            <div>
              <label className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['private', 'public'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-display font-semibold transition-all ${
                      visibility === v
                        ? 'border-[#FF4655] bg-[#FF4655]/10 text-white'
                        : 'border-[#292E3A] text-[#9298A5] hover:border-[#9298A5]'
                    }`}
                  >
                    {v === 'private' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5">
                Max Players: <span className="text-white">{maxPlayers}</span>
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-[#FF4655]"
              />
              <div className="flex justify-between text-[10px] text-[#4a5160] font-tactical mt-0.5">
                <span>2</span>
                <span>10</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-[#FF4655] hover:bg-[#e03545] disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-bold text-sm py-3 rounded-lg transition-colors mt-2"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-[#0B0D12] border border-[#292E3A] rounded-lg p-4 text-center">
              <div className="text-[10px] font-tactical text-[#9298A5] tracking-widest uppercase mb-2">
                Room Code
              </div>
              <div className="text-3xl font-tactical font-bold text-[#FF4655] tracking-widest">{code}</div>
            </div>

            <div>
              <label className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5">
                Invitation Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0B0D12] border border-[#292E3A] rounded-lg px-3 py-2 text-xs text-[#9298A5] font-tactical truncate">
                  stratix.gg/room/{code}
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg text-xs font-display font-bold transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-[#FF4655]/10 text-[#FF4655] border border-[#FF4655]/30 hover:bg-[#FF4655]/20'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <Link
              href="/dashboard"
              onClick={handleClose}
              className="flex items-center justify-center gap-2 w-full bg-[#FF4655] hover:bg-[#e03545] text-white font-display font-bold text-sm py-3 rounded-lg transition-colors"
            >
              Enter War Room
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function JoinRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleJoin = () => {
    if (code.trim().length < 4) {
      setError('Enter a valid room code or link.');
      return;
    }
    setError('');
    window.location.href = '/dashboard';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#141720] border border-[#292E3A] rounded-xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[#292E3A]">
          <div>
            <div className="text-[10px] font-tactical text-[#A855F7] tracking-widest uppercase mb-0.5">
              Join Session
            </div>
            <h2 className="text-lg font-display font-black text-white uppercase tracking-wider">
              Enter Room
            </h2>
          </div>
          <button onClick={onClose} className="text-[#9298A5] hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-tactical text-[#9298A5] uppercase tracking-widest block mb-1.5">
              Room Code or Link
            </label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="STRAT-XXXXX or paste link"
              className={`w-full bg-[#0B0D12] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4a5160] focus:outline-none transition-colors font-tactical tracking-widest ${
                error ? 'border-[#FF4655]' : 'border-[#292E3A] focus:border-[#A855F7]'
              }`}
            />
            {error && <p className="text-[11px] text-[#FF4655] mt-1 font-tactical">{error}</p>}
          </div>

          <button
            onClick={handleJoin}
            className="w-full bg-[#A855F7] hover:bg-[#9333ea] text-white font-display font-bold text-sm py-3 rounded-lg transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
