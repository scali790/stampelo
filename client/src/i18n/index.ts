import { en } from "./en";
import { de } from "./de";
import { useEditorStore } from "@/editor/store";

export const translations = { en, de };

export function useT() {
  const locale = useEditorStore((s) => s.locale);
  return translations[locale] ?? translations.en;
}

