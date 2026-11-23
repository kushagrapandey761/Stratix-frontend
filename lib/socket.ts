'use client';

import { io, Socket } from 'socket.io-client';

import { CanvasElement } from '../types/canvas';

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
  mapId?: string;
  visibility: RoomVisibility;
  maxParticipants: number;
  createdAt: number;
  hostId: string;
  members: RoomMember[];
  elements?: CanvasElement[];
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
  select_map: (data: { roomId: string; mapId: string }) => void;
  cursor_move: (data: { roomId: string; x: number; y: number }) => void;
  cursor_leave: (data: { roomId: string }) => void;

  // Real-time collaborative whiteboard events
  drawing_live: (data: { roomId: string; element: CanvasElement | null }) => void;
  element_commit: (data: { roomId: string; element: CanvasElement }) => void;
  element_delete: (data: { roomId: string; elementId: string }) => void;
  canvas_clear: (data: { roomId: string }) => void;
  canvas_sync: (data: { roomId: string; elements: CanvasElement[] }) => void;

  // WebRTC Voice Signaling & Status
  webrtc_signal: (data: { to: string; signal: any }) => void;
  voice_status: (data: { roomId: string; isMuted: boolean; isSpeaking: boolean }) => void;
}

export interface ServerToClientEvents {
  room_joined: (room: Room) => void;
  user_joined: (data: { member: RoomMember; membersCount: number }) => void;
  user_left: (data: { memberId: string; memberName: string; membersCount: number }) => void;
  error_message: (message: string) => void;
  select_map: (data: { mapId: string }) => void;
  host_changed: (data: { newHostId: string }) => void;
  cursor_move: (data: { userId: string; userName: string; color: string; x: number; y: number }) => void;
  cursor_leave: (data: { userId: string }) => void;

  // Real-time collaborative whiteboard events
  drawing_live: (data: { userId: string; element: CanvasElement | null }) => void;
  element_commit: (data: { userId: string; element: CanvasElement }) => void;
  element_delete: (data: { elementId: string }) => void;
  canvas_clear: () => void;
  canvas_sync: (data: { elements: CanvasElement[] }) => void;

  // WebRTC Voice Signaling & Status
  webrtc_signal: (data: { from: string; signal: any }) => void;
  voice_status: (data: { userId: string; isMuted: boolean; isSpeaking: boolean }) => void;
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
