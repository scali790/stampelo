import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CenterTextElement,
  EditorState,
  FrameElement,
  ImageElement,
  Stamp,
  StampElement,
  StampShape,
  TextOnPathElement,
} from "./types";
import { getStampSafeGeometry, fitCenterTextFontSize, fitArcTextRadius } from "./svgUtils";

const STARTER_TOP_TEXT = "STAMPELO.COM";
const STARTER_CENTER_TEXT = "YOUR STAMP";
const STARTER_BOTTOM_TEXT = "CREATE IN SECONDS";

// ─── Canonical Default Starter Stamp ─────────────────────────────────────────
//
// This factory produces the canonical first-load starter stamp shown to every
// new user when they open the editor for the first time.
//
// Design principles:
//   • Professional, clean, trustworthy — no debug/test artefacts
//   • All text within the safe area (no clipping, no frame collision)
//   • Balanced typography: top arc + center text + bottom arc (inverse)
//   • Effects off by default (no shabby, no metallic)
//   • Geometry computed via getStampSafeGeometry / fitArcTextRadius /
//     fitCenterTextFontSize so values are always consistent with the renderer
//
// Canonical content (38 mm round):
//   Top arc    : "STAMPELO.COM"   — brand / demo context
//   Center text: "YOUR STAMP"     — clear call-to-action placeholder
//   Bottom arc : "CREATE IN SECONDS" (inverse) — product promise
//
// See docs/STAMP_EDITOR.md §"Canonical Default Starter Stamp" for rationale.

export function createDefaultStamp(shape: StampShape = "round"): Stamp {
  const frameId = nanoid();
  const topArcId = nanoid();
  const centerTextId = nanoid();
  const bottomArcId = nanoid();

  const widthMm = shape === "rectangular" ? 55 : 38;
  const heightMm = shape === "rectangular" ? 25 : 38;
  const geometry = getStampSafeGeometry(widthMm);

  const topArcFontSize = 6;
  const bottomArcFontSize = 4;
  const { radiusPct: arcRadiusPct } = fitArcTextRadius(
    topArcFontSize,
    geometry.safeInnerR,
    geometry.maxR
  );

  const centerTextContent = STARTER_CENTER_TEXT;
  const centerFontSize = fitCenterTextFontSize(centerTextContent, geometry.safeInnerR, 7);

  const frame: FrameElement = {
    id: frameId,
    type: "frame",
    color: "#1a3a6b",
    visible: true,
    radius: 95,
    strokeWidth: 3,
    lineBreak: 0,
  };

  // Top arc: brand / demo context — reads left-to-right along the top
  const topArc: TextOnPathElement = {
    id: topArcId,
    type: "text-on-path",
    color: "#1a3a6b",
    visible: true,
    text: STARTER_TOP_TEXT,
    font: "Arial",
    fontSize: topArcFontSize,
    bold: true,
    italic: false,
    align: "center",
    inverse: false,
    radius: arcRadiusPct,
    letterSpacing: 100,
    startAngle: 0,
  };

  // Center text: clear placeholder that invites the user to personalise
  const centerText: CenterTextElement = {
    id: centerTextId,
    type: "center-text",
    color: "#1a3a6b",
    visible: true,
    text: centerTextContent,
    font: "Arial",
    fontSize: centerFontSize,
    bold: true,
    italic: false,
    x: 50,
    y: 50,
  };

  // Bottom arc: product promise — inverse so it reads along the bottom
  const bottomArc: TextOnPathElement = {
    id: bottomArcId,
    type: "text-on-path",
    color: "#1a3a6b",
    visible: true,
    text: STARTER_BOTTOM_TEXT,
    font: "Arial",
    fontSize: bottomArcFontSize,
    bold: true,
    italic: false,
    align: "center",
    inverse: true,
    radius: arcRadiusPct,
    letterSpacing: 100,
    startAngle: 0,
  };

  return {
    id: nanoid(),
    shape,
    widthMm,
    heightMm,
    color: "#1a3a6b",
    effects: { shabby: false, gold: false, silver: false },
    elements: [frame, topArc, centerText, bottomArc],
  };
}

