import type {
  CenterTextElement,
  EditorState,
  FrameElement,
  ImageElement,
  Stamp,
  StampElement,
  StampShape,
  TextOnPathElement,
} from "../client/src/editor/types";
import {
  ARC_VISUAL_SAFE_OCCUPANCY,
  CANVAS_CENTER,
  CANVAS_SIZE,
  CENTER_TEXT_EDGE_CLEARANCE,
  getCenterTextVisualMetrics,
  getCenterTextLines,
  doesCenterTextFit,
  doesTextOnPathCollideFrame,
  doesTextOnPathFit,
  fitArcText,
  fitArcTextRadiusToStamp,
  fitCenterTextElementFontSize,
  getStampContentBounds,
  getTextOnPathVisualMetrics,
  getStampPlateGeometry,
  getStampSafeBounds,
  getTextPathGeometry,
} from "../client/src/editor/svgUtils";

const DEFAULT_HEIGHT_MM: Record<string, number | undefined> = {
  round: undefined,
  rectangular: 25,
  oval: 30,
  triangular: undefined,
};

const SUPPORTED_SHAPES = new Set<StampShape>(["round", "oval", "rectangular", "triangular"]);
const CENTER_TEXT_LINE_HEIGHT = 1.08;
const CENTER_STACK_GAP_RATIO = 0.35;
const MIN_CENTER_STACK_GAP = 2;
const ARC_CENTER_CLEARANCE = 3;
const ARC_MIN_OUTER_CLEARANCE = 2.2;
const ARC_MIN_INNER_CLEARANCE = 3;
const ARC_MAX_BAND_OCCUPANCY = 0.6;
const ARC_MIN_CENTER_REGION_CLEARANCE = 5.5;
const CENTER_MAX_WIDTH_OCCUPANCY = 0.84;
const CENTER_MAX_HEIGHT_OCCUPANCY = 0.78;
const CENTER_MIN_EDGE_CLEARANCE = CENTER_TEXT_EDGE_CLEARANCE;

export interface TemplateNormalizationOptions {
  repairGeometry?: boolean;
}

export interface TemplateGeometryIssueSummary {
  arcTextOverflow: boolean;
  frameCollision: boolean;
  centerTextOverflow: boolean;
  arcTextTooCloseToFrame: boolean;
  arcTextOccupancyTooHigh: boolean;
  centerTextOccupancyTooHigh: boolean;
  insufficientVisualClearance: boolean;
  multiRingCollisionRisk: boolean;
  missingInvalidGeometry: boolean;
  unsupportedState: boolean;
}

function clampNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (typeof min === "number" && numeric < min) return min;
  if (typeof max === "number" && numeric > max) return max;
  return numeric;
}

function normalizeFrameElement(raw: any): FrameElement {
  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    type: "frame",
    color: String(raw?.color ?? "#1a3a6b"),
    visible: raw?.visible !== false,
    radius: clampNumber(raw?.radius, 90, 10, 100),
    strokeWidth: clampNumber(raw?.strokeWidth, 3, 0.5, 20),
    lineBreak: clampNumber(
      Number.isFinite(raw?.lineBreak) ? raw.lineBreak : raw?.lineBreakGap,
      0,
      0,
      180
    ),
  };
}

function normalizeTextOnPathElement(raw: any): TextOnPathElement {
  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    type: "text-on-path",
    color: String(raw?.color ?? "#1a3a6b"),
    visible: raw?.visible !== false,
    text: String(raw?.text ?? ""),
    font: String(raw?.font ?? "Arial"),
    fontSize: clampNumber(raw?.fontSize, 8, 5, 72),
    bold: raw?.bold !== false,
    italic: !!raw?.italic,
    align: raw?.align === "left" || raw?.align === "right" ? raw.align : "center",
    inverse: !!raw?.inverse,
    radius: clampNumber(raw?.radius, 75, 10, 100),
    letterSpacing: clampNumber(raw?.letterSpacing, 100, 85, 180),
    startAngle: clampNumber(raw?.startAngle, 0, -180, 180),
  };
}

function normalizeCenterTextElement(raw: any): CenterTextElement {
  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    type: "center-text",
    color: String(raw?.color ?? "#1a3a6b"),
    visible: raw?.visible !== false,
    text: String(raw?.text ?? ""),
    font: String(raw?.font ?? "Arial"),
    fontSize: clampNumber(raw?.fontSize, 12, 4, 72),
    bold: raw?.bold !== false,
    italic: !!raw?.italic,
    x: clampNumber(raw?.x, 50, 0, 100),
    y: clampNumber(raw?.y, 50, 0, 100),
  };
}

