'use client';

import { io, Socket } from 'socket.io-client';

export type RoomVisibility = 'public' | 'private';

export interface RoomMember {
  id: string;
  name: string;
  agent?: string;
  role: 'leader' | 'strategist' | 'member';
  color: string;
  joinedAt: number;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  mapId: string;
  visibility: RoomVisibility;
  maxParticipants: number;
  createdAt: number;
  hostId: string;
  members: RoomMember[];
}

export interface ClientToServerEvents {
  create_room: (
    data: {
      name: string;
      description?: string;
      mapId?: string;
      visibility?: RoomVisibility;
      maxParticipants?: number;
      userName: string;
    },
    callback: (response: { success: boolean; room?: Room; error?: string }) => void
  ) => void;

  join_room: (
    data: {
      roomId: string;
      userName: string;
    },
    callback: (response: { success: boolean; room?: Room; error?: string }) => void
  ) => void;

  leave_room: (data: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  room_joined: (room: Room) => void;
  user_joined: (data: { member: RoomMember; membersCount: number }) => void;
  user_left: (data: { memberId: string; memberName: string; membersCount: number }) => void;
  error_message: (message: string) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

let socket: TypedSocket | null = null;

/**
 * Singleton Socket instance provider
 * Prevents multiple concurrent socket connections during Next.js client component re-renders
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(BACKEND_URL, {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