// ─── Store interface ──────────────────────────────────────────────────────────
interface EditorStore extends EditorState {
  // Stamp management
  addStamp: (shape?: StampShape) => void;
  removeStamp: (stampId: string) => void;
  setActiveStamp: (stampId: string) => void;
  updateStamp: (stampId: string, updates: Partial<Stamp>) => void;

  // Element management
  addElement: (stampId: string, element: StampElement) => void;
  removeElement: (stampId: string, elementId: string) => void;
  updateElement: (stampId: string, elementId: string, updates: Partial<StampElement>) => void;
  duplicateElement: (stampId: string, elementId: string) => void;
  moveElementUp: (stampId: string, elementId: string) => void;
  moveElementDown: (stampId: string, elementId: string) => void;
  setSelectedElement: (elementId: string | null) => void;

  // Load full state (from template or share link)
  loadState: (state: EditorState) => void;
  resetEditor: () => void;

  // Locale
  setLocale: (locale: "en" | "de") => void;

  // Computed helpers
  getActiveStamp: () => Stamp | undefined;
  getSelectedElement: () => StampElement | undefined;
}

// ─── First-load vs. returning-user logic ─────────────────────────────────────
//
// The store uses Zustand `persist` to save the editor state in localStorage
// under the key "stampelo-editor". On first visit the key does not exist, so
// Zustand initialises from `initialState` which contains the canonical starter
// stamp. On subsequent visits the persisted stamps are rehydrated, preserving
// any work the user has already done.
//
// This means:
//   • New users  → see the canonical starter stamp (clean, professional)
//   • Returning users → see their last saved stamps (no data loss)
//
// The `resetEditor` action always resets to a fresh canonical starter stamp,
// regardless of persisted state (used by "New stamp" / clear actions).

const initialStamp = createDefaultStamp("round");

const initialState: EditorState = {
  stamps: [initialStamp],
  activeStampId: initialStamp.id,
  selectedElementId: null,
  locale: "en",
};

