'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Stage,
  Layer,
  Line,
  Arrow,
  Circle,
  Text,
  Group,
  Transformer,
} from 'react-konva';
import Konva from 'konva';
import {
  CanvasElement,
  CanvasTool,
  DrawElement,
  LineElement,
  ArrowElement,
  FilledCircleElement,
  PingElement,
  TextElement,
} from '../../types/canvas';
import { ValorantMapData } from '../../constants/maps';
import { CanvasToolbar } from './CanvasToolbar';
import { DrawingSettingsPanel } from './DrawingSettingsPanel';
import { CanvasControls } from './CanvasControls';
import { BottomMapSelector } from './BottomMapSelector';
import { RemoteCursor } from './RemoteCursor';
import { getSocket } from '../../lib/socket';

interface TacticalCanvasProps {
  currentMap: ValorantMapData;
  onSelectMap: (map: ValorantMapData) => void;
  onElementsChange?: (elements: CanvasElement[]) => void;
  initialElements?: CanvasElement[];
  roomId?: string;
}

interface RemoteCursorData {
  userName: string;
  color: string;
  x: number;
  y: number;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 1000;

function shouldBroadcastLiveUpdate(lastEmittedAt: { current: number }) {
  const now = Date.now();
  if (now - lastEmittedAt.current <= 35) return false;
  lastEmittedAt.current = now;
  return true;
}

export default function TacticalCanvas({
  currentMap,
  onSelectMap,
  onElementsChange,
  initialElements,
  roomId,
}: TacticalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const lastCursorEmit = useRef<number>(0);
  const lastDrawLiveEmit = useRef<number>(0);
  const lastDragLiveEmit = useRef<number>(0);

  // Viewport dimensions
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Remote teammate cursors & in-progress drawings
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursorData>>({});
  const [remoteActiveElements, setRemoteActiveElements] = useState<Record<string, CanvasElement>>({});

  // Tools & Styling
  const [currentTool, setCurrentTool] = useState<CanvasTool>('draw');
  const [currentColor, setCurrentColor] = useState<string>('#FF4655');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);

