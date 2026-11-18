'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  LogOut,
  MapPin,
  Radio,
  Shield,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getSocket, Room, RoomMember } from '../../../lib/socket';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const rawRoomId = (params?.roomId as string) || '';
  const roomId = rawRoomId.toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();

    // Retrieve username from sessionStorage if user set one during join/create
    const storedName =
      (typeof window !== 'undefined' && sessionStorage.getItem('stratix_callsign')) ||
      'TacticalOperator';

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || '');
      addLog('Secure socket channel established with STRATIX command.');

      // Join the room upon connection
      socket.emit(
        'join_room',
        { roomId, userName: storedName },
        (res) => {
          if (res.success && res.room) {
            setRoom(res.room);
            addLog(`Successfully joined room [${res.room.id}] - ${res.room.name}`);
          } else {
            setError(res.error || 'Failed to connect to tactical room.');
          }
        }
      );
    };

    const onDisconnect = () => {
      setIsConnected(false);
      addLog('Lost connection to tactical command server. Attempting reconnect...');
    };

    const onUserJoined = (data: { member: RoomMember; membersCount: number }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        // Avoid duplicate members if re-sent
        const exists = prev.members.some((m) => m.id === data.member.id);
        if (exists) return prev;
        return {
          ...prev,
          members: [...prev.members, data.member],
        };
      });
      addLog(`[+] ${data.member.name} entered the room.`);
    };

    const onUserLeft = (data: { memberId: string; memberName: string; membersCount: number }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => m.id !== data.memberId),
        };
      });
      addLog(`[-] ${data.memberName} disconnected from the room.`);
    };

    const onErrorMessage = (msg: string) => {
      setError(msg);
      addLog(`[!] Error: ${msg}`);
    };

    function addLog(msg: string) {
      const time = new Date().toLocaleTimeString();
      setActivityLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 20)]);
    }

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('error_message', onErrorMessage);

    // If socket is already connected when this component mounts, run join immediately
    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('error_message', onErrorMessage);
    };
  }, [roomId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    const socket = getSocket();
    socket.emit('leave_room', { roomId });
    router.push('/');
  };

  if (error) {
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
          <p className="text-sm text-[#9298A5] font-body">{error}</p>
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

  return (
    <div className="min-h-screen bg-[#0B0D12] text-[#F5F5F5] flex flex-col font-body">
      {/* Top Tactical Bar */}
      <header className="h-16 border-b border-[#292E3A] bg-[#141720]/80 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#FF4655] flex items-center justify-center text-white font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-white text-base tracking-widest uppercase">
              STRATIX
            </span>
          </Link>

          <div className="h-4 w-px bg-[#292E3A]" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-display font-bold text-white uppercase tracking-wide">
              {room?.name || 'INITIALIZING ROOM...'}
            </span>
            {room?.mapId && (
              <span className="text-[10px] font-tactical px-2 py-0.5 rounded bg-[#FF4655]/10 border border-[#FF4655]/30 text-[#FF4655] uppercase">
                {room.mapId}
              </span>
            )}
          </div>
        </div>

        {/* Center: Real-time Status */}
        <div className="hidden md:flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-tactical border ${
              isConnected
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-[#FF4655]/10 border-[#FF4655]/30 text-[#FF4655]'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isConnected ? 'TACTICAL LINK ACTIVE' : 'CONNECTING...'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191D27] border border-[#292E3A] text-xs font-tactical text-[#9298A5]">
            <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>
              {room?.members.length || 1} / {room?.maxParticipants || 5} OPERATORS
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1.5 rounded-lg border transition-all ${
              copied
                ? 'bg-green-500/20 text-green-400 border-green-500/40'
                : 'bg-[#191D27] text-white border-[#292E3A] hover:border-[#FF4655]'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-tactical">{roomId}</span>
          </button>

          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1.5 rounded-lg bg-[#FF4655]/10 border border-[#FF4655]/30 text-[#FF4655] hover:bg-[#FF4655] hover:text-white transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LEAVE</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Tactical Canvas Placeholder & Protocol Status */}
        <div className="flex-1 flex flex-col p-6 items-center justify-center relative overflow-hidden bg-[#0B0D12]">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'linear-gradient(#FF4655 1px, transparent 1px), linear-gradient(90deg, #FF4655 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="max-w-xl w-full bg-[#141720] border border-[#292E3A] rounded-2xl p-8 relative z-10 space-y-6 shadow-tactical-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FF4655]/10 border border-[#FF4655]/30 flex items-center justify-center mx-auto text-[#FF4655]">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <div className="text-[11px] font-tactical text-[#FF4655] tracking-widest uppercase mb-1">
                MULTIPLAYER SESSION ESTABLISHED
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-wider">
                {room?.name || `Room ${roomId}`}
              </h1>
              {room?.description && (
                <p className="text-sm text-[#9298A5] mt-2 font-body max-w-md mx-auto">
                  {room.description}
                </p>
              )}
            </div>

            {/* Room Details Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#0B0D12] rounded-xl border border-[#292E3A]">
              {room?.mapId && (
                <div>
                  <div className="text-[10px] font-tactical text-[#9298A5] uppercase">Target Map</div>
                  <div className="text-sm font-display font-bold text-white uppercase mt-0.5">
                    {room.mapId}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-tactical text-[#9298A5] uppercase">Visibility</div>
                <div className="text-sm font-display font-bold text-[#00F0FF] uppercase mt-0.5">
                  {room?.visibility || 'Private'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-tactical text-[#9298A5] uppercase">Capacity</div>
                <div className="text-sm font-display font-bold text-[#22C55E] uppercase mt-0.5">
                  {room?.members.length || 1} / {room?.maxParticipants || 5}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#191D27] border border-[#292E3A] rounded-lg text-xs font-tactical text-[#9298A5] flex items-center justify-between">
              <span>Your Socket Client ID:</span>
              <span className="text-white font-bold">{socketId || 'Syncing...'}</span>
            </div>

            <p className="text-xs text-[#9298A5]">
              💡 Teammates can connect right now by opening this URL in another tab or entering code{' '}
              <span className="text-[#FF4655] font-bold font-tactical">{roomId}</span> from the home page.
            </p>
          </div>
        </div>

        {/* Right Sidebar: Active Roster & Live Logs */}
        <div className="w-80 border-l border-[#292E3A] bg-[#141720] flex flex-col z-10">
          {/* Roster Header */}
          <div className="p-4 border-b border-[#292E3A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF4655]" />
              <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                Active Operators ({room?.members.length || 0})
              </span>
            </div>
            <span className="text-[10px] font-tactical text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              LIVE SYNC
            </span>
          </div>

          {/* Member List */}
          <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
            {room?.members.map((member) => {
              const isLeader = member.role === 'leader' || member.id === room.hostId;
              const isYou = member.id === socketId;

              return (
                <div
                  key={member.id}
                  className="p-3 rounded-lg bg-[#191D27] border border-[#292E3A] flex items-center justify-between hover:border-[#3a3f4d] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs text-white shadow-sm"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-display font-bold text-white">
                          {member.name}
                        </span>
                        {isYou && (
                          <span className="text-[9px] font-tactical text-[#00F0FF]">(YOU)</span>
                        )}
                      </div>
                      <div className="text-[10px] font-tactical text-[#9298A5] flex items-center gap-1">
                        {isLeader ? (
                          <span className="text-[#FF4655] flex items-center gap-1 font-bold">
                            <Crown className="w-2.5 h-2.5" /> LEADER
                          </span>
                        ) : (
                          <span>OPERATOR</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                </div>
              );
            })}
          </div>

          {/* Activity / Sync Stream */}
          <div className="border-t border-[#292E3A] p-4 bg-[#0B0D12]">
            <div className="text-[10px] font-tactical text-[#9298A5] uppercase tracking-wider mb-2">
              Tactical Event Log
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto font-tactical text-[11px] text-[#9298A5]">
              {activityLogs.length === 0 ? (
                <div className="text-[10px] text-[#4a5160]">No events recorded yet.</div>
              ) : (
                activityLogs.map((log, i) => (
                  <div key={i} className="leading-tight text-slate-400">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
