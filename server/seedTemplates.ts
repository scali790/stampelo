/**
 * Template seed script — 50+ original stamp templates across all major categories.
 * Run with: npx tsx server/seedTemplates.ts
 *
 * Each template uses the EditorState shape: { stamps: Stamp[], activeStampId: string }
 * Every stamp has: id, shape, widthMm, color, effects, elements[]
 */

import { drizzle } from "drizzle-orm/mysql2";
import { templates } from "../drizzle/schema";
import { nanoid } from "nanoid";

// ─── Helper: build a round stamp state ────────────────────────────────────────
function roundStamp(opts: {
  id?: string;
  widthMm?: number;
  color?: string;
  outerText?: string;
  innerText?: string;
  centerText?: string;
  centerText2?: string;
  iconPath?: string;
  shabby?: boolean;
}) {
  const id = opts.id ?? nanoid();
  const color = opts.color ?? "#1a3a6b";
  return {
    stamps: [{
      id,
      shape: "round" as const,
      widthMm: opts.widthMm ?? 38,
      color,
      effects: { shabby: opts.shabby ?? false, gold: false, silver: false },
      elements: [
        // Outer ring
        { id: nanoid(), type: "frame" as const, color, visible: true, radius: 90, strokeWidth: 3, lineBreakGap: 0 },
        // Inner ring
        { id: nanoid(), type: "frame" as const, color, visible: true, radius: 75, strokeWidth: 1.5, lineBreakGap: 0 },
        // Outer text on path
        ...(opts.outerText ? [{
          id: nanoid(), type: "textOnPath" as const, color, visible: true,
          text: opts.outerText, font: "Arial", fontSize: 11, bold: true, italic: false,
          align: "center" as const, inverse: false, radius: 82, letterSpacing: 100, startAngle: 0,
        }] : []),
        // Inner text on path (bottom)
        ...(opts.innerText ? [{
          id: nanoid(), type: "textOnPath" as const, color, visible: true,
          text: opts.innerText, font: "Arial", fontSize: 9, bold: false, italic: false,
          align: "center" as const, inverse: true, radius: 68, letterSpacing: 100, startAngle: 0,
        }] : []),
        // Center text line 1
        ...(opts.centerText ? [{
          id: nanoid(), type: "centerText" as const, color, visible: true,
          text: opts.centerText, font: "Arial", fontSize: 10, bold: true, italic: false, x: 50, y: opts.centerText2 ? 44 : 50,
        }] : []),
        // Center text line 2
        ...(opts.centerText2 ? [{
          id: nanoid(), type: "centerText" as const, color, visible: true,
          text: opts.centerText2, font: "Arial", fontSize: 9, bold: false, italic: false, x: 50, y: 56,
        }] : []),
        // Icon
        ...(opts.iconPath ? [{
          id: nanoid(), type: "image" as const, color, visible: true,
          svgContent: `<path d="${opts.iconPath}" fill="currentColor"/>`, scale: 80, x: 50, y: 50,
        }] : []),
      ],
    }],
    activeStampId: id,
    locale: "en" as const,
  };
}

function rectStamp(opts: {
  id?: string;
  widthMm?: number;
  color?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
}) {
  const id = opts.id ?? nanoid();
  const color = opts.color ?? "#1a3a6b";
  const lines = [opts.line1, opts.line2, opts.line3, opts.line4].filter(Boolean) as string[];
  const yPositions = lines.length === 1 ? [50] : lines.length === 2 ? [42, 58] : lines.length === 3 ? [36, 50, 64] : [30, 43, 57, 70];
  return {
    stamps: [{
      id,
      shape: "rectangular" as const,
      widthMm: opts.widthMm ?? 50,
      color,
      effects: { shabby: false, gold: false, silver: false },
      elements: [
        { id: nanoid(), type: "frame" as const, color, visible: true, radius: 90, strokeWidth: 3, lineBreakGap: 0 },
        { id: nanoid(), type: "frame" as const, color, visible: true, radius: 80, strokeWidth: 1, lineBreakGap: 0 },
        ...lines.map((text, i) => ({
          id: nanoid(), type: "centerText" as const, color, visible: true,
          text, font: "Arial", fontSize: i === 0 ? 12 : 10, bold: i === 0, italic: false, x: 50, y: yPositions[i]!,
        })),
      ],
    }],
    activeStampId: id,
    locale: "en" as const,
  };
}