  // Canvas elements state + History for Undo/Redo
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyStep, setHistoryStep] = useState<number>(0);

  // Active element currently being drawn
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);

  // Selected element ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Viewport Transform (Pan & Zoom)
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Responsive container sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!initialElements) return;
    setElements(initialElements);
    setHistory([initialElements]);
    setHistoryStep(0);
    setRemoteActiveElements({});
  }, [initialElements]);

  const broadcastElementCommit = (element: CanvasElement) => {
    if (!roomId) return;
    getSocket().emit('element_commit', { roomId, element });
  };

  // Center the map in viewport initially and when map changes
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const initialScale = Math.min(
        (dimensions.width * 0.85) / MAP_WIDTH,
        (dimensions.height * 0.85) / MAP_HEIGHT,
        1.05
      );
      setScale(initialScale);
      setPosition({
        x: (dimensions.width - MAP_WIDTH * initialScale) / 2,
        y: (dimensions.height - MAP_HEIGHT * initialScale) / 2,
      });
    }
  }, [dimensions, currentMap.id]);

  // Listen for remote cursors from other teammates in the room
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const onCursorMove = (data: {
      userId: string;
      userName: string;
      color: string;
      x: number;
      y: number;
    }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [data.userId]: {
          userName: data.userName,
          color: data.color,
          x: data.x,
          y: data.y,
        },
      }));
    };

    const onCursorLeave = (data: { userId: string }) => {
      setRemoteCursors((prev) => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
      // Also clear any in-progress drawing from this user
      setRemoteActiveElements((prev) => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });
    };

    const onDrawingLive = (data: { userId: string; element: CanvasElement | null }) => {
      setRemoteActiveElements((prev) => {
        if (!data.element) {
          const copy = { ...prev };
          delete copy[data.userId];
          return copy;
        }
        return {
          ...prev,
          [data.userId]: data.element,
        };
      });
    };

    const onElementCommit = (data: { userId: string; element: CanvasElement }) => {
      setRemoteActiveElements((prev) => {
        const copy = { ...prev };
        delete copy[data.userId];
        return copy;
      });

      setElements((prev) => {
        const exists = prev.some((e) => e.id === data.element.id);
        if (exists) {
          return prev.map((e) => (e.id === data.element.id ? data.element : e));
        }
        return [...prev, data.element];
      });
    };

    const onElementDelete = (data: { elementId: string }) => {
      setElements((prev) => prev.filter((e) => e.id !== data.elementId));
    };

    const onCanvasClear = () => {
      setElements([]);
      setRemoteActiveElements({});
    };

    const onCanvasSync = (data: { elements: CanvasElement[] }) => {
      setElements(data.elements);
      setRemoteActiveElements({});
    };

    socket.on('cursor_move', onCursorMove);
    socket.on('cursor_leave', onCursorLeave);
    socket.on('drawing_live', onDrawingLive);
    socket.on('element_commit', onElementCommit);
    socket.on('element_delete', onElementDelete);
    socket.on('canvas_clear', onCanvasClear);
    socket.on('canvas_sync', onCanvasSync);

    return () => {
      socket.off('cursor_move', onCursorMove);
      socket.off('cursor_leave', onCursorLeave);
      socket.off('drawing_live', onDrawingLive);
      socket.off('element_commit', onElementCommit);
      socket.off('element_delete', onElementDelete);
      socket.off('canvas_clear', onCanvasClear);
      socket.off('canvas_sync', onCanvasSync);
      if (roomId) {
        socket.emit('cursor_leave', { roomId });
      }
    };
  }, [roomId]);

  // Synchronize transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedId && currentTool === 'select') {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, currentTool, elements]);

  // Commit changes to history
  const commitElements = useCallback(
    (newElements: CanvasElement[]) => {
      setElements(newElements);
      const nextHistory = history.slice(0, historyStep + 1);
      setHistory([...nextHistory, newElements]);
      setHistoryStep(nextHistory.length);
      onElementsChange?.(newElements);
    },
    [history, historyStep, onElementsChange]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const nextElements = history[prevStep];
      setHistoryStep(prevStep);
      setElements(nextElements);
      setSelectedId(null);
      onElementsChange?.(nextElements);
      if (roomId) {
        getSocket().emit('canvas_sync', { roomId, elements: nextElements });
      }
    }
  }, [history, historyStep, onElementsChange, roomId]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      const nextElements = history[nextStep];
      setHistoryStep(nextStep);
      setElements(nextElements);
      setSelectedId(null);
      onElementsChange?.(nextElements);
      if (roomId) {
        getSocket().emit('canvas_sync', { roomId, elements: nextElements });
      }
    }
  }, [history, historyStep, onElementsChange, roomId]);

  const handleClear = useCallback(() => {
    commitElements([]);
    setSelectedId(null);
    if (roomId) {
      const socket = getSocket();
      socket.emit('canvas_clear', { roomId });
    }
  }, [commitElements, roomId]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        setIsSpacePressed(true);
      } else if (e.key === 'v' || e.key === 'V') {
        setCurrentTool('select');
      } else if (e.key === 'd' || e.key === 'D') {
        setCurrentTool('draw');
      } else if (e.key === 'l' || e.key === 'L') {
        setCurrentTool('line');
      } else if (e.key === 'a' || e.key === 'A') {
        setCurrentTool('arrow');
      } else if (e.key === 'c' || e.key === 'C') {
        setCurrentTool('circle');
      } else if (e.key === 'p' || e.key === 'P') {
        setCurrentTool('ping');
      } else if (e.key === 't' || e.key === 'T') {
        setCurrentTool('text');
      } else if (e.key === 'e' || e.key === 'E') {
        setCurrentTool('eraser');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        const targetId = selectedId;
        commitElements(elements.filter((el) => el.id !== targetId));
        setSelectedId(null);
        if (roomId) {
          const socket = getSocket();
          socket.emit('element_delete', { roomId, elementId: targetId });
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, elements, commitElements, handleUndo, handleRedo]);

  // Zooming via mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.35, Math.min(3.5, newScale));

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Convert raw pointer position to transformed coordinate space
  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };
  };

  // Pointer Down (Drawing start or Pan start)
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt as MouseEvent;
    // Pan with spacebar or middle click
    if (isSpacePressed || evt.button === 1) {
      setIsPanning(true);
      setPanStart({ x: evt.clientX - position.x, y: evt.clientY - position.y });
      return;
    }

    const pos = getRelativePointerPosition();
    const clickedTarget = e.target;
    const isStage = clickedTarget === stageRef.current;

    if (currentTool === 'select') {
      if (isStage) {
        setSelectedId(null);
      }
      return;
    }

    if (currentTool === 'eraser') {
      const clickedId = clickedTarget.id() || clickedTarget.getParent()?.id();
      if (clickedId) {
        commitElements(elements.filter((el) => el.id !== clickedId));
        if (selectedId === clickedId) setSelectedId(null);
        if (roomId) {
          getSocket().emit('element_delete', { roomId, elementId: clickedId });
        }
      }
      return;
    }

    const newId = 'elem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    if (currentTool === 'draw') {
      const newDraw: DrawElement = {
        id: newId,
        type: 'draw',
        color: currentColor,
        strokeWidth,
        points: [pos.x, pos.y],
      };
      setActiveElement(newDraw);
    } else if (currentTool === 'line') {
      const newLine: LineElement = {
        id: newId,
        type: 'line',
        color: currentColor,
        strokeWidth,
        points: [pos.x, pos.y, pos.x, pos.y],
      };
      setActiveElement(newLine);
    } else if (currentTool === 'arrow') {
      const newArrow: ArrowElement = {
        id: newId,
        type: 'arrow',
        color: currentColor,
        strokeWidth,
        points: [pos.x, pos.y, pos.x, pos.y],
        pointerLength: Math.max(12, strokeWidth * 2.5),
        pointerWidth: Math.max(10, strokeWidth * 2),
      };
      setActiveElement(newArrow);
    } else if (currentTool === 'circle') {
      const newCircle: FilledCircleElement = {
        id: newId,
        type: 'circle',
        color: currentColor,
        strokeWidth,
        x: pos.x,
        y: pos.y,
        radius: 0,
      };
      setActiveElement(newCircle);
    } else if (currentTool === 'ping') {
      const pingLabel = prompt('Ping Callout (e.g. Spike, Enemy, Smoke):', '') || '';
      const newPing: PingElement = {
        id: newId,
        type: 'ping',
        color: currentColor,
        strokeWidth,
        x: pos.x,
        y: pos.y,
        label: pingLabel.trim(),
      };
      commitElements([...elements, newPing]);
      broadcastElementCommit(newPing);
    } else if (currentTool === 'text') {
      const content = prompt('Enter Tactical Callout Note:', '');
      if (content && content.trim()) {
        const newText: TextElement = {
          id: newId,
          type: 'text',
          color: currentColor,
          strokeWidth,
          x: pos.x,
          y: pos.y,
          text: content.trim(),
          fontSize: 16,
        };
        commitElements([...elements, newText]);
        broadcastElementCommit(newText);
      }
    }
  };

  // Pointer Move (Drawing update or Pan update + Cursor broadcast)
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Broadcast cursor position to room (throttled to ~35ms / ~28fps)
    if (roomId) {
      const now = Date.now();
      if (now - lastCursorEmit.current > 35) {
        lastCursorEmit.current = now;
        const pointerPos = getRelativePointerPosition();
        const socket = getSocket();
        socket.emit('cursor_move', { roomId, x: pointerPos.x, y: pointerPos.y });
      }
    }

    if (isPanning) {
      const evt = e.evt as MouseEvent;
      setPosition({
        x: evt.clientX - panStart.x,
        y: evt.clientY - panStart.y,
      });
      return;
    }

    if (!activeElement) return;
    const pos = getRelativePointerPosition();
    let updatedElement: CanvasElement | null = null;

    if (activeElement.type === 'draw') {
      const draw = activeElement as DrawElement;
      updatedElement = {
        ...draw,
        points: [...draw.points, pos.x, pos.y],
      };
    } else if (activeElement.type === 'line' || activeElement.type === 'arrow') {
      const line = activeElement as LineElement | ArrowElement;
      updatedElement = {
        ...line,
        points: [line.points[0], line.points[1], pos.x, pos.y],
      };
    } else if (activeElement.type === 'circle') {
      const circle = activeElement as FilledCircleElement;
      updatedElement = {
        ...circle,
        radius: Math.hypot(pos.x - circle.x, pos.y - circle.y),
      };
    }

    if (updatedElement) {
      setActiveElement(updatedElement);
      const now = Date.now();
      if (roomId && now - lastDrawLiveEmit.current > 35) {
        lastDrawLiveEmit.current = now;
        getSocket().emit('drawing_live', { roomId, element: updatedElement });
      }
    }
  };

  const handleMouseLeave = () => {
    if (roomId) {
      const socket = getSocket();
      socket.emit('cursor_leave', { roomId });
    }
  };

  // Pointer Up (Drawing commit or Pan end)
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!activeElement) return;
    commitElements([...elements, activeElement]);
    setActiveElement(null);
    broadcastElementCommit(activeElement);
  };

  // Element Drag End
  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position();
    const element = elements.find((el) => el.id === id);
    if (element && (element.type === 'ping' || element.type === 'text')) {
      const updatedElement = { ...element, x, y };
      if (roomId) {
        const socket = getSocket();
        if (shouldBroadcastLiveUpdate(lastCursorEmit)) {
          const pointerPos = getRelativePointerPosition();
          socket.emit('cursor_move', { roomId, x: pointerPos.x, y: pointerPos.y });
        }
        if (shouldBroadcastLiveUpdate(lastDragLiveEmit)) {
          socket.emit('drawing_live', { roomId, element: updatedElement });
        }
      }
    }

    setElements((prev) =>
      prev.map((el) =>
        el.id === id && (el.type === 'ping' || el.type === 'text')
          ? { ...el, x, y }
          : el
      )
    );
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    let updatedElement: CanvasElement | null = null;
    const updated = elements.map((el) => {
      if (el.id !== id) return el;
      if (el.type === 'ping' || el.type === 'text') {
        updatedElement = {
          ...el,
          x: e.target.x(),
          y: e.target.y(),
        };
        return updatedElement;
      }
      return el;
    });
    commitElements(updated);
    if (updatedElement) broadcastElementCommit(updatedElement);
  };

  // Cursor style
  const getCursorClass = () => {
    if (isSpacePressed || isPanning) return 'cursor-grab active:cursor-grabbing';
    switch (currentTool) {
      case 'select':
        return 'cursor-default';
      case 'draw':
      case 'line':
      case 'arrow':
      case 'circle':
      case 'ping':
        return 'cursor-crosshair';
      case 'text':
        return 'cursor-text';
      case 'eraser':
        return 'cursor-cell';
      default:
        return 'cursor-default';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full bg-[#0B0D12] overflow-hidden select-none ${getCursorClass()}`}
    >
      {/* ── Layer 0: GPU Synchronized Map Viewport (DOM Image + Remote Cursors) ── */}
      <div
        className="absolute top-0 left-0 pointer-events-none origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
        }}
      >
        {/* Subtle radial map glow */}
        <div className="absolute inset-0 bg-[#121620] rounded-2xl border border-[#292E3A]/80 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Valorant Top-Down Minimap (Always loads natively with 0 CORS issues) */}
          <img
            src={currentMap.minimapUrl}
            alt={currentMap.displayName}
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,70,85,0.15)] select-none opacity-95"
            draggable={false}
            onError={(e) => {
              // Graceful fallback to splash image if minimap network hiccup
              (e.currentTarget as HTMLImageElement).src = currentMap.splashUrl;
            }}
          />

          {/* Tactical map watermarks */}
          <div className="absolute top-4 left-5 flex items-center gap-2">
            <span className="text-xs font-display font-black text-white tracking-widest uppercase">
              {currentMap.displayName}
            </span>
            <span className="text-[9px] font-tactical px-1.5 py-0.5 rounded bg-[#FF4655]/10 border border-[#FF4655]/30 text-[#FF4655]">
              {currentMap.sites}
            </span>
          </div>
        </div>

        {/* Remote Teammate Cursors */}
        {Object.entries(remoteCursors).map(([userId, cursor]) => (
          <RemoteCursor
            key={userId}
            userName={cursor.userName}
            color={cursor.color}
            x={cursor.x}
            y={cursor.y}
          />
        ))}
      </div>

      {/* ── Layer 1: Tactical Canvas Controls HUD ── */}
      <CanvasControls
        zoom={scale}
        onZoomIn={() => setScale((s) => Math.min(3.5, s * 1.2))}
        onZoomOut={() => setScale((s) => Math.max(0.35, s / 1.2))}
        onResetZoom={() => {
          setScale(1);
          setPosition({
            x: (dimensions.width - MAP_WIDTH) / 2,
            y: (dimensions.height - MAP_HEIGHT) / 2,
          });
        }}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        elementsCount={elements.length}
      />

      {/* ── Layer 2: Left Vertical Tool Strip ── */}
      <CanvasToolbar currentTool={currentTool} onSelectTool={setCurrentTool} />

      {/* ── Layer 3: Drawing Settings Panel (Color & Width) ── */}
      <DrawingSettingsPanel
        currentColor={currentColor}
        onSelectColor={setCurrentColor}
        strokeWidth={strokeWidth}
        onSelectStrokeWidth={setStrokeWidth}
      />

      {/* ── Layer 4: Bottom Map Selector ── */}
      <BottomMapSelector currentMap={currentMap} onSelectMap={onSelectMap} />

      {/* ── Layer 5: Transparent Konva Interactive Drawing Canvas ── */}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {elements.map((el) => {
            if (Object.values(remoteActiveElements).some((activeEl) => activeEl.id === el.id)) {
              return null;
            }

            const isSelected = selectedId === el.id;

            if (el.type === 'draw') {
              const draw = el as DrawElement;
              return (
                <Line
                  key={draw.id}
                  id={draw.id}
                  points={draw.points}
                  stroke={draw.color}
                  strokeWidth={draw.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  opacity={draw.opacity ?? 0.95}
                  onClick={() => {
                    if (currentTool === 'select') setSelectedId(draw.id);
                    if (currentTool === 'eraser') commitElements(elements.filter((item) => item.id !== draw.id));
                  }}
                  shadowColor={isSelected ? '#FFFFFF' : draw.color}
                  shadowBlur={isSelected ? 10 : 3}
                  shadowOpacity={0.8}
                />
              );
            }

            if (el.type === 'line') {
              const line = el as LineElement;
              return (
                <Line
                  key={line.id}
                  id={line.id}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  opacity={line.opacity ?? 0.95}
                  onClick={() => {
                    if (currentTool === 'select') setSelectedId(line.id);
                    if (currentTool === 'eraser') commitElements(elements.filter((item) => item.id !== line.id));
                  }}
                  shadowColor={isSelected ? '#FFFFFF' : line.color}
                  shadowBlur={isSelected ? 10 : 3}
                  shadowOpacity={0.8}
                />
              );
            }

            if (el.type === 'arrow') {
              const arrow = el as ArrowElement;
              return (
                <Arrow
                  key={arrow.id}
                  id={arrow.id}
                  points={arrow.points}
                  stroke={arrow.color}
                  fill={arrow.color}
                  strokeWidth={arrow.strokeWidth}
                  pointerLength={arrow.pointerLength || 14}
                  pointerWidth={arrow.pointerWidth || 12}
                  lineCap="round"
                  lineJoin="round"
                  opacity={arrow.opacity ?? 0.95}
                  onClick={() => {
                    if (currentTool === 'select') setSelectedId(arrow.id);
                    if (currentTool === 'eraser') commitElements(elements.filter((item) => item.id !== arrow.id));
                  }}
                  shadowColor={isSelected ? '#FFFFFF' : arrow.color}
                  shadowBlur={isSelected ? 10 : 3}
                  shadowOpacity={0.8}
                />
              );
            }

            if (el.type === 'circle') {
              const circle = el as FilledCircleElement;
              return (
                <Circle
                  key={circle.id}
                  id={circle.id}
                  x={circle.x}
                  y={circle.y}
                  radius={circle.radius}
                  fill={circle.color}
                  fillOpacity={0.35}
                  stroke={circle.color}
                  strokeWidth={circle.strokeWidth}
                  opacity={circle.opacity ?? 0.95}
                  onClick={() => {
                    if (currentTool === 'select') setSelectedId(circle.id);
                    if (currentTool === 'eraser') {
                      commitElements(elements.filter((item) => item.id !== circle.id));
                    }
                  }}
                  shadowColor={isSelected ? '#FFFFFF' : circle.color}
                  shadowBlur={isSelected ? 10 : 3}
                  shadowOpacity={0.8}
                />
              );
            }

            if (el.type === 'ping') {
              const ping = el as PingElement;
              return (
                <Group
                  key={ping.id}
                  id={ping.id}
                  x={ping.x}
                  y={ping.y}
                  draggable={currentTool === 'select'}
                  onDragMove={(e) => handleDragMove(ping.id, e)}
                  onDragEnd={(e) => handleDragEnd(ping.id, e)}
                  onClick={() => {
                    if (currentTool === 'select') setSelectedId(ping.id);
                    if (currentTool === 'eraser') commitElements(elements.filter((item) => item.id !== ping.id));
                  }}
                >
                  <Circle radius={16} stroke={ping.color} strokeWidth={1.5} opacity={0.4} />
                  <Circle radius={10} stroke={ping.color} strokeWidth={2} opacity={0.8} />
                  <Circle radius={5} fill={ping.color} shadowColor={ping.color} shadowBlur={10} />

                  {ping.label && (
                    <Text
                      text={ping.label}
                      x={14}
                      y={-8}
                      fontSize={11}
                      fontFamily="Space Grotesk, sans-serif"
                      fontStyle="bold"
                      fill="#FFFFFF"
                      shadowColor="#000000"
                      shadowBlur={6}
                    />
                  )}
                </Group>
              );
            }

            if (el.type === 'text') {
              const textEl = el as TextElement;
              return (
                <Group
                  key={textEl.id}
                  id={textEl.id}
                  x={textEl.x}
                  y={textEl.y}
                  draggable={currentTool === 'select'}
                  onDragMove={(e) => handleDragMove(textEl.id, e)}
                  onDragEnd={(e) => handleDragEnd(textEl.id, e)}
                  onClick={() => {
                    if (currentTool === 'select') setSelectedId(textEl.id);
                    if (currentTool === 'eraser') commitElements(elements.filter((item) => item.id !== textEl.id));
                  }}
                >
                  <Text
                    text={textEl.text}
                    fontSize={textEl.fontSize || 16}
                    fontFamily="Space Grotesk, sans-serif"
                    fontStyle="bold"
                    fill={textEl.color}
                    shadowColor="#000000"
                    shadowBlur={8}
                    shadowOpacity={0.9}
                  />
                </Group>
              );
            }

            return null;
          })}

          {Object.entries(remoteActiveElements).map(([userId, el]) => {
            if (el.type === 'draw') {
              return (
                <Line
                  key={userId}
                  points={el.points}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  opacity={el.opacity ?? 0.9}
                />
              );
            }
            if (el.type === 'line') {
              return (
                <Line
                  key={userId}
                  points={el.points}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  opacity={el.opacity ?? 0.9}
                />
              );
            }
            if (el.type === 'arrow') {
              return (
                <Arrow
                  key={userId}
                  points={el.points}
                  stroke={el.color}
                  fill={el.color}
                  strokeWidth={el.strokeWidth}
                  pointerLength={el.pointerLength || 14}
                  pointerWidth={el.pointerWidth || 12}
                  lineCap="round"
                  lineJoin="round"
                  opacity={el.opacity ?? 0.9}
                />
              );
            }
            if (el.type === 'circle') {
              return (
                <Circle
                  key={userId}
                  x={el.x}
                  y={el.y}
                  radius={el.radius}
                  fill={el.color}
                  fillOpacity={0.35}
                  stroke={el.color}
                  strokeWidth={el.strokeWidth}
                  opacity={el.opacity ?? 0.9}
                />
              );
            }
            if (el.type === 'ping') {
              return (
                <Group key={userId} x={el.x} y={el.y}>
                  <Circle radius={16} stroke={el.color} strokeWidth={1.5} opacity={0.4} />
                  <Circle radius={10} stroke={el.color} strokeWidth={2} opacity={0.8} />
                  <Circle radius={5} fill={el.color} shadowColor={el.color} shadowBlur={10} />
                  {el.label && (
                    <Text
                      text={el.label}
                      x={14}
                      y={-8}
                      fontSize={11}
                      fontFamily="Space Grotesk, sans-serif"
                      fontStyle="bold"
                      fill="#FFFFFF"
                      shadowColor="#000000"
                      shadowBlur={6}
                    />
                  )}
                </Group>
              );
            }
            if (el.type === 'text') {
              return (
                <Group key={userId} x={el.x} y={el.y}>
                  <Text
                    text={el.text}
                    fontSize={el.fontSize || 16}
                    fontFamily="Space Grotesk, sans-serif"
                    fontStyle="bold"
                    fill={el.color}
                    shadowColor="#000000"
                    shadowBlur={8}
                    shadowOpacity={0.9}
                  />
                </Group>
              );
            }
            return null;
          })}

          {/* Active drawing preview */}
          {activeElement && (
            <>
              {activeElement.type === 'draw' && (
                <Line
                  points={(activeElement as DrawElement).points}
                  stroke={activeElement.color}
                  strokeWidth={activeElement.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.9}
                />
              )}
              {activeElement.type === 'line' && (
                <Line
                  points={(activeElement as LineElement).points}
                  stroke={activeElement.color}
                  strokeWidth={activeElement.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.9}
                />
              )}
              {activeElement.type === 'arrow' && (
                <Arrow
                  points={(activeElement as ArrowElement).points}
                  stroke={activeElement.color}
                  fill={activeElement.color}
                  strokeWidth={activeElement.strokeWidth}
                  pointerLength={(activeElement as ArrowElement).pointerLength || 14}
                  pointerWidth={(activeElement as ArrowElement).pointerWidth || 12}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.9}
                />
              )}
              {activeElement.type === 'circle' && (
                <Circle
                  x={(activeElement as FilledCircleElement).x}
                  y={(activeElement as FilledCircleElement).y}
                  radius={(activeElement as FilledCircleElement).radius}
                  fill={activeElement.color}
                  fillOpacity={0.35}
                  stroke={activeElement.color}
                  strokeWidth={activeElement.strokeWidth}
                  opacity={0.9}
                />
              )}
            </>
          )}

          {/* Transformer */}
          {currentTool === 'select' && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              keepRatio={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
