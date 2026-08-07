// ─── Built-in SVG icon library ────────────────────────────────────────────────
// Each icon is a minimal SVG path/group that fits in a 24x24 viewBox

export const ICON_CATEGORIES = [
  "Business",
  "Medical",
  "Legal",
  "Nature",
  "Technology",
  "Transport",
  "Food",
  "Education",
  "Finance",
  "Communication",
  "Security",
  "Sports",
  "Travel",
  "Construction",
  "Animals",
  "Symbols",
  "Arrows",
  "Stars & Shapes",
  "Agriculture",
] as const;

export type IconCategory = (typeof ICON_CATEGORIES)[number];

// Sample built-in icons (SVG path data, 24x24 viewBox)
export const BUILT_IN_ICONS: Array<{
  id: string;
  name: string;
  category: IconCategory;
  path: string;
  tags: string;
}> = [
  // Business
  { id: "briefcase", name: "Briefcase", category: "Business", path: "M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9-2h2v2h-2V5zm9 14H4V9h16v10z", tags: "work office business" },
  { id: "building", name: "Building", category: "Business", path: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zm-6 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2z", tags: "building company office" },
  { id: "handshake", name: "Handshake", category: "Business", path: "M11 6H9L7 4H3L1 6v4l2 2h2l1 1v1l-2 2v2l2 2h2l4-4 4 4h2l2-2v-2l-2-2v-1l1-1h2l2-2V6l-2-2h-4l-2 2zm-1 2l2-2h4l1 1v3l-1 1h-2l-2 2v2l-3 3-3-3v-2l-2-2H2V7l1-1h4l2 2z", tags: "deal agreement partnership" },
  // Medical
  { id: "cross", name: "Medical Cross", category: "Medical", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z", tags: "health hospital medicine" },
  { id: "heart", name: "Heart", category: "Medical", path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", tags: "love health care" },
  { id: "stethoscope", name: "Stethoscope", category: "Medical", path: "M19 8C19 10.76 17.26 13.15 14.78 14.19L14 14.5V17c0 1.65-1.35 3-3 3s-3-1.35-3-3v-2.5l-.78-.31C4.74 13.15 3 10.76 3 8V4h2v4c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4V4h2v4zM9 4H7V2h2v2zm8 0h-2V2h2v2z", tags: "doctor health medical" },
  // Legal
  { id: "scale", name: "Scale of Justice", category: "Legal", path: "M17 7h-4v1.9l2 2V11h-2v2h2v1.1l-2 2V18h4c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm0 9h-2v-1l2-2v3zm0-5h-2V9h2v2zM7 7H3c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h4v-1.9l-2-2V13h2v-2H5V9.1l2-2V7zm0 9H5v-3l2 2v1z", tags: "justice law legal" },
  { id: "gavel", name: "Gavel", category: "Legal", path: "M1 21L10 12 13 15 4 24 1 21zM5.5 5.5l2.5 2.5-2.5 2.5L3 8l2.5-2.5zM21 3L11 13l-2-2L19 1l2 2zM17.5 7.5L15 10l-2-2 2.5-2.5 2 2z", tags: "court judge law" },
  // Nature
  { id: "tree", name: "Tree", category: "Nature", path: "M17 12h-5V7h-2v5H5l7 7 7-7zM5 20v2h14v-2H5z", tags: "nature environment green" },
  { id: "leaf", name: "Leaf", category: "Nature", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71C6.72 18.5 8.24 15.33 11 13c-1.56 2.5-2.04 5.5-1.96 8h2c.06-3.5 1.5-6.5 4-8.5V21h2V8z", tags: "leaf plant nature eco" },
  // Technology
  { id: "gear", name: "Gear", category: "Technology", path: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z", tags: "settings cog technology" },
  { id: "computer", name: "Computer", category: "Technology", path: "M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z", tags: "computer tech digital" },
  // Transport
  { id: "truck", name: "Truck", category: "Transport", path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "truck delivery transport" },
  { id: "plane", name: "Airplane", category: "Transport", path: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z", tags: "airplane flight travel" },
  // Stars & Shapes
  { id: "star", name: "Star", category: "Stars & Shapes", path: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", tags: "star rating favorite" },
  { id: "diamond", name: "Diamond", category: "Stars & Shapes", path: "M19 3H5L2 9l10 12L22 9l-3-6zm-8.5 6l1.5-3 1.5 3h-3zm5 0l-1.5-3h3l-1.5 3zM5.5 8l1.5-3h2L7.5 8H5.5zm1.5 1l3 4-4.5-4H7zm5 4l3-4h1.5L12 13zm3-4h1.5l-1.5 3-1.5-3H15z", tags: "diamond gem shape" },
  { id: "shield", name: "Shield", category: "Security", path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z", tags: "shield security protection" },
  { id: "crown", name: "Crown", category: "Symbols", path: "M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z", tags: "crown royal premium" },
  { id: "ribbon", name: "Ribbon", category: "Symbols", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z", tags: "award ribbon badge" },
  { id: "eagle", name: "Eagle", category: "Animals", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z", tags: "eagle bird animal" },
  { id: "globe", name: "Globe", category: "Travel", path: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.9 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z", tags: "world globe international" },
  { id: "anchor", name: "Anchor", category: "Symbols", path: "M17.26 22L12 19.23 6.74 22l1-5.83-4.24-4.13 5.86-.85L12 6l2.64 5.19 5.86.85-4.24 4.13z", tags: "anchor sea marine" },
  { id: "wheat", name: "Wheat", category: "Agriculture", path: "M14.5 2.5c0 1.5-1.5 7-1.5 7s-1.5-5.5-1.5-7a1.5 1.5 0 0 1 3 0zM7 10.5c1.5 0 7 1.5 7 1.5s-5.5 1.5-7 1.5a1.5 1.5 0 0 1 0-3zM17 10.5a1.5 1.5 0 0 1 0 3c-1.5 0-7-1.5-7-1.5s5.5-1.5 7-1.5zM12 13c0 4.97-4.03 9-9 9v-2c3.87 0 7-3.13 7-7h2z", tags: "wheat grain agriculture food" },
];
