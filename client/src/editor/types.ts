// ─── Stamp Shape ─────────────────────────────────────────────────────────────
export type StampShape = "round" | "oval" | "rectangular" | "triangular";

// ─── Element Types ────────────────────────────────────────────────────────────
export type ElementType =
  | "frame"
  | "text-on-path"
  | "center-text"
  | "image";

export interface BaseElement {
  id: string;
  type: ElementType;
  color: string; // hex
  visible: boolean;
}

export interface FrameElement extends BaseElement {
  type: "frame";
  /** 10–100 (percentage of canvas half-size) */
  radius: number;
  /** 0.5–20 (stroke width in canvas units) */
  strokeWidth: number;
  /** 0–180 (gap angle in degrees) */
  lineBreak: number;
}

export interface TextOnPathElement extends BaseElement {
  type: "text-on-path";
  text: string;
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  /** "left" | "center" | "right" */
  align: "left" | "center" | "right";
  /** Invert (flip text inside) */
  inverse: boolean;
  /** 10–100 (percentage of canvas half-size) */
  radius: number;
  /** 50–200 (letter spacing %) */
  letterSpacing: number;
  /** -180 to 180 (start angle in degrees) */
  startAngle: number;
}

export interface CenterTextElement extends BaseElement {
  type: "center-text";
  text: string;
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  /** 0–100 (% of canvas width) */
  x: number;
  /** 0–100 (% of canvas height) */
  y: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  /** Raw SVG string */
  svgContent: string;
  /** 10–200 (% of base size) */
  scale: number;
  /** 0–100 (% of canvas width) */
  x: number;
  /** 0–100 (% of canvas height) */
  y: number;
}

export type StampElement =
  | FrameElement
  | TextOnPathElement
  | CenterTextElement
  | ImageElement;

// ─── Effects ─────────────────────────────────────────────────────────────────
export interface StampEffects {
  shabby: boolean;
  gold: boolean;
  silver: boolean;
}

// ─── Stamp (one stamp in the multi-stamp canvas) ─────────────────────────────
export interface Stamp {
  id: string;
  shape: StampShape;
  /** Width in mm */
  widthMm: number;
  /** Height in mm (used for oval/rectangular) */
  heightMm: number;
  /** Global stamp color */
  color: string;
  effects: StampEffects;
  elements: StampElement[];
}

// ─── Editor State ─────────────────────────────────────────────────────────────
export interface EditorState {
  stamps: Stamp[];
  activeStampId: string;
  selectedElementId: string | null;
  /** Locale: "en" | "de" */
  locale: "en" | "de";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const AVAILABLE_FONTS = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
  "Palatino",
  "Garamond",
  "Bookman",
  "Tahoma",
  "Helvetica",
  "Century Gothic",
  "Lucida Console",
  "Lucida Sans",
  "Arial Black",
  "Franklin Gothic Medium",
  "Gill Sans",
  "Calibri",
  "Cambria",
  "Candara",
  "Constantia",
  "Corbel",
  "Segoe UI",
  "Optima",
  "Futura",
  "Bodoni MT",
  "Copperplate",
  "Didot",
  "Rockwell",
  "Baskerville",
  "Caslon",
  "Trajan",
  "Univers",
  "Frutiger",
  "Myriad Pro",
] as const;

export const FONT_SIZES = [4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72] as const;
