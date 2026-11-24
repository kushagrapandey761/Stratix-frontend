'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Check,
  Copy,
  Crown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { getSocket, Room, RoomMember } from '../../../lib/socket';
import { CallsignPrompt } from '@/components/room/callsign-prompt';
import { RoomError } from '@/components/room/room-error';
import { CanvasWrapper } from '@/components/canvas/CanvasWrapper';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { VoiceControls } from '@/components/room/VoiceControls';
import { BrandLogo } from '@/components/ui/brand-logo';
import { fetchCompetitiveMaps } from '@/lib/valorant-maps';
import type { IValorantMap } from '@/components/landing/supported-maps/IMapsResponse';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [maps, setMaps] = useState<IValorantMap[]>([]);
  const userName = useSyncExternalStore(subscribeToCallsign, getSavedCallsign, () => null);
  const [callsignInput, setCallsignInput] = useState('');
  const [callsignError, setCallsignError] = useState('');

  // Voice Chat Hook (WebRTC Mesh + VAD Audio Meter)
  const voice = useVoiceChat(roomId, socketId);

  // Selected map resolution
  const savedMapId = room?.mapId?.toLowerCase();
  const activeMap =
    maps.find(
      (map) =>
        map.uuid.toLowerCase() === savedMapId ||
        map.displayName.toLowerCase() === savedMapId ||
        map.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') ===
          savedMapId?.replace(/[^a-z0-9]/g, '')
    ) ?? maps[0];

  useEffect(() => {
    let active = true;
    void fetchCompetitiveMaps()
      .then((loadedMaps) => {
        if (active) setMaps(loadedMaps);
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setError(
            fetchError instanceof Error ? fetchError.message : 'Unable to load Valorant maps.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!roomId || !userName) return;

    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || '');
      addLog('Secure socket channel established with STRATIX command.');

      socket.emit('join_room', { roomId, userName }, (res) => {
        if (res.success && res.room) {
          setRoom(res.room);
          addLog(`Successfully joined room [${res.room.id}] - ${res.room.name}`);
        } else {
          setError(res.error || 'Failed to connect to tactical room.');
        }
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
      addLog('Lost connection to tactical command server. Attempting reconnect...');
    };

    const onUserJoined = (data: { member: RoomMember; membersCount: number }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.members.some((m) => m.id === data.member.id);
        if (exists) return prev;
        return {
          ...prev,
          members: [...prev.members, data.member],
        };
      });
      addLog(`[+] ${data.member.name} entered the room.`);
    };

    const onMapSelected = (data: { mapId: string }) => {
      setRoom((prev) => (prev ? { ...prev, mapId: data.mapId } : prev));
      addLog(`[>] Map switched to: ${data.mapId.toUpperCase()}`);
    };

    const onHostChanged = (data: { newHostId: string }) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              hostId: data.newHostId,
              members: prev.members.map((m) => ({
                ...m,
                role: m.id === data.newHostId ? 'leader' : 'member',
              })),
            }
          : prev
      );
      addLog(`[*] Tactical leadership transferred.`);
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

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('user_joined', onUserJoined);
    socket.on('select_map', onMapSelected);
    socket.on('user_left', onUserLeft);
    socket.on('error_message', onErrorMessage);
    socket.on('host_changed', onHostChanged);

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

  const handleSelectMap = (map: IValorantMap) => {
    const socket = getSocket();
    socket.emit('select_map', { roomId, mapId: map.uuid });
    setRoom((prev) => (prev ? { ...prev, mapId: map.uuid } : prev));
    addLog(`[>] Map switched to: ${map.displayName.toUpperCase()}`);
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
    <div className="h-screen w-screen bg-[#0B0D12] text-[#F5F5F5] flex flex-col font-body overflow-hidden">
      {/* Top Tactical Bar */}
      <header className="h-14 border-b border-[#292E3A] bg-[#141720]/90 backdrop-blur-md px-5 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} />
          </Link>

          <div className="h-4 w-px bg-[#292E3A]" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-display font-bold text-white uppercase tracking-wide truncate max-w-[200px] sm:max-w-xs">
              {room?.name || 'INITIALIZING ROOM...'}
            </span>
            <span className="text-[10px] font-tactical px-2 py-0.5 rounded bg-[#FF4655]/10 border border-[#FF4655]/30 text-[#FF4655] uppercase">
              {activeMap?.displayName ?? 'LOADING MAPS...'}
            </span>
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
          {/* Tactical Voice Comms Controls */}
          <VoiceControls
            isMicEnabled={voice.isMicEnabled}
            isMuted={voice.isMuted}
            isDeafened={voice.isDeafened}
            isSpeakingLocally={voice.isSpeakingLocally}
            micError={voice.micError}
            audioPlaybackBlocked={voice.audioPlaybackBlocked}
            onEnableAudio={voice.enableRemoteAudio}
            onEnableMic={voice.enableMicrophone}
            onToggleMute={voice.toggleMute}
            onToggleDeafen={voice.toggleDeafen}
          />

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
            className="flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1.5 rounded-lg bg-[#FF4655]/10 border border-[#FF4655]/30 text-[#FF4655] hover:bg-[#FF4655] hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LEAVE</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive Tactical Canvas Area */}
        <main className="flex-1 relative h-full w-full overflow-hidden bg-[#0B0D12]">
          {activeMap ? (
            <CanvasWrapper
              currentMap={activeMap}
              maps={maps}
              onSelectMap={handleSelectMap}
              initialElements={room?.elements}
              roomId={roomId}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-tactical text-[#9298A5]">
              LOADING MAP DATABASE...
            </div>
          )}
        </main>

        {/* Right Sidebar: Active Roster & Live Logs */}
        <aside
          className={`border-l border-[#292E3A] bg-[#141720] flex flex-col z-20 flex-shrink-0 transition-[width] duration-200 ${
            isSidebarCollapsed ? 'w-12' : 'w-72'
          }`}
        >
          {/* Roster Header */}
          <div
            className={`border-b border-[#292E3A] flex ${
              isSidebarCollapsed
                ? 'flex-col items-center gap-3 p-2'
                : 'items-center justify-between gap-2 p-3.5'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
              aria-label={`${isSidebarCollapsed ? 'Expand' : 'Collapse'} active operators sidebar`}
              title={`${isSidebarCollapsed ? 'Expand' : 'Collapse'} active operators`}
              aria-expanded={!isSidebarCollapsed}
              aria-controls="operator-sidebar-content"
              className={`flex items-center gap-1.5 bg-[#141720]/95 backdrop-blur-md border border-[#292E3A] hover:border-[#FF4655] rounded-full text-[10px] font-tactical text-[#9298A5] hover:text-white transition-all shadow-xl ${
                isSidebarCollapsed ? 'px-1.5 py-1' : 'px-3 py-1'
              }`}
            >
              {isSidebarCollapsed ? (
                <ChevronLeft className="w-3 h-3" />
              ) : (
                <>
                  <Users className="w-3 h-3 text-[#FF4655]" />
                  <span>ACTIVE OPERATORS ({room?.members.length || 0})</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
            </button>

            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-1 text-[#9298A5]" title="Active operators">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-tactical">{room?.members.length || 0}</span>
              </div>
            ) : (
              <span className="text-[10px] font-tactical text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                LIVE SYNC
              </span>
            )}
          </div>

          <div
            id="operator-sidebar-content"
            className="flex min-h-0 flex-1 flex-col"
            hidden={isSidebarCollapsed}
          >
              {/* Member List */}
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
            {room?.members.map((member) => {
              const isLeader = member.role === 'leader' || member.id === room.hostId;
              const isYou = member.id === socketId;
              const isSpeaking = isYou ? voice.isSpeakingLocally : voice.voiceStatuses[member.id]?.isSpeaking;
              const isMuted = isYou ? voice.isMuted : voice.voiceStatuses[member.id]?.isMuted;

              return (
                <div
                  key={member.id}
                  className={`p-2.5 rounded-lg bg-[#191D27] border transition-all flex items-center justify-between ${
                    isSpeaking
                      ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                      : 'border-[#292E3A] hover:border-[#3a3f4d]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-xs text-white shadow-sm flex-shrink-0 relative transition-transform ${
                        isSpeaking ? 'ring-2 ring-green-400 scale-105' : ''
                      }`}
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-display font-bold text-white truncate max-w-[120px]">
                          {member.name}
                        </span>
                        {isYou && (
                          <span className="text-[9px] font-tactical text-[#00F0FF]">(YOU)</span>
                        )}
                        {/* Voice Status Indicator */}
                        {isSpeaking ? (
                          <span className="text-green-400 animate-pulse" title="Speaking">
                            <Volume2 className="w-3 h-3" />
                          </span>
                        ) : isMuted ? (
                          <span className="text-[#9298A5]" title="Muted">
                            <MicOff className="w-2.5 h-2.5" />
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[9px] font-tactical text-[#9298A5] flex items-center gap-1">
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
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  />
                </div>
              );
            })}
              </div>

              {/* Tactical Legend Box */}
              <div className="p-3 border-t border-[#292E3A] bg-[#10141D] text-[10px] font-tactical space-y-1">
            <div className="text-[#9298A5] uppercase tracking-wider mb-1 font-bold">
              Color Protocol
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#FF4655]" />
              <span>Red: Enemy / Execute</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span>Green: Push / Rotates</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span>Blue: Utility & Smokes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
              <span>Yellow: Hazard & Flash</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
              <span>Purple: Fake & Alternate</span>
            </div>
              </div>

              {/* Activity / Sync Stream */}
              <div className="border-t border-[#292E3A] p-3 bg-[#0B0D12]">
            <div className="text-[10px] font-tactical text-[#9298A5] uppercase tracking-wider mb-1.5">
              Tactical Event Log
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto font-tactical text-[10px] text-[#9298A5]">
              {activityLogs.length === 0 ? (
                <div className="text-[#4a5160]">No events recorded yet.</div>
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
        </aside>
      </div>
    </div>
  );
}