function looksLikeHistoricalStarterStamp(stamp: any): boolean {
  if (!stamp || stamp.shape !== "round" || stamp.widthMm !== 38) return false;
  if (!Array.isArray(stamp.elements) || stamp.elements.length < 3 || stamp.elements.length > 4) return false;

  const frame = stamp.elements.find((el: any) => el?.type === "frame");
  const centerText = stamp.elements.find((el: any) => el?.type === "center-text" || el?.type === "centerText");
  const arcs = stamp.elements.filter((el: any) => el?.type === "text-on-path" || el?.type === "textOnPath");
  if (!frame || !centerText || arcs.length < 1 || arcs.length > 2) return false;

  const texts = new Set(arcs.map((el: any) => el?.text));
  const hasCanonicalTexts =
    texts.has(STARTER_TOP_TEXT) &&
    texts.has(STARTER_BOTTOM_TEXT) &&
    centerText.text === STARTER_CENTER_TEXT &&
    arcs.length === 2;
  const hasLegacyTexts =
    centerText.text === "STAMP" &&
    texts.has("YOUR COMPANY NAME");

  if (!hasCanonicalTexts && !hasLegacyTexts) return false;

  return arcs.every((el: any) =>
    el?.align === "center" &&
    el?.startAngle === 0 &&
    typeof el?.radius === "number" &&
    typeof el?.fontSize === "number"
  );
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addStamp: (shape = "round") => {
        const stamp = createDefaultStamp(shape);
        set((s) => ({
          stamps: [...s.stamps, stamp],
          activeStampId: stamp.id,
          selectedElementId: null,
        }));
      },

      removeStamp: (stampId) => {
        set((s) => {
          const remaining = s.stamps.filter((st) => st.id !== stampId);
          if (remaining.length === 0) {
            const newStamp = createDefaultStamp();
            return { stamps: [newStamp], activeStampId: newStamp.id, selectedElementId: null };
          }
          const newActive =
            s.activeStampId === stampId ? remaining[0]!.id : s.activeStampId;
          return { stamps: remaining, activeStampId: newActive, selectedElementId: null };
        });
      },

      setActiveStamp: (stampId) => set({ activeStampId: stampId, selectedElementId: null }),

      updateStamp: (stampId, updates) => {
        set((s) => ({
          stamps: s.stamps.map((st) =>
            st.id === stampId ? { ...st, ...updates } : st
          ),
        }));
      },

      addElement: (stampId, element) => {
        set((s) => ({
          stamps: s.stamps.map((st) =>
            st.id === stampId
              ? { ...st, elements: [...st.elements, element] }
              : st
          ),
          selectedElementId: element.id,
        }));
      },

      removeElement: (stampId, elementId) => {
        set((s) => ({
          stamps: s.stamps.map((st) =>
            st.id === stampId
              ? { ...st, elements: st.elements.filter((el) => el.id !== elementId) }
              : st
          ),
          selectedElementId:
            s.selectedElementId === elementId ? null : s.selectedElementId,
        }));
      },

      updateElement: (stampId, elementId, updates) => {
        set((s) => ({
          stamps: s.stamps.map((st) =>
            st.id === stampId
              ? {
                  ...st,
                  elements: st.elements.map((el) =>
                    el.id === elementId ? ({ ...el, ...updates } as StampElement) : el
                  ),
                }
              : st
          ),
        }));
      },

      duplicateElement: (stampId, elementId) => {
        const stamp = get().stamps.find((s) => s.id === stampId);
        const el = stamp?.elements.find((e) => e.id === elementId);
        if (!el) return;
        const newEl = { ...el, id: nanoid() };
        set((s) => ({
          stamps: s.stamps.map((st) =>
            st.id === stampId
              ? { ...st, elements: [...st.elements, newEl] }
              : st
          ),
          selectedElementId: newEl.id,
        }));
      },

      moveElementUp: (stampId, elementId) => {
        set((s) => ({
          stamps: s.stamps.map((st) => {
            if (st.id !== stampId) return st;
            const idx = st.elements.findIndex((e) => e.id === elementId);
            if (idx <= 0) return st;
            const els = [...st.elements];
            [els[idx - 1], els[idx]] = [els[idx]!, els[idx - 1]!];
            return { ...st, elements: els };
          }),
        }));
      },

      moveElementDown: (stampId, elementId) => {
        set((s) => ({
          stamps: s.stamps.map((st) => {
            if (st.id !== stampId) return st;
            const idx = st.elements.findIndex((e) => e.id === elementId);
            if (idx < 0 || idx >= st.elements.length - 1) return st;
            const els = [...st.elements];
            [els[idx], els[idx + 1]] = [els[idx + 1]!, els[idx]!];
            return { ...st, elements: els };
          }),
        }));
      },

      setSelectedElement: (elementId) => set({ selectedElementId: elementId }),

      loadState: (state) => set(state),

      resetEditor: () => {
        const stamp = createDefaultStamp();
        set({ stamps: [stamp], activeStampId: stamp.id, selectedElementId: null });
      },

      setLocale: (locale) => set({ locale }),

      getActiveStamp: () => {
        const s = get();
        return s.stamps.find((st) => st.id === s.activeStampId);
      },

      getSelectedElement: () => {
        const s = get();
        const stamp = s.stamps.find((st) => st.id === s.activeStampId);
        if (!stamp || !s.selectedElementId) return undefined;
        return stamp.elements.find((el) => el.id === s.selectedElementId);
      },
    }),
    {
      name: "stampelo-editor",
      // Only persist the stamp state, not UI state
      partialize: (state) => ({
        stamps: state.stamps,
        activeStampId: state.activeStampId,
        locale: state.locale,
      }),
      // ─── Migration history ────────────────────────────────────────────────
      // v0 (pre-2026-08-08): old broken default — centerText "STAMP", arc "YOUR COMPANY NAME"
      // v1 (2026-08-08a): starter texts updated but full-circle path semantics still wrong
      // v2 (2026-08-08b): same renderer issue plus frame-collision-prone radius=82
      // v3 (2026-08-08c): semantic top/bottom partial arcs + safe baseline radius
      //
      // Migration replaces the stamp ONLY when it still looks like the untouched
      // historical starter. User-customized stamps are not overwritten.
      version: 3,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const s = persistedState as any;
        const stamps: any[] = s?.stamps ?? [];

        if (stamps.length === 1 && fromVersion < 3 && looksLikeHistoricalStarterStamp(stamps[0])) {
          const fresh = createDefaultStamp("round");
          return { ...s, stamps: [fresh], activeStampId: fresh.id };
        }

        return persistedState;
      },
    }
  )
);
