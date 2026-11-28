'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Globe2,
  Map,
  Radio,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { BrandLogo } from '../../components/ui/brand-logo';
import type { IValorantMap } from '../../components/landing/supported-maps/IMapsResponse';
import { getSocket, type PublicRoomSummary, type TypedSocket } from '../../lib/socket';
import { fetchCompetitiveMaps } from '../../lib/valorant-maps';

function getMapDisplayName(
  mapId: string | undefined,
  maps: IValorantMap[],
  isLoading: boolean
): string {
  if (!mapId) return 'Map not selected';

  const normalizedId = mapId.trim().toLowerCase();
  const selectedMap = maps.find(
    (map) =>
      map.uuid.toLowerCase() === normalizedId ||
      map.displayName.toLowerCase() === normalizedId ||
      map.displayName.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        normalizedId.replace(/[^a-z0-9]/g, '')
  );
  if (selectedMap) return selectedMap.displayName;
  if (isLoading) return 'Loading map...';

  const isUuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(mapId);
  return isUuid ? 'Unknown map' : mapId.replace(/[-_]/g, ' ');
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);
  const [maps, setMaps] = useState<IValorantMap[]>([]);
  const [isLoadingMaps, setIsLoadingMaps] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);

  const applyRooms = useCallback((nextRooms: PublicRoomSummary[]) => {
    console.log(nextRooms);
    setRooms(nextRooms);
    setError(null);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    let active = true;
    void fetchCompetitiveMaps()
      .then((loadedMaps) => {
        if (active) setMaps(loadedMaps);
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setMapError(
            fetchError instanceof Error ? fetchError.message : 'Unable to load Valorant maps.'
          );
        }
      })
      .finally(() => {
        if (active) setIsLoadingMaps(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let socket: TypedSocket | null = null;
    let onRoomsUpdated: ((updatedRooms: PublicRoomSummary[]) => void) | undefined;
    let onConnect: (() => void) | undefined;
    let onConnectError: ((connectionError: Error) => void) | undefined;
    let onDisconnect: (() => void) | undefined;

    void Promise.resolve()
      .then(() => {
        if (!active) return;

        socket = getSocket();
        socketRef.current = socket;

        const requestRooms = () => {
          socket?.emit('get_public_rooms', (response) => {
            if (active) applyRooms(response.rooms);
          });
        };
        onRoomsUpdated = (updatedRooms) => {
          if (active) applyRooms(updatedRooms);
        };
        onConnect = requestRooms;
        onConnectError = (connectionError) => {
          if (!active) return;
          setError(connectionError.message || 'Unable to connect to the live room directory.');
          setIsLoading(false);
          setIsRefreshing(false);
        };
        onDisconnect = () => {
          if (!active) return;
          setError('Live directory connection lost. Reconnecting...');
          setIsRefreshing(false);
        };

        socket.on('public_rooms_updated', onRoomsUpdated);
        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);
        socket.on('disconnect', onDisconnect);
        if (socket.connected) requestRooms();
      })
      .catch((connectionError: unknown) => {
        if (!active) return;
        setError(
          connectionError instanceof Error
            ? connectionError.message
            : 'Unable to connect to the live room directory.'
        );
        setIsLoading(false);
      });

    return () => {
      active = false;
      if (socket) {
        if (onRoomsUpdated) socket.off('public_rooms_updated', onRoomsUpdated);
        if (onConnect) socket.off('connect', onConnect);
        if (onConnectError) socket.off('connect_error', onConnectError);
        if (onDisconnect) socket.off('disconnect', onDisconnect);
      }
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [applyRooms]);

  const refreshRooms = () => {
    const socket = socketRef.current;
    if (!socket) {
      setError('The live room directory is not connected yet.');
      return;
    }

    setIsRefreshing(true);
    if (socket.connected) {
      socket.emit('get_public_rooms', (response) => applyRooms(response.rooms));
    } else {
      socket.connect();
    }
  };

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rooms;

    return rooms.filter((room) =>
      [
        room.name,
        room.id,
        room.description,
        room.mapId,
        getMapDisplayName(room.mapId, maps, isLoadingMaps),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [rooms, search, maps, isLoadingMaps]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0D12]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#FF4655 1px, transparent 1px), linear-gradient(90deg, #FF4655 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#FF4655]/[0.06] blur-[120px]" />

      <header className="relative z-10 border-b border-[#292E3A] bg-[#0B0D12]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="STRATIX home" className="flex items-center">
            <BrandLogo showTag />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-display font-semibold text-[#9298A5] transition-colors hover:text-white sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <section className="mb-9 flex flex-col justify-between gap-6 border-b border-[#292E3A] pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-tactical uppercase tracking-[0.22em] text-[#00F0FF]">
              <Radio className="h-3.5 w-3.5" />
              Live room directory
            </div>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
              Public <span className="text-[#FF4655]">War Rooms</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#9298A5]">
              Find an open strategy session and join the team. Private rooms are never shown here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex min-w-32 items-center gap-2 rounded-lg border border-[#292E3A] bg-[#141720] px-3 py-2.5">
              <Globe2 className="h-4 w-4 text-[#00F0FF]" />
              <span className="font-tactical text-xs text-white">
                {rooms.length} {rooms.length === 1 ? 'ROOM' : 'ROOMS'}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshRooms}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#292E3A] bg-[#141720] px-3 py-2.5 text-xs font-display font-semibold text-[#9298A5] transition-colors hover:border-[#9298A5] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </section>

        <section aria-label="Public rooms">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
                Open sessions
              </h2>
              <p className="mt-1 text-xs text-[#687080]">
                Updates live as operators join and rooms change
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687080]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rooms, maps, or codes"
                aria-label="Search public rooms"
                className="w-full rounded-lg border border-[#292E3A] bg-[#141720] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#687080] focus:border-[#00F0FF]/60"
              />
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-[#FF4655]/30 bg-[#FF4655]/[0.07] p-4"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4655]" />
              <div>
                <p className="text-sm font-semibold text-white">Unable to update the directory</p>
                <p className="mt-1 text-xs text-[#9298A5]">{error}</p>
              </div>
            </div>
          )}
          {mapError && (
            <p role="status" className="mb-5 text-xs text-[#9298A5]">
              Map names could not be loaded: {mapError}
            </p>
          )}

          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-xl border border-[#292E3A] bg-[#141720]/70">
              <div className="flex items-center gap-3 text-sm text-[#9298A5]">
                <RefreshCw className="h-4 w-4 animate-spin text-[#FF4655]" />
                Scanning for public rooms...
              </div>
            </div>
          ) : filteredRooms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => {
                const isFull = room.memberCount >= room.maxParticipants;
                const mapName = getMapDisplayName(room.mapId, maps, isLoadingMaps);

                return (
                  <article
                    key={room.id}
                    className="group relative flex min-h-60 flex-col overflow-hidden rounded-xl border border-[#292E3A] bg-[#141720]/90 p-5 transition-all hover:-translate-y-0.5 hover:border-[#FF4655]/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
                  >
                    <div className="absolute left-0 top-0 h-px w-1/3 bg-gradient-to-r from-[#FF4655] to-transparent opacity-70" />
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded border border-[#00F0FF]/20 bg-[#00F0FF]/[0.07] px-2 py-1 font-tactical text-[9px] uppercase tracking-widest text-[#00F0FF]">
                            Public
                          </span>
                          <span className="truncate font-tactical text-[10px] tracking-wider text-[#687080]">
                            {room.id}
                          </span>
                        </div>
                        <h3 className="truncate font-display text-lg font-bold text-white">
                          {room.name}
                        </h3>
                      </div>
                      <Globe2 className="mt-1 h-4 w-4 shrink-0 text-[#00F0FF]/70" />
                    </div>

                    <p className="mb-5 line-clamp-2 min-h-10 text-sm leading-5 text-[#9298A5]">
                      {room.description || 'No briefing added. Join to review the team strategy.'}
                    </p>

                    <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#292E3A] pt-4">
                      <div className="inline-flex items-center gap-2 text-xs text-[#9298A5]">
                        <Users className="h-3.5 w-3.5 text-[#A855F7]" />
                        <span className="font-tactical">
                          {room.memberCount}/{room.maxParticipants}
                        </span>
                        <span>operators</span>
                      </div>
                      <div className="inline-flex min-w-0 items-center gap-2 text-xs text-[#9298A5]">
                        <Map className="h-3.5 w-3.5 shrink-0 text-[#FF4655]" />
                        <span className="truncate capitalize">{mapName}</span>
                      </div>
                    </div>

                    {isFull ? (
                      <button
                        type="button"
                        disabled
                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-[#292E3A] py-2.5 text-xs font-display font-bold uppercase tracking-wider text-[#687080]"
                      >
                        Room full
                      </button>
                    ) : (
                      <Link
                        href={`/room/${encodeURIComponent(room.id)}`}
                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF4655] py-2.5 text-xs font-display font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e03545]"
                      >
                        Join room
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#292E3A] bg-[#141720]/50 px-5 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#292E3A] bg-[#191D27]">
                <Search className="h-5 w-5 text-[#687080]" />
              </div>
              <h3 className="font-display text-base font-bold text-white">
                {search ? 'No matching rooms' : 'No public rooms yet'}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#9298A5]">
                {search
                  ? 'Try another room name, map, or room code.'
                  : 'When someone opens a public room, it will appear here. Check back soon.'}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-4 text-xs font-display font-semibold text-[#00F0FF] hover:text-white"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
