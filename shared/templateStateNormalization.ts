import type { EditorState, Stamp, StampElement } from "../client/src/editor/types";

const DEFAULT_HEIGHT_MM: Record<string, number | undefined> = {
  round: undefined,
  rectangular: 25,
  oval: 30,
  triangular: undefined,
};

function normalizeElement(raw: any): StampElement {
  const type = raw?.type === "textOnPath"
    ? "text-on-path"
    : raw?.type === "centerText"
      ? "center-text"
      : raw?.type;

  if (type === "frame") {
    return {
      ...raw,
      type,
      lineBreak: Number.isFinite(raw?.lineBreak)
        ? raw.lineBreak
        : Number.isFinite(raw?.lineBreakGap)
          ? raw.lineBreakGap
          : 0,
    } as StampElement;
  }

  return { ...raw, type } as StampElement;
}

export function normalizeTemplateStamp(raw: any): Stamp {
  const widthMm = Number.isFinite(raw?.widthMm) ? raw.widthMm : 38;
  const fallbackHeight = DEFAULT_HEIGHT_MM[raw?.shape] ?? widthMm;

  return {
    ...raw,
    widthMm,
    heightMm: Number.isFinite(raw?.heightMm) ? raw.heightMm : fallbackHeight,
    elements: Array.isArray(raw?.elements) ? raw.elements.map(normalizeElement) : [],
  } as Stamp;
}

export function normalizeTemplateState(raw: unknown): EditorState {
  const state = (raw ?? {}) as any;
  const stamps = Array.isArray(state.stamps)
    ? state.stamps.map(normalizeTemplateStamp)
    : [];

  return {
    stamps,
    activeStampId: state.activeStampId ?? stamps[0]?.id ?? "",
    selectedElementId: state.selectedElementId ?? null,
    locale: state.locale === "de" ? "de" : "en",
  };
}
