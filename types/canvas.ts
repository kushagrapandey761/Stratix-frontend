export type CanvasTool = 'select' | 'draw' | 'line' | 'arrow' | 'circle' | 'ping' | 'text' | 'eraser';

export type TacticalColor =
  | '#FF4655' // Red - Enemy positions / execute
  | '#22C55E' // Green - Player push lines / rotates
  | '#3B82F6' // Blue - Utility (Smokes, Walls, Darts)
  | '#EAB308' // Yellow - Warning / Attention / Flash
  | '#A855F7' // Purple - Alternate strat / Fakes
  | '#00F0FF' // Cyan - Default / Objective
  | '#FFFFFF'; // White - Neutral

export interface BaseElement {
  id: string;
  type: 'draw' | 'line' | 'arrow' | 'circle' | 'ping' | 'text';
  color: string;
  strokeWidth: number;
  opacity?: number;
}

export interface DrawElement extends BaseElement {
  type: 'draw';
  points: number[]; // [x1, y1, x2, y2, ...]
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  pointerLength?: number;
  pointerWidth?: number;
}

export interface FilledCircleElement extends BaseElement {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface PingElement extends BaseElement {
  type: 'ping';
  x: number;
  y: number;
  label?: string;
  pingType?: 'danger' | 'move' | 'utility' | 'warning' | 'info';
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type CanvasElement =
  | DrawElement
  | LineElement
  | ArrowElement
  | FilledCircleElement
  | PingElement
  | TextElement;

export interface ViewportTransform {
  scale: number;
  x: number;
  y: number;
}