// ─── Template catalogue ───────────────────────────────────────────────────────
const TEMPLATES = [
  // ── Corporate / Company ──────────────────────────────────────────────────────
  { name: "Corporate Round Seal", category: "Corporate", stateJson: roundStamp({ outerText: "YOUR COMPANY NAME", innerText: "EST. 2024", centerText: "OFFICIAL", centerText2: "SEAL" }) },
  { name: "Company Seal Classic", category: "Corporate", stateJson: roundStamp({ outerText: "COMPANY NAME LLC", innerText: "REGISTERED", centerText: "CERTIFIED" }) },
  { name: "Business Round Stamp", category: "Corporate", stateJson: roundStamp({ outerText: "BUSINESS SOLUTIONS INC", centerText: "APPROVED", color: "#2c3e50" }) },
  { name: "Corporate Approved Rect", category: "Corporate", stateJson: rectStamp({ line1: "APPROVED", line2: "AUTHORIZED SIGNATURE", line3: "DATE: ___________" }) },
  { name: "Company Received Stamp", category: "Corporate", stateJson: rectStamp({ line1: "RECEIVED", line2: "DATE: ___________", line3: "BY: ___________", color: "#c0392b" }) },
  // ── Medical ───────────────────────────────────────────────────────────────────
  { name: "Medical Practice Seal", category: "Medical", stateJson: roundStamp({ outerText: "MEDICAL PRACTICE", innerText: "LICENSED PHYSICIAN", centerText: "DR. NAME", centerText2: "M.D.", color: "#1a6b3a" }) },
  { name: "Pharmacy Seal", category: "Medical", stateJson: roundStamp({ outerText: "PHARMACY", innerText: "LICENSED PHARMACIST", centerText: "Rx", color: "#1a6b3a" }) },
  { name: "Hospital Official Seal", category: "Medical", stateJson: roundStamp({ outerText: "CITY GENERAL HOSPITAL", innerText: "DEPARTMENT OF MEDICINE", centerText: "OFFICIAL", centerText2: "SEAL" }) },
  { name: "Medical Approved Rect", category: "Medical", stateJson: rectStamp({ line1: "MEDICALLY APPROVED", line2: "PHYSICIAN SIGNATURE", line3: "DATE: ___________", color: "#1a6b3a" }) },
  { name: "Dental Practice Seal", category: "Medical", stateJson: roundStamp({ outerText: "DENTAL PRACTICE", innerText: "DDS / DMD", centerText: "DR. NAME", color: "#0d6efd" }) },
  // ── Legal / Notary ────────────────────────────────────────────────────────────
  { name: "Notary Public Seal", category: "Legal / Notary", stateJson: roundStamp({ outerText: "NOTARY PUBLIC", innerText: "STATE OF ___________", centerText: "OFFICIAL", centerText2: "SEAL", color: "#4a0080" }) },
  { name: "Attorney Seal", category: "Legal / Notary", stateJson: roundStamp({ outerText: "ATTORNEY AT LAW", innerText: "BAR ASSOCIATION", centerText: "COUNSEL", color: "#4a0080" }) },
  { name: "Law Firm Seal", category: "Legal / Notary", stateJson: roundStamp({ outerText: "LAW FIRM & ASSOCIATES", innerText: "LEGAL SERVICES", centerText: "CONFIDENTIAL" }) },
  { name: "Legal Received Rect", category: "Legal / Notary", stateJson: rectStamp({ line1: "RECEIVED", line2: "LAW OFFICES OF ___________", line3: "FILE NO: ___________", color: "#4a0080" }) },
  { name: "Court Filed Stamp", category: "Legal / Notary", stateJson: rectStamp({ line1: "FILED", line2: "SUPERIOR COURT", line3: "DATE: ___________", color: "#8b0000" }) },
  // ── Finance / Banking ─────────────────────────────────────────────────────────
  { name: "Bank Official Seal", category: "Finance / Banking", stateJson: roundStamp({ outerText: "NATIONAL BANK", innerText: "AUTHORIZED BRANCH", centerText: "OFFICIAL", centerText2: "STAMP" }) },
  { name: "Finance Certified Seal", category: "Finance / Banking", stateJson: roundStamp({ outerText: "FINANCIAL SERVICES", innerText: "CERTIFIED ACCOUNTANT", centerText: "CPA", color: "#1a3a6b" }) },
  { name: "Bank Approved Rect", category: "Finance / Banking", stateJson: rectStamp({ line1: "APPROVED", line2: "AUTHORIZED OFFICER", line3: "ACCOUNT NO: ___________" }) },
  { name: "Deposit Only Stamp", category: "Finance / Banking", stateJson: rectStamp({ line1: "FOR DEPOSIT ONLY", line2: "ACCOUNT: ___________", line3: "BANK: ___________" }) },
  // ── Education ─────────────────────────────────────────────────────────────────
  { name: "School Official Seal", category: "Education", stateJson: roundStamp({ outerText: "SCHOOL NAME", innerText: "EST. 2000", centerText: "OFFICIAL", centerText2: "SEAL", color: "#8b4513" }) },
  { name: "University Seal", category: "Education", stateJson: roundStamp({ outerText: "UNIVERSITY OF EXCELLENCE", innerText: "FOUNDED 1900", centerText: "VERITAS", color: "#8b0000" }) },
  { name: "Library Seal", category: "Education", stateJson: roundStamp({ outerText: "PUBLIC LIBRARY", innerText: "KNOWLEDGE IS POWER", centerText: "PROPERTY", centerText2: "OF LIBRARY" }) },
  { name: "School Checked Rect", category: "Education", stateJson: rectStamp({ line1: "CHECKED", line2: "TEACHER: ___________", line3: "DATE: ___________", color: "#8b4513" }) },
  { name: "Excellent Work Stamp", category: "Education", stateJson: rectStamp({ line1: "EXCELLENT WORK!", line2: "GRADE: ___________", color: "#228b22" }) },
  // ── Government ────────────────────────────────────────────────────────────────
  { name: "Government Official Seal", category: "Government", stateJson: roundStamp({ outerText: "GOVERNMENT OF ___________", innerText: "OFFICIAL DOCUMENT", centerText: "CERTIFIED", centerText2: "COPY", color: "#8b0000" }) },
  { name: "Municipal Seal", category: "Government", stateJson: roundStamp({ outerText: "CITY OF ___________", innerText: "MUNICIPAL GOVERNMENT", centerText: "OFFICIAL" }) },
  { name: "Passport Control Rect", category: "Government", stateJson: rectStamp({ line1: "PASSPORT CONTROL", line2: "ENTRY APPROVED", line3: "DATE: ___________", color: "#8b0000" }) },
  // ── Real Estate ───────────────────────────────────────────────────────────────
  { name: "Real Estate Agency Seal", category: "Real Estate", stateJson: roundStamp({ outerText: "REAL ESTATE AGENCY", innerText: "LICENSED BROKER", centerText: "CERTIFIED", centerText2: "AGENT" }) },
  { name: "Property Approved Rect", category: "Real Estate", stateJson: rectStamp({ line1: "PROPERTY APPROVED", line2: "AGENT: ___________", line3: "DATE: ___________" }) },
  // ── Construction ──────────────────────────────────────────────────────────────
  { name: "Construction Company Seal", category: "Construction", stateJson: roundStamp({ outerText: "CONSTRUCTION CO.", innerText: "LICENSED CONTRACTOR", centerText: "INSPECTED", color: "#ff6600" }) },
  { name: "Building Inspected Rect", category: "Construction", stateJson: rectStamp({ line1: "BUILDING INSPECTED", line2: "INSPECTOR: ___________", line3: "DATE: ___________", color: "#ff6600" }) },
  // ── Transport ─────────────────────────────────────────────────────────────────
  { name: "Transport Company Seal", category: "Transport", stateJson: roundStamp({ outerText: "TRANSPORT & LOGISTICS", innerText: "CERTIFIED CARRIER", centerText: "DELIVERED" }) },
  { name: "Shipping Received Rect", category: "Transport", stateJson: rectStamp({ line1: "RECEIVED IN GOOD ORDER", line2: "CARRIER: ___________", line3: "DATE: ___________" }) },
  // ── Retail ────────────────────────────────────────────────────────────────────
  { name: "Retail Store Seal", category: "Retail", stateJson: roundStamp({ outerText: "STORE NAME", innerText: "QUALITY PRODUCTS", centerText: "SINCE", centerText2: "2000" }) },
  { name: "Sale Stamp Rect", category: "Retail", stateJson: rectStamp({ line1: "SALE", line2: "SPECIAL OFFER", line3: "LIMITED TIME", color: "#c0392b" }) },
  { name: "Quality Assured Round", category: "Retail", stateJson: roundStamp({ outerText: "QUALITY ASSURED", innerText: "CERTIFIED PRODUCT", centerText: "QA", color: "#228b22" }) },
  // ── Restaurant / Food ─────────────────────────────────────────────────────────
  { name: "Restaurant Seal", category: "Restaurant / Food", stateJson: roundStamp({ outerText: "RESTAURANT NAME", innerText: "FINE DINING", centerText: "EST.", centerText2: "2000", color: "#8b0000" }) },
  { name: "Food Safety Cert Round", category: "Restaurant / Food", stateJson: roundStamp({ outerText: "FOOD SAFETY CERTIFIED", innerText: "HACCP COMPLIANT", centerText: "SAFE", centerText2: "FOOD", color: "#228b22" }) },
  // ── Technology ────────────────────────────────────────────────────────────────
  { name: "Tech Company Seal", category: "Technology", stateJson: roundStamp({ outerText: "TECH SOLUTIONS INC", innerText: "INNOVATION FIRST", centerText: "CERTIFIED", centerText2: "PARTNER", color: "#0d6efd" }) },
  { name: "Software License Rect", category: "Technology", stateJson: rectStamp({ line1: "SOFTWARE LICENSED", line2: "LICENSE NO: ___________", line3: "VALID UNTIL: ___________", color: "#0d6efd" }) },
  // ── Wedding ───────────────────────────────────────────────────────────────────
  { name: "Wedding Seal Classic", category: "Wedding", stateJson: roundStamp({ outerText: "TOGETHER FOREVER", innerText: "LOVE & HAPPINESS", centerText: "MR & MRS", centerText2: "SMITH", color: "#c0392b" }) },
  { name: "Wedding Invitation Seal", category: "Wedding", stateJson: roundStamp({ outerText: "WE ARE GETTING MARRIED", innerText: "SAVE THE DATE", centerText: "2024", color: "#c0392b" }) },
  // ── Non-Profit ────────────────────────────────────────────────────────────────
  { name: "Non-Profit Seal", category: "Non-Profit", stateJson: roundStamp({ outerText: "NON-PROFIT ORGANIZATION", innerText: "501(C)(3) REGISTERED", centerText: "OFFICIAL", centerText2: "SEAL" }) },
  { name: "Charity Certified Round", category: "Non-Profit", stateJson: roundStamp({ outerText: "CHARITABLE FOUNDATION", innerText: "REGISTERED CHARITY", centerText: "CERTIFIED", color: "#228b22" }) },
  // ── Healthcare ────────────────────────────────────────────────────────────────
  { name: "Healthcare Provider Seal", category: "Healthcare", stateJson: roundStamp({ outerText: "HEALTHCARE PROVIDER", innerText: "LICENSED & INSURED", centerText: "CERTIFIED", centerText2: "CARE", color: "#1a6b3a" }) },
  // ── Security ──────────────────────────────────────────────────────────────────
  { name: "Security Agency Seal", category: "Security", stateJson: roundStamp({ outerText: "SECURITY SERVICES", innerText: "LICENSED AGENCY", centerText: "VERIFIED", color: "#1a3a6b" }) },
  // ── Accounting ────────────────────────────────────────────────────────────────
  { name: "Accounting Firm Seal", category: "Accounting", stateJson: roundStamp({ outerText: "ACCOUNTING FIRM", innerText: "CERTIFIED PUBLIC ACCOUNTANT", centerText: "CPA", color: "#1a3a6b" }) },
  { name: "Audited Rect Stamp", category: "Accounting", stateJson: rectStamp({ line1: "AUDITED", line2: "FIRM: ___________", line3: "DATE: ___________" }) },
  // ── Architecture ──────────────────────────────────────────────────────────────
  { name: "Architecture Firm Seal", category: "Architecture", stateJson: roundStamp({ outerText: "ARCHITECTURE & DESIGN", innerText: "LICENSED ARCHITECT", centerText: "AIA", color: "#4a4a4a" }) },
  // ── Pharmaceutical ────────────────────────────────────────────────────────────
  { name: "Pharmaceutical Seal", category: "Pharmaceutical", stateJson: roundStamp({ outerText: "PHARMACEUTICAL CO.", innerText: "GMP CERTIFIED", centerText: "QUALITY", centerText2: "ASSURED", color: "#1a6b3a" }) },
  // ── Logistics ─────────────────────────────────────────────────────────────────
  { name: "Logistics Company Seal", category: "Logistics", stateJson: roundStamp({ outerText: "LOGISTICS & SUPPLY CHAIN", innerText: "CERTIFIED CARRIER", centerText: "ON TIME" }) },
  // ── Custom / Blank ────────────────────────────────────────────────────────────
  { name: "Blank Round Stamp", category: "Custom", stateJson: roundStamp({ outerText: "YOUR TEXT HERE", centerText: "CUSTOM" }) },
  { name: "Blank Rectangular Stamp", category: "Custom", stateJson: rectStamp({ line1: "YOUR TEXT HERE", line2: "LINE 2", line3: "LINE 3" }) },
];

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);
  console.log(`Seeding ${TEMPLATES.length} templates...`);

  for (const t of TEMPLATES) {
    const svgPreview = generatePreviewSvg(t.stateJson);
    await db.insert(templates).values({
      name: t.name,
      category: t.category,
      stateJson: t.stateJson,
      thumbnailSvg: svgPreview,
      isActive: true,
    }).onDuplicateKeyUpdate({ set: { name: t.name } });
    console.log(`  ✓ ${t.name}`);
  }
  console.log("Done!");
  process.exit(0);
}

function generatePreviewSvg(state: any): string {
  const stamp = state.stamps[0];
  if (!stamp) return "";
  const color = stamp.color ?? "#1a3a6b";
  const cx = 50, cy = 50, r = 42;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 7}" fill="none" stroke="${color}" stroke-width="1"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${color}" font-size="8" font-family="Arial" font-weight="bold">PREVIEW</text>
  </svg>`;
}

seed().catch(console.error);
