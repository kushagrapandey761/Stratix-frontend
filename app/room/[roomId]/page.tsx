'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Check,
  Copy,
  Crown,
  LogOut,
  MapPin,
  Shield,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { getSocket, Room, RoomMember } from '../../../lib/socket';
import { IValorantMap } from '@/components/landing/supported-maps/IMapsResponse';
import { fetchValorantMaps } from '@/lib/valorant-maps';
import { CallsignPrompt } from '@/components/room/callsign-prompt';
import { RoomError } from '@/components/room/room-error';
import Image from 'next/image';

const CALLSIGN_UPDATED_EVENT = 'stratix_callsign_updated';

function subscribeToCallsign(callback: () => void) {
  window.addEventListener(CALLSIGN_UPDATED_EVENT, callback);
  return () => window.removeEventListener(CALLSIGN_UPDATED_EVENT, callback);
}

function getSavedCallsign() {
  const savedName = sessionStorage.getItem('stratix_callsign')?.trim() || '';
  return savedName.toLowerCase() === 'tacticaloperator' ? '' : savedName;
}

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
  const [mapData, setMapData] = useState<IValorantMap[]>([]);
  const userName = useSyncExternalStore(subscribeToCallsign, getSavedCallsign, () => null);
  const [callsignInput, setCallsignInput] = useState('');
  const [callsignError, setCallsignError] = useState('');

  useEffect(() => {
    async function loadMaps() {
      try {
        const mapData = await fetchValorantMaps();
        setMapData(mapData);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load Valorant maps');
      }
    }
    loadMaps();
  },[])

  useEffect(() => {
    if (!roomId || !userName) return;

    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || '');
      addLog('Secure socket channel established with STRATIX command.');

      // Join the room upon connection
      socket.emit(
        'join_room',
        { roomId, userName },
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

    const onMapSelected = (data: { mapId: string }) => {
      setRoom((prev) => (prev ? { ...prev, mapId: data.mapId } : prev));
      addLog(`[>] Map selected: ${data.mapId}`);
    }

    const onErrorMessage = (msg: string) => {
      setError(msg);
      addLog(`[!] Error: ${msg}`);
    };

    function addLog(msg: string) {
      const time = new Date().toLocaleTimeString();
      setActivityLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 20)]);
    }

    function onHostChanged(data: { newHostId: string }) {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hostId: data.newHostId,
        };
      });
      addLog(`[>] Host changed to: ${room?.members.find((m) => m.id === data.newHostId)?.name || 'Unknown'}`);
    }

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('user_joined', onUserJoined);
    socket.on('select_map', onMapSelected);
    socket.on('user_left', onUserLeft);
    socket.on('error_message', onErrorMessage);
    socket.on('host_changed', onHostChanged);

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
      socket.off('select_map', onMapSelected);
      socket.off('user_left', onUserLeft);
      socket.off('error_message', onErrorMessage);
      socket.off('host_changed', onHostChanged);
    };
  }, [roomId, userName]);

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

  const handleSelectMap = (mapId: string) => {
    const socket = getSocket();
    socket.emit('select_map', { roomId, mapId });
    setRoom((prev) => (prev ? { ...prev, mapId } : prev));
    addLog(`[>] Map selected: ${mapId}`);
  };

  const handleCallsignSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const callsign = callsignInput.trim();
    if (!callsign) {
      setCallsignError('Enter a callsign before joining the room.');
      return;
    }

    sessionStorage.setItem('stratix_callsign', callsign);
    window.dispatchEvent(new Event(CALLSIGN_UPDATED_EVENT));
    setCallsignError('');
  };

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 20)]);
  }

  if (error) {
    return <RoomError message={error} />;
  }

  if (userName === null) {
    return (
      <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center p-4 text-sm font-tactical text-[#9298A5]">
        VERIFYING CALLSIGN...
      </div>
    );
  }

  if (!userName) {
    return (
      <CallsignPrompt
        callsign={callsignInput}
        error={callsignError}
        onCallsignChange={(callsign) => {
          setCallsignInput(callsign);
          setCallsignError('');
        }}
        onSubmit={handleCallsignSubmit}
      />
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
          {/* List of maps so that only leader can select */}
          {room?.hostId === socketId && (
            <div className="absolute top-6 left-6 bg-[#141720]/80 backdrop-blur-md border border-[#292E3A] rounded-lg p-4 w-64 z-10">
              <div className="text-[10px] font-tactical text-[#FF4655] tracking-widest uppercase mb-2">
                Map Selection
              </div>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture','Lotus','Sunset','Pearl','Abyss','Corrode'].map((mapName) => (
                  <button
                    key={mapName}
                    className={`w-full text-left px-3 py-1.5 rounded-lg border text-sm font-display font-bold transition-all ${
                      room?.mapId?.toLowerCase() === mapName.toLowerCase()
                        ? 'bg-[#FF4655]/20 border-[#FF4655]/40 text-[#FF4655]'
                        : 'bg-[#191D27] border-[#292E3A] text-white hover:border-[#FF4655]'
                    }`}
                    onClick={() => handleSelectMap(mapName.toLowerCase())}
                  >
                    {mapName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {room?.mapId && (
            <div>
              <Image width={1000} height={1000} src={mapData.find((m) => m.displayName.toLowerCase() === room.mapId)?.displayIcon || ''} alt={room.mapId} />
            </div>
          )}
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
