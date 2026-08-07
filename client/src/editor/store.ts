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

// ─── Default stamp factory ────────────────────────────────────────────────────
export function createDefaultStamp(shape: StampShape = "round"): Stamp {
  const frameId = nanoid();
  const textId = nanoid();
  const centerTextId = nanoid();

  const frame: FrameElement = {
    id: frameId,
    type: "frame",
    color: "#1a3a6b",
    visible: true,
    radius: 95,
    strokeWidth: 3,
    lineBreak: 0,
  };

  const textOnPath: TextOnPathElement = {
    id: textId,
    type: "text-on-path",
    color: "#1a3a6b",
    visible: true,
    text: "YOUR COMPANY NAME",
    font: "Arial",
    fontSize: 11,
    bold: true,
    italic: false,
    align: "center",
    inverse: false,
    radius: 78,
    letterSpacing: 100,
    startAngle: 0,
  };

  const centerText: CenterTextElement = {
    id: centerTextId,
    type: "center-text",
    color: "#1a3a6b",
    visible: true,
    text: "STAMP",
    font: "Arial",
    fontSize: 14,
    bold: true,
    italic: false,
    x: 50,
    y: 50,
  };

  return {
    id: nanoid(),
    shape,
    widthMm: shape === "rectangular" ? 55 : 38,
    heightMm: shape === "rectangular" ? 25 : 38,
    color: "#1a3a6b",
    effects: { shabby: false, gold: false, silver: false },
    elements: [frame, textOnPath, centerText],
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

const initialStamp = createDefaultStamp("round");

const initialState: EditorState = {
  stamps: [initialStamp],
  activeStampId: initialStamp.id,
  selectedElementId: null,
  locale: "en",
};

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
    }
  )
);
