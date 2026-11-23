'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface RemoteVoiceUser {
  isMuted: boolean;
  isSpeaking: boolean;
}

interface PeerNegotiationState {
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
  pendingCandidates: RTCIceCandidateInit[];
}

export function useVoiceChat(roomId: string, currentUserId: string) {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeakingLocally, setIsSpeakingLocally] = useState(false);
  const [voiceStatuses, setVoiceStatuses] = useState<Record<string, RemoteVoiceUser>>({});
  const [micError, setMicError] = useState<string | null>(null);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const negotiationStatesRef = useRef<Map<string, PeerNegotiationState>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioPlaybackEnabledRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMutedRef = useRef(isMuted);
  const isDeafenedRef = useRef(isDeafened);

  isMutedRef.current = isMuted;
  isDeafenedRef.current = isDeafened;

  const playRemoteAudio = useCallback((audio: HTMLAudioElement) => {
    if (!audioPlaybackEnabledRef.current) {
      setAudioPlaybackBlocked(true);
      return;
    }

    audio.muted = isDeafenedRef.current;
    void audio.play().then(
      () => setAudioPlaybackBlocked(false),
      (err: unknown) => {
        setAudioPlaybackBlocked(true);
        if (!(err instanceof DOMException && err.name === 'NotAllowedError')) {
          console.error('[WebRTC Audio Play Error]', err);
        }
      }
    );
  }, []);

  const enableRemoteAudio = useCallback(() => {
    audioPlaybackEnabledRef.current = true;
    if (audioElementsRef.current.size === 0) {
      setAudioPlaybackBlocked(false);
      return;
    }
    audioElementsRef.current.forEach(playRemoteAudio);
  }, [playRemoteAudio]);

  // Initialize Web Audio API to detect speaking level (Voice Activity Detection)
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      const checkVolume = () => {
        if (!analyserRef.current || isMutedRef.current) {
          if (wasSpeaking) {
            wasSpeaking = false;
            setIsSpeakingLocally(false);
            const socket = getSocket();
            if (roomId) {
              socket.emit('voice_status', { roomId, isMuted: true, isSpeaking: false });
            }
          }
          animationFrameRef.current = requestAnimationFrame(checkVolume);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Speaking threshold
        const isSpeakingNow = average > 16;

        if (isSpeakingNow !== wasSpeaking) {
          wasSpeaking = isSpeakingNow;
          setIsSpeakingLocally(isSpeakingNow);
          const socket = getSocket();
          if (roomId) {
            socket.emit('voice_status', {
              roomId,
              isMuted: isMutedRef.current,
              isSpeaking: isSpeakingNow,
            });
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('[WebRTC] Voice Activity Detection not supported on this browser', err);
    }
  };

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      // Return existing connection if present
      if (peerConnectionsRef.current.has(targetUserId)) {
        return peerConnectionsRef.current.get(targetUserId)!;
      }

      const socket = getSocket();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const negotiationState: PeerNegotiationState = {
        polite: currentUserId.localeCompare(targetUserId) > 0,
        makingOffer: false,
        ignoreOffer: false,
        isSettingRemoteAnswerPending: false,
        pendingCandidates: [],
      };
      peerConnectionsRef.current.set(targetUserId, pc);
      negotiationStatesRef.current.set(targetUserId, negotiationState);

      // Add local audio tracks to peer connection if mic is enabled
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_signal', {
            to: targetUserId,
            signal: { candidate: event.candidate },
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        if (pc.signalingState !== 'stable') return;

        try {
          negotiationState.makingOffer = true;
          await pc.setLocalDescription();
          socket.emit('webrtc_signal', {
            to: targetUserId,
            signal: { sdp: pc.localDescription },
          });
        } catch (err) {
          console.error('[WebRTC Offer Error]', err);
        } finally {
          negotiationState.makingOffer = false;
        }
      };

      // Handle remote incoming audio track
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        let audio = audioElementsRef.current.get(targetUserId);
        if (!audio) {
          audio = new Audio();
          audioElementsRef.current.set(targetUserId, audio);
        }
        audio.srcObject = remoteStream;
        playRemoteAudio(audio);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(targetUserId);
          negotiationStatesRef.current.delete(targetUserId);
          const audio = audioElementsRef.current.get(targetUserId);
          if (audio) {
            audio.pause();
            audio.srcObject = null;
            audioElementsRef.current.delete(targetUserId);
          }
        }
      };

      return pc;
    },
    [currentUserId, playRemoteAudio]
  );

  // Request microphone permission and activate voice
  const enableMicrophone = async () => {
    enableRemoteAudio();
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setIsMicEnabled(true);
      setIsMuted(false);

      // Attach audio tracks to all existing peer connections
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });

      setupAudioMeter(stream);

      const socket = getSocket();
      socket.emit('voice_status', { roomId, isMuted: false, isSpeaking: false });
    } catch (err: any) {
      console.error('[Microphone Permission Error]', err);
      setMicError(err.message || 'Microphone access denied. Check browser permissions.');
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);

    const socket = getSocket();
    socket.emit('voice_status', { roomId, isMuted: nextMuted, isSpeaking: false });
  };

  // Toggle Deafen
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    audioElementsRef.current.forEach((audio) => {
      audio.muted = nextDeafened;
    });
  };

  // Socket signaling listener setup
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    // 1. When another teammate joins the room, initiate a peer connection to them
    const onUserJoined = (data: { member: { id: string } }) => {
      if (data.member.id === currentUserId) return;
      createPeerConnection(data.member.id);
    };

    // 2. When a teammate leaves, clean up their peer connection
    const onUserLeft = (data: { memberId: string }) => {
      const pc = peerConnectionsRef.current.get(data.memberId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.memberId);
      }
      negotiationStatesRef.current.delete(data.memberId);
      const audio = audioElementsRef.current.get(data.memberId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
        audioElementsRef.current.delete(data.memberId);
      }
      setVoiceStatuses((prev) => {
        const copy = { ...prev };
        delete copy[data.memberId];
        return copy;
      });
    };

    // 3. Handle WebRTC Signaling Offer / Answer / ICE Candidates
    const onSignal = async (data: { from: string; signal: any }) => {
      let pc = peerConnectionsRef.current.get(data.from);
      if (!pc) {
        pc = createPeerConnection(data.from);
      }
      const negotiationState = negotiationStatesRef.current.get(data.from);
      if (!negotiationState) return;

      try {
        if (data.signal.sdp) {
          const description = new RTCSessionDescription(data.signal.sdp);
          const readyForOffer =
            !negotiationState.makingOffer &&
            (pc.signalingState === 'stable' || negotiationState.isSettingRemoteAnswerPending);
          const offerCollision = description.type === 'offer' && !readyForOffer;
          negotiationState.ignoreOffer = !negotiationState.polite && offerCollision;
          if (negotiationState.ignoreOffer) return;

          negotiationState.isSettingRemoteAnswerPending = description.type === 'answer';
          await pc.setRemoteDescription(description);
          negotiationState.isSettingRemoteAnswerPending = false;

          for (const candidate of negotiationState.pendingCandidates.splice(0)) {
            await pc.addIceCandidate(candidate);
          }

          if (description.type === 'offer') {
            await pc.setLocalDescription(await pc.createAnswer());
            socket.emit('webrtc_signal', {
              to: data.from,
              signal: { sdp: pc.localDescription },
            });
          }
        } else if (data.signal.candidate) {
          if (negotiationState.ignoreOffer) return;
          if (!pc.remoteDescription) {
            negotiationState.pendingCandidates.push(data.signal.candidate);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          }
        }
      } catch (err) {
        negotiationState.isSettingRemoteAnswerPending = false;
        console.error('[WebRTC Signal Process Error]', err);
      }
    };

    // 4. Handle remote teammate voice status (speaking/muted)
    const onVoiceStatus = (data: { userId: string; isMuted: boolean; isSpeaking: boolean }) => {
      setVoiceStatuses((prev) => ({
        ...prev,
        [data.userId]: {
          isMuted: data.isMuted,
          isSpeaking: data.isSpeaking,
        },
      }));
    };

    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('webrtc_signal', onSignal);
    socket.on('voice_status', onVoiceStatus);

    return () => {
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('webrtc_signal', onSignal);
      socket.off('voice_status', onVoiceStatus);
    };
  }, [roomId, currentUserId, createPeerConnection]);

  // Teardown everything on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      negotiationStatesRef.current.clear();
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElementsRef.current.clear();
    };
  }, []);

  return {
    isMicEnabled,
    isMuted,
    isDeafened,
    isSpeakingLocally,
    voiceStatuses,
    micError,
    audioPlaybackBlocked,
    enableRemoteAudio,
    enableMicrophone,
    toggleMute,
    toggleDeafen,
  };
}
