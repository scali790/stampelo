import type { EditorState, Stamp, StampElement, StampShape } from "../client/src/editor/types";

const COLORS = {
  blue: "#1a3a6b",
  green: "#1f6b45",
  red: "#9b2c2c",
  amber: "#8a5a00",
  slate: "#4b5563",
  purple: "#6941c6",
};

function state(stamp: Stamp): EditorState {
  return {
    stamps: [stamp],
    activeStampId: stamp.id,
    selectedElementId: null,
    locale: "en",
  };
}

function stamp(shape: StampShape, widthMm: number, heightMm: number, color: string, elements: StampElement[]): Stamp {
  return {
    id: "s1",
    shape,
    widthMm,
    heightMm,
    color,
    effects: { shabby: false, gold: false, silver: false },
    elements,
  };
}

function frame(id: string, color: string, radius: number, strokeWidth: number): StampElement {
  return { id, type: "frame", color, visible: true, radius, strokeWidth, lineBreak: 0 };
}

function center(id: string, text: string, color: string, fontSize: number, y = 50, bold = true): StampElement {
  return {
    id,
    type: "center-text",
    color,
    visible: true,
    text,
    font: "Arial",
    fontSize,
    bold,
    italic: false,
    x: 50,
    y,
  };
}

function arc(id: string, text: string, color: string, radius: number, fontSize: number, inverse = false): StampElement {
  return {
    id,
    type: "text-on-path",
    color,
    visible: true,
    text,
    font: "Arial",
    fontSize,
    bold: true,
    italic: false,
    align: "center",
    inverse,
    radius,
    letterSpacing: 100,
    startAngle: 0,
  };
}

function roundBadge(top: string, centerText: string, bottom: string, color: string): EditorState {
  return state(stamp("round", 38, 38, color, [
    frame("f1", color, 95, 3.5),
    frame("f2", color, 76, 1.2),
    arc("t1", top, color, 84, 8),
    center("c1", centerText, color, 14),
    arc("t2", bottom, color, 84, 7, true),
  ]));
}

function rectangularStatus(title: string, subtitle: string, color: string, framed = true): EditorState {
  const elements: StampElement[] = [];
  if (framed) {
    elements.push(frame("f1", color, 94, 4));
    elements.push(frame("f2", color, 80, 1));
  } else {
    elements.push(frame("f1", color, 94, 4));
  }
  elements.push(center("c1", title, color, 18, 42));
  elements.push(center("c2", subtitle, color, 9, 64, false));
  return state(stamp("rectangular", 52, 24, color, elements));
}

function ovalSeal(top: string, centerText: string, color: string): EditorState {
  return state(stamp("oval", 46, 30, color, [
    frame("f1", color, 94, 3.5),
    frame("f2", color, 78, 1),
    arc("t1", top, color, 82, 8),
    center("c1", centerText, color, 13),
  ]));
}

function triangularAlert(title: string, subtitle: string, color: string): EditorState {
  return state(stamp("triangular", 42, 42, color, [
    frame("f1", color, 94, 4),
    center("c1", title, color, 14, 48),
    center("c2", subtitle, color, 8, 65, false),
  ]));
}

export const TEMPLATE_CURATION_BATCH_1: Record<string, EditorState> = {
  "status-approved-1": roundBadge("APPROVED", "✓", "AUTHORIZED", COLORS.green),
  "status-rejected-1": rectangularStatus("REJECTED", "NOT APPROVED", COLORS.red),
  "status-verified-1": ovalSeal("VERIFIED", "OFFICIAL", COLORS.blue),
  "status-completed-1": rectangularStatus("COMPLETED", "PROCESS CLOSED", COLORS.green, false),
  "status-pending-1": triangularAlert("PENDING", "REVIEW", COLORS.amber),
  "status-quality-1": roundBadge("QUALITY CHECK", "QC", "PASSED", COLORS.blue),
  "status-under-review": ovalSeal("UNDER REVIEW", "PENDING", COLORS.purple),
  "status-expired-1": rectangularStatus("EXPIRED", "NO LONGER VALID", COLORS.slate),
};

export function getCuratedTemplateState(slug: string | null | undefined, fallback: unknown): EditorState | unknown {
  if (!slug) return fallback;
  return TEMPLATE_CURATION_BATCH_1[slug] ?? fallback;
}