function normalizeImageElement(raw: any): ImageElement {
  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    type: "image",
    color: String(raw?.color ?? "#1a3a6b"),
    visible: raw?.visible !== false,
    svgContent: String(raw?.svgContent ?? ""),
    scale: clampNumber(raw?.scale, 100, 10, 200),
    x: clampNumber(raw?.x, 50, 0, 100),
    y: clampNumber(raw?.y, 50, 0, 100),
  };
}

function normalizeElement(raw: any): StampElement | null {
  const type = raw?.type === "textOnPath"
    ? "text-on-path"
    : raw?.type === "centerText"
      ? "center-text"
      : raw?.type;

  switch (type) {
    case "frame":
      return normalizeFrameElement(raw);
    case "text-on-path":
      return normalizeTextOnPathElement(raw);
    case "center-text":
      return normalizeCenterTextElement(raw);
    case "image":
      return normalizeImageElement(raw);
    default:
      return null;
  }
}

function wrapCenterText(text: string, lines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (lines <= 1) return [text];

  if (words.length === 1) {
    return [text];
  }

  if (lines > words.length) return [text];

  let best: string[] = [text];
  let bestScore = Number.POSITIVE_INFINITY;

  const placeBreaks = (startIdx: number, remainingLines: number, parts: string[]) => {
    if (remainingLines === 1) {
      const candidate = [...parts, words.slice(startIdx).join(" ")];
      const lengths = candidate.map((part) => part.length);
      const score = Math.max(...lengths) - Math.min(...lengths);
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
      return;
    }

    for (let endIdx = startIdx + 1; endIdx <= words.length - remainingLines + 1; endIdx++) {
      placeBreaks(endIdx, remainingLines - 1, [...parts, words.slice(startIdx, endIdx).join(" ")]);
    }
  };

  placeBreaks(0, lines, []);
  return best;
}

function fitWrappedCenterTextElementGeometry(el: CenterTextElement, stamp: Stamp): CenterTextElement {
  const candidates = [el];

  if (!el.text.includes("\n")) {
    for (const lineCount of [2, 3]) {
      const wrapped = wrapCenterText(el.text, lineCount);
      if (wrapped.length > 1) {
        candidates.push({ ...el, text: wrapped.join("\n") });
      }
    }
  }

  let best = { ...el, fontSize: fitCenterTextElementFontSize(el, stamp, el.fontSize) };
  let bestFits = doesCenterTextFit(best, stamp, best.fontSize);

  for (const candidate of candidates) {
    const fontSize = fitCenterTextElementFontSize(candidate, stamp, candidate.fontSize);
    const fitted = { ...candidate, fontSize };
    const fits = doesCenterTextFit(fitted, stamp, fontSize);
    if (
      (fits && !bestFits) ||
      (fits === bestFits && fontSize > best.fontSize) ||
      (fits === bestFits && fontSize === best.fontSize && getCenterTextLines(fitted.text).length < getCenterTextLines(best.text).length)
    ) {
      best = fitted;
      bestFits = fits;
    }
  }

  return best;
}

function fitTextOnPathElementGeometry(el: TextOnPathElement, stamp: Stamp): TextOnPathElement {
  if (!el.text.trim()) return el;

  const requestedRadiusPct = clampNumber(el.radius, 75, 10, 100);
  let radiusPct = requestedRadiusPct;
  let fitted = { fontSize: el.fontSize, letterSpacing: el.letterSpacing };

  for (let attempt = 0; attempt < 3; attempt++) {
    const targetRadiusPct = fitArcTextRadiusToStamp(fitted.fontSize, stamp).radiusPct;
    radiusPct = clampNumber(targetRadiusPct, requestedRadiusPct, 10, 100);
    const geometry = getTextPathGeometry({ ...el, radius: radiusPct }, stamp);
    fitted = fitArcText(el.text, geometry.pathLength, fitted.fontSize, fitted.letterSpacing);
  }

  radiusPct = fitArcTextRadiusToStamp(fitted.fontSize, stamp).radiusPct;

  return {
    ...el,
    fontSize: fitted.fontSize,
    letterSpacing: fitted.letterSpacing,
    radius: radiusPct,
  };
}

