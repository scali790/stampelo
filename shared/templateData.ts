// ─── Template categories and sample templates ────────────────────────────────
// Each template has a stateJson that matches the EditorState shape

export const TEMPLATE_CATEGORIES = [
  "Corporate",
  "Medical",
  "Legal / Notary",
  "Wedding",
  "Finance / Banking",
  "Education",
  "Government",
  "Real Estate",
  "Construction",
  "Transport",
  "Retail",
  "Restaurant / Food",
  "Technology",
  "Creative / Design",
  "Non-Profit",
  "Sports / Fitness",
  "Travel / Tourism",
  "Agriculture",
  "Engineering",
  "Healthcare",
  "Security",
  "Insurance",
  "Accounting",
  "Architecture",
  "Pharmaceutical",
  "Logistics",
  "Manufacturing",
  "Energy",
  "Media / Publishing",
  "Custom",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