function adjustInnerFrameGeometry(stamp: Stamp): Stamp {
  const geometry = getStampPlateGeometry(stamp);
  const frameEntries = stamp.elements
    .map((element, index) => ({ element, index }))
    .filter(
      (entry): entry is { element: FrameElement; index: number } =>
        entry.element.type === "frame" && entry.element.visible !== false
    )
    .sort((a, b) => b.element.radius - a.element.radius);

  if (frameEntries.length < 2) return stamp;

  const [outerFrame, firstInnerFrame] = frameEntries;
  const arcElements = stamp.elements.filter(
    (element): element is TextOnPathElement =>
      element.type === "text-on-path" && element.visible !== false && element.text.trim().length > 0
  );

  if (arcElements.length === 0) return stamp;

  const targetOuterEdge = arcElements.reduce((minOuterEdge, element) => {
    const metrics = getTextOnPathVisualMetrics(element, stamp, element.fontSize, element.letterSpacing, element.radius);
    return Math.min(
      minOuterEdge,
      metrics.geometry.ry - element.fontSize * 0.16 - ARC_MIN_INNER_CLEARANCE
    );
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(targetOuterEdge)) return stamp;

  const currentInnerRadiusY =
    stamp.shape === "oval" || stamp.shape === "rectangular"
      ? (firstInnerFrame.element.radius / 100) * geometry.maxRy
      : (firstInnerFrame.element.radius / 100) * geometry.maxRx;
  const currentOuterEdge = currentInnerRadiusY + firstInnerFrame.element.strokeWidth / 2;

  if (currentOuterEdge <= targetOuterEdge) return stamp;

  const radiusBase =
    stamp.shape === "oval" || stamp.shape === "rectangular" ? geometry.maxRy : geometry.maxRx;
  const maxRadiusPct = Math.max(outerFrame.element.radius - 4, 10);
  const targetRadiusPct = Math.min(
    maxRadiusPct,
    Math.max(((targetOuterEdge - firstInnerFrame.element.strokeWidth / 2) / radiusBase) * 100, 10)
  );

  const nextElements = [...stamp.elements];
  nextElements[firstInnerFrame.index] = {
    ...firstInnerFrame.element,
    radius: targetRadiusPct,
  };

  return { ...stamp, elements: nextElements };
}

function fitCenterTextElementGeometry(el: CenterTextElement, stamp: Stamp): CenterTextElement {
  if (!el.text.trim()) return el;
  return fitWrappedCenterTextElementGeometry(el, stamp);
}

function getCenterTextBlockHeight(el: CenterTextElement, fontSize: number): number {
  return Math.max(getCenterTextLines(el.text).length, 1) * fontSize * CENTER_TEXT_LINE_HEIGHT;
}

function getReservedCenterBand(stamp: Stamp): { top: number; bottom: number } {
  const contentBounds = getStampContentBounds(stamp);
  let top = CANVAS_CENTER - contentBounds.contentRy + CENTER_MIN_EDGE_CLEARANCE;
  let bottom = CANVAS_CENTER + contentBounds.contentRy - CENTER_MIN_EDGE_CLEARANCE;

  for (const element of stamp.elements) {
    if (element.type !== "text-on-path" || element.visible === false || !element.text.trim()) continue;

    const geometry = getTextPathGeometry(element, stamp);
    const inwardDepth = element.fontSize * 0.75 + ARC_CENTER_CLEARANCE;

    if (element.inverse) {
      bottom = Math.min(bottom, CANVAS_CENTER + geometry.ry - inwardDepth);
    } else {
      top = Math.max(top, CANVAS_CENTER - geometry.ry + inwardDepth);
    }
  }

  if (bottom - top < 12) {
    const center = (top + bottom) / 2;
    return { top: center - 6, bottom: center + 6 };
  }

  return { top, bottom };
}

function positionCenterTextElements(
  elements: CenterTextElement[],
  fontSizes: number[],
  bandTop: number,
  bandBottom: number
): CenterTextElement[] {
  const heights = elements.map((element, idx) => getCenterTextBlockHeight(element, fontSizes[idx]!));
  const availableHeight = Math.max(bandBottom - bandTop, 10);
  const gap = elements.length > 1
    ? Math.max(MIN_CENTER_STACK_GAP, Math.floor(Math.min(...fontSizes) * CENTER_STACK_GAP_RATIO))
    : 0;
  const totalHeight = heights.reduce((sum, height) => sum + height, 0) + gap * Math.max(elements.length - 1, 0);
  let cursor = bandTop + Math.max(availableHeight - totalHeight, 0) / 2;

  return elements.map((element, idx) => {
    const blockHeight = heights[idx]!;
    const y = cursor + blockHeight / 2;
    cursor += blockHeight + gap;
    return {
      ...element,
      fontSize: fontSizes[idx]!,
      y: (y / CANVAS_SIZE) * 100,
    };
  });
}

function layoutCenterTextElementsGeometry(stamp: Stamp): Stamp {
  const centerTextEntries = stamp.elements
    .map((element, index) => ({ element, index }))
    .filter(
      (entry): entry is { element: CenterTextElement; index: number } =>
        entry.element.type === "center-text" &&
        entry.element.visible !== false &&
        entry.element.text.trim().length > 0
    )
    .sort((a, b) => a.element.y - b.element.y);

  if (centerTextEntries.length === 0) return stamp;

  const { top, bottom } = getReservedCenterBand(stamp);
  const availableHeight = Math.max(bottom - top, 10);
  const requested = centerTextEntries.map((entry) => entry.element);
  const requestedFontSizes = requested.map((element) => Math.max(Math.floor(element.fontSize), 3));
  let best = requested;

  for (let scale = 1; scale >= 0.2; scale -= 0.05) {
    const scaledFontSizes = requestedFontSizes.map((fontSize) => Math.max(3, Math.floor(fontSize * scale)));
    const provisionalHeights = requested.map((element, idx) => getCenterTextBlockHeight(element, scaledFontSizes[idx]!));
    const provisionalGap = requested.length > 1
      ? Math.max(MIN_CENTER_STACK_GAP, Math.floor(Math.min(...scaledFontSizes) * CENTER_STACK_GAP_RATIO))
      : 0;
    const provisionalHeight =
      provisionalHeights.reduce((sum, height) => sum + height, 0) +
      provisionalGap * Math.max(requested.length - 1, 0);
    const heightScale = provisionalHeight > availableHeight ? availableHeight / provisionalHeight : 1;
    const candidateFontSizes = scaledFontSizes.map((fontSize) => Math.max(3, Math.floor(fontSize * heightScale)));
    const positioned = positionCenterTextElements(requested, candidateFontSizes, top, bottom);
    const fitted = positioned.map((element, idx) =>
      fitCenterTextElementGeometry({ ...element, fontSize: candidateFontSizes[idx]! }, stamp)
    );
    const finalLayout = positionCenterTextElements(
      fitted,
      fitted.map((element) => element.fontSize),
      top,
      bottom
    );

    best = finalLayout;
    if (finalLayout.every((element) => doesCenterTextFit(element, stamp, element.fontSize))) {
      const nextElements = [...stamp.elements];
      centerTextEntries.forEach((entry, idx) => {
        nextElements[entry.index] = finalLayout[idx]!;
      });
      return { ...stamp, elements: nextElements };
    }
  }

  const fallbackElements = [...stamp.elements];
  centerTextEntries.forEach((entry, idx) => {
    fallbackElements[entry.index] = best[idx]!;
  });
  return { ...stamp, elements: fallbackElements };
}

function normalizeTemplateStampGeometry(stamp: Stamp): Stamp {
  const normalizedElements = stamp.elements.map((element) => {
    switch (element.type) {
      case "text-on-path":
        return fitTextOnPathElementGeometry(element, stamp);
      default:
        return element;
    }
  });

  return layoutCenterTextElementsGeometry(
    adjustInnerFrameGeometry({ ...stamp, elements: normalizedElements })
  );
}

export function normalizeTemplateStamp(
  raw: any,
  options: TemplateNormalizationOptions = {}
): Stamp {
  const widthMm = clampNumber(raw?.widthMm, 38, 10, 150);
  const rawShape = String(raw?.shape ?? "round");
  const shape = SUPPORTED_SHAPES.has(rawShape as StampShape) ? (rawShape as StampShape) : "round";
  const fallbackHeight = DEFAULT_HEIGHT_MM[shape] ?? widthMm;

  const stamp: Stamp = {
    id: String(raw?.id ?? crypto.randomUUID()),
    shape,
    widthMm,
    heightMm: clampNumber(raw?.heightMm, fallbackHeight, 10, 150),
    color: String(raw?.color ?? "#1a3a6b"),
    effects: {
      shabby: !!raw?.effects?.shabby,
      gold: !!raw?.effects?.gold,
      silver: !!raw?.effects?.silver,
    },
    elements: Array.isArray(raw?.elements)
      ? raw.elements
          .map(normalizeElement)
          .filter((element: StampElement | null): element is StampElement => !!element)
      : [],
  };

  return options.repairGeometry === false ? stamp : normalizeTemplateStampGeometry(stamp);
}

export function normalizeTemplateState(
  raw: unknown,
  options: TemplateNormalizationOptions = {}
): EditorState {
  const state = (raw ?? {}) as any;
  const stamps = Array.isArray(state.stamps)
    ? state.stamps.map((stamp: any) => normalizeTemplateStamp(stamp, options))
    : [];

  return {
    stamps,
    activeStampId: state.activeStampId ?? stamps[0]?.id ?? "",
    selectedElementId: state.selectedElementId ?? null,
    locale: state.locale === "de" ? "de" : "en",
  };
}

export function auditTemplateStampGeometry(stamp: Stamp): TemplateGeometryIssueSummary {
  const geometry = getStampPlateGeometry(stamp);
  const issues: TemplateGeometryIssueSummary = {
    arcTextOverflow: false,
    frameCollision: false,
    centerTextOverflow: false,
    arcTextTooCloseToFrame: false,
    arcTextOccupancyTooHigh: false,
    centerTextOccupancyTooHigh: false,
    insufficientVisualClearance: false,
    multiRingCollisionRisk: false,
    missingInvalidGeometry: false,
    unsupportedState: !SUPPORTED_SHAPES.has(stamp.shape),
  };

  if (!Number.isFinite(stamp.widthMm) || !Number.isFinite(stamp.heightMm) || geometry.maxRx <= 0 || geometry.maxRy <= 0) {
    issues.missingInvalidGeometry = true;
  }

  for (const element of stamp.elements) {
    switch (element.type) {
      case "text-on-path":
        if (!Number.isFinite(element.radius) || !Number.isFinite(element.fontSize) || !Number.isFinite(element.letterSpacing)) {
          issues.missingInvalidGeometry = true;
          break;
        }
        const arcMetrics = getTextOnPathVisualMetrics(
          element,
          stamp,
          element.fontSize,
          element.letterSpacing,
          element.radius
        );
        if (doesTextOnPathCollideFrame(stamp, element.radius, element.fontSize)) {
          issues.frameCollision = true;
        }
        if (!doesTextOnPathFit(element, stamp, element.fontSize, element.letterSpacing, element.radius)) {
          issues.arcTextOverflow = true;
        }
        if (arcMetrics.outerClearance < ARC_MIN_OUTER_CLEARANCE) {
          issues.arcTextTooCloseToFrame = true;
        }
        if (arcMetrics.occupancy > ARC_VISUAL_SAFE_OCCUPANCY) {
          issues.arcTextOccupancyTooHigh = true;
        }
        if (
          arcMetrics.innerClearance !== null &&
          (arcMetrics.innerClearance < ARC_MIN_INNER_CLEARANCE - 0.05 ||
            (arcMetrics.bandOccupancy !== null && arcMetrics.bandOccupancy > ARC_MAX_BAND_OCCUPANCY) ||
            (arcMetrics.centerRegionClearance !== null && arcMetrics.centerRegionClearance < ARC_MIN_CENTER_REGION_CLEARANCE))
        ) {
          issues.multiRingCollisionRisk = true;
        }
        break;
      case "center-text":
        if (!Number.isFinite(element.fontSize) || !Number.isFinite(element.x) || !Number.isFinite(element.y)) {
          issues.missingInvalidGeometry = true;
          break;
        }
        const centerMetrics = getCenterTextVisualMetrics(element, stamp, element.fontSize);
        if (!doesCenterTextFit(element, stamp, element.fontSize)) {
          issues.centerTextOverflow = true;
        }
        if (
          centerMetrics.maxWidthOccupancy > CENTER_MAX_WIDTH_OCCUPANCY ||
          centerMetrics.heightOccupancy > CENTER_MAX_HEIGHT_OCCUPANCY
        ) {
          issues.centerTextOccupancyTooHigh = true;
        }
        if (
          stamp.shape !== "rectangular" &&
          (centerMetrics.topClearance < CENTER_MIN_EDGE_CLEARANCE ||
            centerMetrics.bottomClearance < CENTER_MIN_EDGE_CLEARANCE)
        ) {
          issues.insufficientVisualClearance = true;
        }
        break;
      case "frame":
        if (!Number.isFinite(element.radius) || !Number.isFinite(element.strokeWidth)) {
          issues.missingInvalidGeometry = true;
        }
        break;
      default:
        break;
    }
  }

  return issues;
}
