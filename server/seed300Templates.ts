/**
 * Stampelo — 300+ Template Seed Script
 * Idempotent: uses slug as unique key, safe to re-run.
 * Run: DATABASE_URL="$DATABASE_URL" npx tsx server/seed300Templates.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { templates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

// ─── Helper to build stamp state JSON ─────────────────────────────────────────
function makeRound(text1: string, text2: string, color = "#1a3a6b") {
  return {
    stamps: [{
      id: "s1", shape: "round", widthMm: 38, color,
      effects: { shabby: false, gold: false, silver: false },
      elements: [
        { id: "e1", type: "frame", color, visible: true, radius: 90, strokeWidth: 4, lineBreakGap: 0 },
        { id: "e2", type: "frame", color, visible: true, radius: 76, strokeWidth: 1.5, lineBreakGap: 0 },
        { id: "e3", type: "textOnPath", color, visible: true, text: text1, font: "Arial", fontSize: 11, bold: true, italic: false, align: "center", inverse: false, radius: 83, letterSpacing: 120, startAngle: 0 },
        { id: "e4", type: "centerText", color, visible: true, text: text2, font: "Arial", fontSize: 13, bold: true, italic: false, x: 50, y: 50 },
      ]
    }],
    activeStampId: "s1", locale: "en"
  };
}

function makeRoundWithSub(text1: string, center: string, sub: string, color = "#1a3a6b") {
  return {
    stamps: [{
      id: "s1", shape: "round", widthMm: 38, color,
      effects: { shabby: false, gold: false, silver: false },
      elements: [
        { id: "e1", type: "frame", color, visible: true, radius: 90, strokeWidth: 5, lineBreakGap: 0 },
        { id: "e2", type: "frame", color, visible: true, radius: 75, strokeWidth: 1, lineBreakGap: 0 },
        { id: "e3", type: "textOnPath", color, visible: true, text: text1, font: "Arial", fontSize: 10, bold: true, italic: false, align: "center", inverse: false, radius: 82, letterSpacing: 110, startAngle: 0 },
        { id: "e4", type: "centerText", color, visible: true, text: center, font: "Arial", fontSize: 14, bold: true, italic: false, x: 50, y: 45 },
        { id: "e5", type: "centerText", color, visible: true, text: sub, font: "Arial", fontSize: 9, bold: false, italic: false, x: 50, y: 62 },
      ]
    }],
    activeStampId: "s1", locale: "en"
  };
}

function makeRect(line1: string, line2: string, line3 = "", color = "#1a3a6b") {
  return {
    stamps: [{
      id: "s1", shape: "rectangular", widthMm: 50, color,
      effects: { shabby: false, gold: false, silver: false },
      elements: [
        { id: "e1", type: "frame", color, visible: true, radius: 90, strokeWidth: 3, lineBreakGap: 0 },
        { id: "e2", type: "centerText", color, visible: true, text: line1, font: "Arial", fontSize: 13, bold: true, italic: false, x: 50, y: line3 ? 35 : 42 },
        { id: "e3", type: "centerText", color, visible: true, text: line2, font: "Arial", fontSize: 11, bold: false, italic: false, x: 50, y: line3 ? 52 : 58 },
        ...(line3 ? [{ id: "e4", type: "centerText", color, visible: true, text: line3, font: "Arial", fontSize: 9, bold: false, italic: false, x: 50, y: 68 }] : []),
      ]
    }],
    activeStampId: "s1", locale: "en"
  };
}

function makeOval(text1: string, center: string, color = "#1a3a6b") {
  return {
    stamps: [{
      id: "s1", shape: "oval", widthMm: 45, color,
      effects: { shabby: false, gold: false, silver: false },
      elements: [
        { id: "e1", type: "frame", color, visible: true, radius: 90, strokeWidth: 4, lineBreakGap: 0 },
        { id: "e2", type: "textOnPath", color, visible: true, text: text1, font: "Arial", fontSize: 10, bold: true, italic: false, align: "center", inverse: false, radius: 82, letterSpacing: 110, startAngle: 0 },
        { id: "e3", type: "centerText", color, visible: true, text: center, font: "Arial", fontSize: 13, bold: true, italic: false, x: 50, y: 50 },
      ]
    }],
    activeStampId: "s1", locale: "en"
  };
}

function makeTriangle(line1: string, line2: string, color = "#1a3a6b") {
  return {
    stamps: [{
      id: "s1", shape: "triangular", widthMm: 45, color,
      effects: { shabby: false, gold: false, silver: false },
      elements: [
        { id: "e1", type: "frame", color, visible: true, radius: 90, strokeWidth: 3, lineBreakGap: 0 },
        { id: "e2", type: "centerText", color, visible: true, text: line1, font: "Arial", fontSize: 11, bold: true, italic: false, x: 50, y: 45 },
        { id: "e3", type: "centerText", color, visible: true, text: line2, font: "Arial", fontSize: 9, bold: false, italic: false, x: 50, y: 60 },
      ]
    }],
    activeStampId: "s1", locale: "en"
  };
}

// ─── Template catalogue ────────────────────────────────────────────────────────
const TEMPLATES: Array<{
  slug: string; category: string; name: string; nameDE: string;
  shape: string; sortOrder: number; searchTerms: string;
  stateJson: object;
}> = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS / CORPORATE (40 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "corp-round-seal-1", category: "Business", name: "Company Round Seal", nameDE: "Firmenstempel Rund", shape: "round", sortOrder: 10, searchTerms: "company seal corporate round official", stateJson: makeRound("YOUR COMPANY NAME", "OFFICIAL\nSEAL") },
  { slug: "corp-round-seal-2", category: "Business", name: "Corporate Seal Blue", nameDE: "Firmensiegel Blau", shape: "round", sortOrder: 11, searchTerms: "corporate seal blue official", stateJson: makeRoundWithSub("CORPORATE SEAL", "COMPANY", "EST. 2024", "#0d2b6b") },
  { slug: "corp-round-seal-3", category: "Business", name: "Business Stamp Classic", nameDE: "Geschäftsstempel Klassisch", shape: "round", sortOrder: 12, searchTerms: "business stamp classic professional", stateJson: makeRound("BUSINESS STAMP", "OFFICIAL") },
  { slug: "corp-rect-1", category: "Business", name: "Company Address Stamp", nameDE: "Firmenadressstempel", shape: "rectangular", sortOrder: 13, searchTerms: "company address stamp rectangular", stateJson: makeRect("COMPANY NAME", "Street Address", "City · Country") },
  { slug: "corp-rect-2", category: "Business", name: "Head Office Stamp", nameDE: "Hauptsitz Stempel", shape: "rectangular", sortOrder: 14, searchTerms: "head office headquarters stamp", stateJson: makeRect("HEAD OFFICE", "Main Street 1", "Zurich, Switzerland") },
  { slug: "corp-round-4", category: "Business", name: "Partnership Seal", nameDE: "Partnerschaftssiegel", shape: "round", sortOrder: 15, searchTerms: "partnership seal business", stateJson: makeRound("BUSINESS PARTNERSHIP", "PARTNERS") },
  { slug: "corp-round-5", category: "Business", name: "Sole Proprietor", nameDE: "Einzelunternehmen", shape: "round", sortOrder: 16, searchTerms: "sole proprietor business owner", stateJson: makeRound("SOLE PROPRIETOR", "OFFICIAL") },
  { slug: "corp-oval-1", category: "Business", name: "Company Oval Seal", nameDE: "Firmenstempel Oval", shape: "oval", sortOrder: 17, searchTerms: "company oval seal business", stateJson: makeOval("YOUR COMPANY NAME", "OFFICIAL") },
  { slug: "corp-rect-3", category: "Business", name: "Branch Office", nameDE: "Zweigstelle", shape: "rectangular", sortOrder: 18, searchTerms: "branch office stamp", stateJson: makeRect("BRANCH OFFICE", "Department Name", "Location") },
  { slug: "corp-round-6", category: "Business", name: "Internal Use Only", nameDE: "Nur für internen Gebrauch", shape: "round", sortOrder: 19, searchTerms: "internal use only confidential", stateJson: makeRound("INTERNAL USE ONLY", "RESTRICTED") },
  { slug: "corp-round-7", category: "Business", name: "Official Company Seal", nameDE: "Offizielles Firmensiegel", shape: "round", sortOrder: 20, searchTerms: "official company seal formal", stateJson: makeRoundWithSub("OFFICIAL COMPANY SEAL", "AUTHORIZED", "SIGNATURE", "#1a3a6b") },
  { slug: "corp-round-8", category: "Business", name: "General Business Stamp", nameDE: "Allgemeiner Geschäftsstempel", shape: "round", sortOrder: 21, searchTerms: "general business stamp", stateJson: makeRound("GENERAL BUSINESS", "STAMP") },
  { slug: "corp-rect-4", category: "Business", name: "Office Stamp", nameDE: "Bürostempel", shape: "rectangular", sortOrder: 22, searchTerms: "office stamp rectangular", stateJson: makeRect("OFFICE STAMP", "Department", "Reference No.") },
  { slug: "corp-round-9", category: "Business", name: "Company Name Seal", nameDE: "Firmennamenstempel", shape: "round", sortOrder: 23, searchTerms: "company name seal", stateJson: makeRound("COMPANY NAME", "SEAL") },
  { slug: "corp-oval-2", category: "Business", name: "Professional Services", nameDE: "Professionelle Dienstleistungen", shape: "oval", sortOrder: 24, searchTerms: "professional services oval stamp", stateJson: makeOval("PROFESSIONAL SERVICES", "CERTIFIED") },
  { slug: "corp-round-10", category: "Business", name: "Executive Approval", nameDE: "Geschäftsführer Genehmigung", shape: "round", sortOrder: 25, searchTerms: "executive approval management", stateJson: makeRound("EXECUTIVE APPROVAL", "AUTHORIZED") },
  { slug: "corp-rect-5", category: "Business", name: "Business Address", nameDE: "Geschäftsadresse", shape: "rectangular", sortOrder: 26, searchTerms: "business address stamp", stateJson: makeRect("YOUR BUSINESS NAME", "Address Line 1", "City · Postcode") },
  { slug: "corp-round-11", category: "Business", name: "Corporate Identity", nameDE: "Unternehmensidentität", shape: "round", sortOrder: 27, searchTerms: "corporate identity brand seal", stateJson: makeRound("CORPORATE IDENTITY", "OFFICIAL") },
  { slug: "corp-triangle-1", category: "Business", name: "Quality Assured", nameDE: "Qualitätsgesichert", shape: "triangular", sortOrder: 28, searchTerms: "quality assured triangle stamp", stateJson: makeTriangle("QUALITY ASSURED", "CERTIFIED") },
  { slug: "corp-round-12", category: "Business", name: "Registered Company", nameDE: "Eingetragenes Unternehmen", shape: "round", sortOrder: 29, searchTerms: "registered company official", stateJson: makeRound("REGISTERED COMPANY", "OFFICIAL") },
  { slug: "corp-rect-6", category: "Business", name: "Company Letterhead", nameDE: "Firmenbriefkopf", shape: "rectangular", sortOrder: 30, searchTerms: "company letterhead stamp", stateJson: makeRect("COMPANY NAME LTD.", "www.company.com", "+41 00 000 00 00") },
  { slug: "corp-round-13", category: "Business", name: "Authorized Signatory", nameDE: "Bevollmächtigter Unterzeichner", shape: "round", sortOrder: 31, searchTerms: "authorized signatory official", stateJson: makeRound("AUTHORIZED SIGNATORY", "OFFICIAL") },
  { slug: "corp-oval-3", category: "Business", name: "Business Oval Classic", nameDE: "Geschäftsstempel Oval Klassisch", shape: "oval", sortOrder: 32, searchTerms: "business oval classic stamp", stateJson: makeOval("BUSINESS OFFICIAL", "APPROVED") },
  { slug: "corp-round-14", category: "Business", name: "Company Verified", nameDE: "Unternehmen Verifiziert", shape: "round", sortOrder: 33, searchTerms: "company verified official", stateJson: makeRound("COMPANY VERIFIED", "OFFICIAL") },
  { slug: "corp-rect-7", category: "Business", name: "For Official Use", nameDE: "Für amtlichen Gebrauch", shape: "rectangular", sortOrder: 34, searchTerms: "official use stamp rectangular", stateJson: makeRect("FOR OFFICIAL USE", "Authorized Personnel Only") },
  { slug: "corp-round-15", category: "Business", name: "Management Approved", nameDE: "Von der Geschäftsleitung genehmigt", shape: "round", sortOrder: 35, searchTerms: "management approved seal", stateJson: makeRound("MANAGEMENT APPROVED", "OFFICIAL") },
  { slug: "corp-round-16", category: "Business", name: "Certified Business", nameDE: "Zertifiziertes Unternehmen", shape: "round", sortOrder: 36, searchTerms: "certified business seal", stateJson: makeRoundWithSub("CERTIFIED BUSINESS", "VERIFIED", "MEMBER", "#2c5f2e") },
  { slug: "corp-rect-8", category: "Business", name: "Correspondence Stamp", nameDE: "Korrespondenzstempel", shape: "rectangular", sortOrder: 37, searchTerms: "correspondence stamp office", stateJson: makeRect("CORRESPONDENCE", "Reference:", "Date:") },
  { slug: "corp-round-17", category: "Business", name: "Holding Company Seal", nameDE: "Holdinggesellschaft Siegel", shape: "round", sortOrder: 38, searchTerms: "holding company seal", stateJson: makeRound("HOLDING COMPANY", "GROUP SEAL") },
  { slug: "corp-oval-4", category: "Business", name: "Business Group Seal", nameDE: "Unternehmensgruppe Siegel", shape: "oval", sortOrder: 39, searchTerms: "business group seal oval", stateJson: makeOval("BUSINESS GROUP", "OFFICIAL SEAL") },
  { slug: "corp-round-18", category: "Business", name: "Director Approved", nameDE: "Direktor Genehmigt", shape: "round", sortOrder: 40, searchTerms: "director approved official", stateJson: makeRound("DIRECTOR APPROVED", "OFFICIAL") },
  { slug: "corp-rect-9", category: "Business", name: "Company Registration", nameDE: "Unternehmensregistrierung", shape: "rectangular", sortOrder: 41, searchTerms: "company registration stamp", stateJson: makeRect("COMPANY REGISTRATION", "Reg. No.", "Date:") },
  { slug: "corp-round-19", category: "Business", name: "Subsidiary Seal", nameDE: "Tochtergesellschaft Siegel", shape: "round", sortOrder: 42, searchTerms: "subsidiary seal company", stateJson: makeRound("SUBSIDIARY COMPANY", "OFFICIAL SEAL") },
  { slug: "corp-round-20", category: "Business", name: "Enterprise Stamp", nameDE: "Unternehmensstempel", shape: "round", sortOrder: 43, searchTerms: "enterprise stamp official", stateJson: makeRound("ENTERPRISE STAMP", "OFFICIAL") },
  { slug: "corp-rect-10", category: "Business", name: "Invoice Stamp", nameDE: "Rechnungsstempel", shape: "rectangular", sortOrder: 44, searchTerms: "invoice stamp business", stateJson: makeRect("INVOICE", "No.", "Date:") },
  { slug: "corp-round-21", category: "Business", name: "Company Seal Minimal", nameDE: "Firmenstempel Minimal", shape: "round", sortOrder: 45, searchTerms: "company seal minimal clean", stateJson: makeRound("YOUR COMPANY", "SEAL") },
  { slug: "corp-oval-5", category: "Business", name: "Office Oval Stamp", nameDE: "Bürostempel Oval", shape: "oval", sortOrder: 46, searchTerms: "office oval stamp", stateJson: makeOval("OFFICE STAMP", "OFFICIAL") },
  { slug: "corp-triangle-2", category: "Business", name: "Business Triangle", nameDE: "Geschäftsstempel Dreieck", shape: "triangular", sortOrder: 47, searchTerms: "business triangle stamp", stateJson: makeTriangle("BUSINESS STAMP", "OFFICIAL") },
  { slug: "corp-round-22", category: "Business", name: "Verified Supplier", nameDE: "Verifizierter Lieferant", shape: "round", sortOrder: 48, searchTerms: "verified supplier business", stateJson: makeRound("VERIFIED SUPPLIER", "CERTIFIED") },
  { slug: "corp-rect-11", category: "Business", name: "Purchase Order", nameDE: "Bestellauftrag", shape: "rectangular", sortOrder: 49, searchTerms: "purchase order stamp", stateJson: makeRect("PURCHASE ORDER", "PO No.", "Authorized By:") },

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL / STATUS (32 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "status-approved-1", category: "Approval", name: "Approved", nameDE: "Genehmigt", shape: "round", sortOrder: 100, searchTerms: "approved status official green", stateJson: makeRound("APPROVED", "✓", "#2c5f2e") },
  { slug: "status-approved-rect", category: "Approval", name: "Approved Rectangular", nameDE: "Genehmigt Rechteckig", shape: "rectangular", sortOrder: 101, searchTerms: "approved rectangular stamp", stateJson: makeRect("APPROVED", "Authorized By:", "Date:") },
  { slug: "status-rejected-1", category: "Approval", name: "Rejected", nameDE: "Abgelehnt", shape: "round", sortOrder: 102, searchTerms: "rejected denied status red", stateJson: makeRound("REJECTED", "NOT APPROVED", "#8b0000") },
  { slug: "status-verified-1", category: "Approval", name: "Verified", nameDE: "Verifiziert", shape: "round", sortOrder: 103, searchTerms: "verified confirmed status", stateJson: makeRound("VERIFIED", "OFFICIAL", "#1a3a6b") },
  { slug: "status-confirmed-1", category: "Approval", name: "Confirmed", nameDE: "Bestätigt", shape: "round", sortOrder: 104, searchTerms: "confirmed status official", stateJson: makeRound("CONFIRMED", "OFFICIAL") },
  { slug: "status-completed-1", category: "Approval", name: "Completed", nameDE: "Abgeschlossen", shape: "round", sortOrder: 105, searchTerms: "completed done finished status", stateJson: makeRound("COMPLETED", "DONE", "#2c5f2e") },
  { slug: "status-pending-1", category: "Approval", name: "Pending", nameDE: "Ausstehend", shape: "round", sortOrder: 106, searchTerms: "pending waiting status", stateJson: makeRound("PENDING", "REVIEW", "#8b6914") },
  { slug: "status-accepted-1", category: "Approval", name: "Accepted", nameDE: "Akzeptiert", shape: "round", sortOrder: 107, searchTerms: "accepted approved status", stateJson: makeRound("ACCEPTED", "OFFICIAL") },
  { slug: "status-declined-1", category: "Approval", name: "Declined", nameDE: "Abgelehnt", shape: "round", sortOrder: 108, searchTerms: "declined rejected status", stateJson: makeRound("DECLINED", "NOT ACCEPTED", "#8b0000") },
  { slug: "status-reviewed-1", category: "Approval", name: "Reviewed", nameDE: "Geprüft", shape: "round", sortOrder: 109, searchTerms: "reviewed checked status", stateJson: makeRound("REVIEWED", "OFFICIAL") },
  { slug: "status-checked-1", category: "Approval", name: "Checked", nameDE: "Geprüft", shape: "rectangular", sortOrder: 110, searchTerms: "checked verified status", stateJson: makeRect("CHECKED", "By:", "Date:") },
  { slug: "status-validated-1", category: "Approval", name: "Validated", nameDE: "Validiert", shape: "round", sortOrder: 111, searchTerms: "validated approved status", stateJson: makeRound("VALIDATED", "OFFICIAL") },
  { slug: "status-quality-1", category: "Approval", name: "Quality Checked", nameDE: "Qualitätsgeprüft", shape: "round", sortOrder: 112, searchTerms: "quality checked control status", stateJson: makeRound("QUALITY CHECKED", "QC PASS", "#2c5f2e") },
  { slug: "status-final-1", category: "Approval", name: "Final", nameDE: "Endgültig", shape: "round", sortOrder: 113, searchTerms: "final approved status", stateJson: makeRound("FINAL", "APPROVED") },
  { slug: "status-draft-1", category: "Approval", name: "Draft", nameDE: "Entwurf", shape: "rectangular", sortOrder: 114, searchTerms: "draft not final status", stateJson: makeRect("DRAFT", "NOT FINAL", "For Review Only") },
  { slug: "status-copy-1", category: "Approval", name: "Copy", nameDE: "Kopie", shape: "rectangular", sortOrder: 115, searchTerms: "copy duplicate document", stateJson: makeRect("COPY", "Not Original") },
  { slug: "status-original-1", category: "Approval", name: "Original", nameDE: "Original", shape: "rectangular", sortOrder: 116, searchTerms: "original document authentic", stateJson: makeRect("ORIGINAL", "Authentic Document") },
  { slug: "status-approved-oval", category: "Approval", name: "Approved Oval", nameDE: "Genehmigt Oval", shape: "oval", sortOrder: 117, searchTerms: "approved oval stamp", stateJson: makeOval("APPROVED OFFICIAL", "AUTHORIZED") },
  { slug: "status-not-approved", category: "Approval", name: "Not Approved", nameDE: "Nicht Genehmigt", shape: "round", sortOrder: 118, searchTerms: "not approved rejected status", stateJson: makeRound("NOT APPROVED", "RETURNED", "#8b0000") },
  { slug: "status-for-approval", category: "Approval", name: "For Approval", nameDE: "Zur Genehmigung", shape: "rectangular", sortOrder: 119, searchTerms: "for approval pending review", stateJson: makeRect("FOR APPROVAL", "Submitted By:", "Date:") },
  { slug: "status-approved-green", category: "Approval", name: "Approved Green", nameDE: "Genehmigt Grün", shape: "round", sortOrder: 120, searchTerms: "approved green official", stateJson: makeRoundWithSub("APPROVED", "✓", "OFFICIAL", "#2c5f2e") },
  { slug: "status-rejected-rect", category: "Approval", name: "Rejected Rectangular", nameDE: "Abgelehnt Rechteckig", shape: "rectangular", sortOrder: 121, searchTerms: "rejected rectangular stamp", stateJson: makeRect("REJECTED", "Reason:", "Date:", ) },
  { slug: "status-under-review", category: "Approval", name: "Under Review", nameDE: "In Prüfung", shape: "round", sortOrder: 122, searchTerms: "under review pending status", stateJson: makeRound("UNDER REVIEW", "PENDING") },
  { slug: "status-approved-tri", category: "Approval", name: "Approved Triangle", nameDE: "Genehmigt Dreieck", shape: "triangular", sortOrder: 123, searchTerms: "approved triangle stamp", stateJson: makeTriangle("APPROVED", "OFFICIAL") },
  { slug: "status-passed-1", category: "Approval", name: "Passed", nameDE: "Bestanden", shape: "round", sortOrder: 124, searchTerms: "passed approved status", stateJson: makeRound("PASSED", "OFFICIAL", "#2c5f2e") },
  { slug: "status-failed-1", category: "Approval", name: "Failed", nameDE: "Nicht Bestanden", shape: "round", sortOrder: 125, searchTerms: "failed not passed status", stateJson: makeRound("FAILED", "NOT PASSED", "#8b0000") },
  { slug: "status-void-1", category: "Approval", name: "Void", nameDE: "Ungültig", shape: "rectangular", sortOrder: 126, searchTerms: "void invalid cancelled", stateJson: makeRect("VOID", "This document is void") },
  { slug: "status-cancelled-1", category: "Approval", name: "Cancelled", nameDE: "Storniert", shape: "rectangular", sortOrder: 127, searchTerms: "cancelled void status", stateJson: makeRect("CANCELLED", "No longer valid") },
  { slug: "status-expired-1", category: "Approval", name: "Expired", nameDE: "Abgelaufen", shape: "round", sortOrder: 128, searchTerms: "expired invalid status", stateJson: makeRound("EXPIRED", "INVALID", "#8b0000") },
  { slug: "status-superseded", category: "Approval", name: "Superseded", nameDE: "Ersetzt", shape: "rectangular", sortOrder: 129, searchTerms: "superseded replaced status", stateJson: makeRect("SUPERSEDED", "See new version") },
  { slug: "status-certified-1", category: "Approval", name: "Certified", nameDE: "Zertifiziert", shape: "round", sortOrder: 130, searchTerms: "certified official status", stateJson: makeRound("CERTIFIED", "OFFICIAL") },
  { slug: "status-approved-by", category: "Approval", name: "Approved By", nameDE: "Genehmigt Von", shape: "rectangular", sortOrder: 131, searchTerms: "approved by name date", stateJson: makeRect("APPROVED BY", "Name:", "Date:") },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCOUNTING / FINANCE (32 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "fin-paid-1", category: "Finance", name: "Paid", nameDE: "Bezahlt", shape: "round", sortOrder: 200, searchTerms: "paid payment finance accounting", stateJson: makeRound("PAID", "THANK YOU", "#2c5f2e") },
  { slug: "fin-paid-rect", category: "Finance", name: "Paid Rectangular", nameDE: "Bezahlt Rechteckig", shape: "rectangular", sortOrder: 201, searchTerms: "paid rectangular finance", stateJson: makeRect("PAID", "Amount:", "Date:") },
  { slug: "fin-unpaid-1", category: "Finance", name: "Unpaid", nameDE: "Unbezahlt", shape: "round", sortOrder: 202, searchTerms: "unpaid outstanding finance", stateJson: makeRound("UNPAID", "OVERDUE", "#8b0000") },
  { slug: "fin-invoice-1", category: "Finance", name: "Invoice", nameDE: "Rechnung", shape: "rectangular", sortOrder: 203, searchTerms: "invoice billing finance", stateJson: makeRect("INVOICE", "No.:", "Due Date:") },
  { slug: "fin-received-payment", category: "Finance", name: "Payment Received", nameDE: "Zahlung Erhalten", shape: "round", sortOrder: 204, searchTerms: "payment received finance", stateJson: makeRound("PAYMENT RECEIVED", "THANK YOU", "#2c5f2e") },
  { slug: "fin-accounted-1", category: "Finance", name: "Accounted", nameDE: "Verbucht", shape: "round", sortOrder: 205, searchTerms: "accounted booked finance", stateJson: makeRound("ACCOUNTED", "BOOKED") },
  { slug: "fin-booked-1", category: "Finance", name: "Booked", nameDE: "Gebucht", shape: "rectangular", sortOrder: 206, searchTerms: "booked accounting finance", stateJson: makeRect("BOOKED", "Account:", "Date:") },
  { slug: "fin-expense-1", category: "Finance", name: "Expense", nameDE: "Ausgabe", shape: "rectangular", sortOrder: 207, searchTerms: "expense cost finance", stateJson: makeRect("EXPENSE", "Amount:", "Category:") },
  { slug: "fin-audit-1", category: "Finance", name: "Audited", nameDE: "Geprüft", shape: "round", sortOrder: 208, searchTerms: "audited finance accounting", stateJson: makeRound("AUDITED", "OFFICIAL") },
  { slug: "fin-paid-full", category: "Finance", name: "Paid in Full", nameDE: "Vollständig Bezahlt", shape: "round", sortOrder: 209, searchTerms: "paid in full complete finance", stateJson: makeRound("PAID IN FULL", "CLEARED", "#2c5f2e") },
  { slug: "fin-deposit-1", category: "Finance", name: "Deposit Received", nameDE: "Anzahlung Erhalten", shape: "rectangular", sortOrder: 210, searchTerms: "deposit received finance", stateJson: makeRect("DEPOSIT RECEIVED", "Amount:", "Date:") },
  { slug: "fin-credit-1", category: "Finance", name: "Credit", nameDE: "Gutschrift", shape: "rectangular", sortOrder: 211, searchTerms: "credit note finance", stateJson: makeRect("CREDIT NOTE", "Amount:", "Reference:") },
  { slug: "fin-debit-1", category: "Finance", name: "Debit", nameDE: "Lastschrift", shape: "rectangular", sortOrder: 212, searchTerms: "debit finance accounting", stateJson: makeRect("DEBIT", "Amount:", "Account:") },
  { slug: "fin-payment-due", category: "Finance", name: "Payment Due", nameDE: "Zahlung Fällig", shape: "rectangular", sortOrder: 213, searchTerms: "payment due overdue finance", stateJson: makeRect("PAYMENT DUE", "Amount:", "Due Date:") },
  { slug: "fin-reimbursed-1", category: "Finance", name: "Reimbursed", nameDE: "Erstattet", shape: "round", sortOrder: 214, searchTerms: "reimbursed expense finance", stateJson: makeRound("REIMBURSED", "APPROVED") },
  { slug: "fin-tax-paid", category: "Finance", name: "Tax Paid", nameDE: "Steuer Bezahlt", shape: "rectangular", sortOrder: 215, searchTerms: "tax paid finance", stateJson: makeRect("TAX PAID", "Amount:", "Period:") },
  { slug: "fin-chf-paid", category: "Finance", name: "Paid CHF", nameDE: "Bezahlt CHF", shape: "round", sortOrder: 216, searchTerms: "paid chf swiss franc finance", stateJson: makeRound("PAID", "CHF", "#2c5f2e") },
  { slug: "fin-cash-payment", category: "Finance", name: "Cash Payment", nameDE: "Barzahlung", shape: "rectangular", sortOrder: 217, searchTerms: "cash payment received finance", stateJson: makeRect("CASH PAYMENT", "Received:", "Date:") },
  { slug: "fin-bank-transfer", category: "Finance", name: "Bank Transfer", nameDE: "Banküberweisung", shape: "rectangular", sortOrder: 218, searchTerms: "bank transfer payment finance", stateJson: makeRect("BANK TRANSFER", "Reference:", "Date:") },
  { slug: "fin-overdue-1", category: "Finance", name: "Overdue", nameDE: "Überfällig", shape: "round", sortOrder: 219, searchTerms: "overdue late payment finance", stateJson: makeRound("OVERDUE", "PAYMENT DUE", "#8b0000") },
  { slug: "fin-settled-1", category: "Finance", name: "Settled", nameDE: "Beglichen", shape: "round", sortOrder: 220, searchTerms: "settled paid finance", stateJson: makeRound("SETTLED", "CLEARED", "#2c5f2e") },
  { slug: "fin-refunded-1", category: "Finance", name: "Refunded", nameDE: "Erstattet", shape: "round", sortOrder: 221, searchTerms: "refunded returned finance", stateJson: makeRound("REFUNDED", "PROCESSED") },
  { slug: "fin-budget-approved", category: "Finance", name: "Budget Approved", nameDE: "Budget Genehmigt", shape: "rectangular", sortOrder: 222, searchTerms: "budget approved finance", stateJson: makeRect("BUDGET APPROVED", "Amount:", "Authorized By:") },
  { slug: "fin-invoice-paid", category: "Finance", name: "Invoice Paid", nameDE: "Rechnung Bezahlt", shape: "rectangular", sortOrder: 223, searchTerms: "invoice paid finance", stateJson: makeRect("INVOICE PAID", "Invoice No.:", "Date:") },
  { slug: "fin-final-payment", category: "Finance", name: "Final Payment", nameDE: "Abschlusszahlung", shape: "round", sortOrder: 224, searchTerms: "final payment complete finance", stateJson: makeRound("FINAL PAYMENT", "RECEIVED", "#2c5f2e") },
  { slug: "fin-partial-payment", category: "Finance", name: "Partial Payment", nameDE: "Teilzahlung", shape: "rectangular", sortOrder: 225, searchTerms: "partial payment finance", stateJson: makeRect("PARTIAL PAYMENT", "Amount:", "Balance Due:") },
  { slug: "fin-advance-payment", category: "Finance", name: "Advance Payment", nameDE: "Vorauszahlung", shape: "rectangular", sortOrder: 226, searchTerms: "advance payment prepaid finance", stateJson: makeRect("ADVANCE PAYMENT", "Amount:", "Date:") },
  { slug: "fin-cleared-1", category: "Finance", name: "Cleared", nameDE: "Verrechnet", shape: "round", sortOrder: 227, searchTerms: "cleared settled finance", stateJson: makeRound("CLEARED", "SETTLED", "#2c5f2e") },
  { slug: "fin-write-off", category: "Finance", name: "Write Off", nameDE: "Abschreibung", shape: "rectangular", sortOrder: 228, searchTerms: "write off accounting finance", stateJson: makeRect("WRITE OFF", "Amount:", "Authorized By:") },
  { slug: "fin-reconciled", category: "Finance", name: "Reconciled", nameDE: "Abgestimmt", shape: "round", sortOrder: 229, searchTerms: "reconciled accounting finance", stateJson: makeRound("RECONCILED", "VERIFIED") },
  { slug: "fin-accounting-1", category: "Finance", name: "Accounting Stamp", nameDE: "Buchhaltungsstempel", shape: "round", sortOrder: 230, searchTerms: "accounting stamp finance", stateJson: makeRound("ACCOUNTING", "OFFICIAL") },
  { slug: "fin-finance-dept", category: "Finance", name: "Finance Department", nameDE: "Finanzabteilung", shape: "round", sortOrder: 231, searchTerms: "finance department stamp", stateJson: makeRound("FINANCE DEPT.", "OFFICIAL") },

  // ═══════════════════════════════════════════════════════════════════════════
  // RECEIVED / DOCUMENT WORKFLOW (26 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "doc-received-1", category: "Document", name: "Received", nameDE: "Erhalten", shape: "rectangular", sortOrder: 300, searchTerms: "received document workflow", stateJson: makeRect("RECEIVED", "Date:", "By:") },
  { slug: "doc-sent-1", category: "Document", name: "Sent", nameDE: "Gesendet", shape: "rectangular", sortOrder: 301, searchTerms: "sent dispatched document", stateJson: makeRect("SENT", "Date:", "By:") },
  { slug: "doc-filed-1", category: "Document", name: "Filed", nameDE: "Abgelegt", shape: "rectangular", sortOrder: 302, searchTerms: "filed archived document", stateJson: makeRect("FILED", "File No.:", "Date:") },
  { slug: "doc-processed-1", category: "Document", name: "Processed", nameDE: "Bearbeitet", shape: "rectangular", sortOrder: 303, searchTerms: "processed handled document", stateJson: makeRect("PROCESSED", "By:", "Date:") },
  { slug: "doc-entered-1", category: "Document", name: "Entered", nameDE: "Erfasst", shape: "rectangular", sortOrder: 304, searchTerms: "entered recorded document", stateJson: makeRect("ENTERED", "System:", "Date:") },
  { slug: "doc-registered-1", category: "Document", name: "Registered", nameDE: "Registriert", shape: "rectangular", sortOrder: 305, searchTerms: "registered document official", stateJson: makeRect("REGISTERED", "Reg. No.:", "Date:") },
  { slug: "doc-incoming-1", category: "Document", name: "Incoming", nameDE: "Eingang", shape: "rectangular", sortOrder: 306, searchTerms: "incoming received document", stateJson: makeRect("INCOMING", "Date:", "Ref:") },
  { slug: "doc-outgoing-1", category: "Document", name: "Outgoing", nameDE: "Ausgang", shape: "rectangular", sortOrder: 307, searchTerms: "outgoing sent document", stateJson: makeRect("OUTGOING", "Date:", "Ref:") },
  { slug: "doc-copy-received", category: "Document", name: "Copy Received", nameDE: "Kopie Erhalten", shape: "rectangular", sortOrder: 308, searchTerms: "copy received document", stateJson: makeRect("COPY RECEIVED", "Date:", "By:") },
  { slug: "doc-duplicate-1", category: "Document", name: "Duplicate", nameDE: "Duplikat", shape: "rectangular", sortOrder: 309, searchTerms: "duplicate copy document", stateJson: makeRect("DUPLICATE", "Not Original") },
  { slug: "doc-archive-1", category: "Document", name: "Archive", nameDE: "Archiv", shape: "rectangular", sortOrder: 310, searchTerms: "archive filed document", stateJson: makeRect("ARCHIVE", "Box No.:", "Date:") },
  { slug: "doc-confidential-1", category: "Document", name: "Confidential", nameDE: "Vertraulich", shape: "round", sortOrder: 311, searchTerms: "confidential secret document", stateJson: makeRound("CONFIDENTIAL", "RESTRICTED", "#8b0000") },
  { slug: "doc-internal-1", category: "Document", name: "Internal", nameDE: "Intern", shape: "rectangular", sortOrder: 312, searchTerms: "internal use document", stateJson: makeRect("INTERNAL", "Not for External Use") },
  { slug: "doc-for-info-1", category: "Document", name: "For Information", nameDE: "Zur Information", shape: "rectangular", sortOrder: 313, searchTerms: "for information document", stateJson: makeRect("FOR INFORMATION", "No Action Required") },
  { slug: "doc-action-required", category: "Document", name: "Action Required", nameDE: "Aktion Erforderlich", shape: "rectangular", sortOrder: 314, searchTerms: "action required document", stateJson: makeRect("ACTION REQUIRED", "Please respond by:", "Date:") },
  { slug: "doc-urgent-1", category: "Document", name: "Urgent", nameDE: "Dringend", shape: "round", sortOrder: 315, searchTerms: "urgent priority document", stateJson: makeRound("URGENT", "PRIORITY", "#8b0000") },
  { slug: "doc-for-signature", category: "Document", name: "For Signature", nameDE: "Zur Unterschrift", shape: "rectangular", sortOrder: 316, searchTerms: "for signature document", stateJson: makeRect("FOR SIGNATURE", "Please sign and return") },
  { slug: "doc-signed-1", category: "Document", name: "Signed", nameDE: "Unterschrieben", shape: "rectangular", sortOrder: 317, searchTerms: "signed document official", stateJson: makeRect("SIGNED", "By:", "Date:") },
  { slug: "doc-scanned-1", category: "Document", name: "Scanned", nameDE: "Gescannt", shape: "rectangular", sortOrder: 318, searchTerms: "scanned digitized document", stateJson: makeRect("SCANNED", "Date:", "Operator:") },
  { slug: "doc-returned-1", category: "Document", name: "Returned", nameDE: "Zurückgegeben", shape: "rectangular", sortOrder: 319, searchTerms: "returned document", stateJson: makeRect("RETURNED", "Reason:", "Date:") },
  { slug: "doc-forwarded-1", category: "Document", name: "Forwarded", nameDE: "Weitergeleitet", shape: "rectangular", sortOrder: 320, searchTerms: "forwarded sent document", stateJson: makeRect("FORWARDED", "To:", "Date:") },
  { slug: "doc-reviewed-1", category: "Document", name: "Document Reviewed", nameDE: "Dokument Geprüft", shape: "rectangular", sortOrder: 321, searchTerms: "reviewed document official", stateJson: makeRect("REVIEWED", "By:", "Date:") },
  { slug: "doc-approved-1", category: "Document", name: "Document Approved", nameDE: "Dokument Genehmigt", shape: "rectangular", sortOrder: 322, searchTerms: "approved document official", stateJson: makeRect("APPROVED", "By:", "Date:") },
  { slug: "doc-for-filing", category: "Document", name: "For Filing", nameDE: "Zur Ablage", shape: "rectangular", sortOrder: 323, searchTerms: "for filing archive document", stateJson: makeRect("FOR FILING", "File:", "Date:") },
  { slug: "doc-not-valid", category: "Document", name: "Not Valid", nameDE: "Ungültig", shape: "round", sortOrder: 324, searchTerms: "not valid invalid document", stateJson: makeRound("NOT VALID", "INVALID", "#8b0000") },
  { slug: "doc-official-copy", category: "Document", name: "Official Copy", nameDE: "Amtliche Kopie", shape: "rectangular", sortOrder: 325, searchTerms: "official copy document certified", stateJson: makeRect("OFFICIAL COPY", "Certified True Copy") },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGISTICS / TRANSPORT (26 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "log-shipped-1", category: "Logistics", name: "Shipped", nameDE: "Versandt", shape: "rectangular", sortOrder: 400, searchTerms: "shipped dispatched logistics", stateJson: makeRect("SHIPPED", "Date:", "Carrier:") },
  { slug: "log-delivered-1", category: "Logistics", name: "Delivered", nameDE: "Geliefert", shape: "round", sortOrder: 401, searchTerms: "delivered received logistics", stateJson: makeRound("DELIVERED", "CONFIRMED", "#2c5f2e") },
  { slug: "log-dispatch-1", category: "Logistics", name: "Dispatch", nameDE: "Versand", shape: "rectangular", sortOrder: 402, searchTerms: "dispatch send logistics", stateJson: makeRect("DISPATCH", "Order No.:", "Date:") },
  { slug: "log-warehouse-1", category: "Logistics", name: "Warehouse", nameDE: "Lager", shape: "round", sortOrder: 403, searchTerms: "warehouse storage logistics", stateJson: makeRound("WAREHOUSE", "STOCK") },
  { slug: "log-goods-received", category: "Logistics", name: "Goods Received", nameDE: "Waren Erhalten", shape: "rectangular", sortOrder: 404, searchTerms: "goods received delivery logistics", stateJson: makeRect("GOODS RECEIVED", "PO No.:", "Date:") },
  { slug: "log-qc-pass", category: "Logistics", name: "Quality Control Pass", nameDE: "Qualitätskontrolle Bestanden", shape: "round", sortOrder: 405, searchTerms: "quality control pass logistics", stateJson: makeRound("QC PASS", "APPROVED", "#2c5f2e") },
  { slug: "log-packing-1", category: "Logistics", name: "Packing", nameDE: "Verpackung", shape: "rectangular", sortOrder: 406, searchTerms: "packing packaging logistics", stateJson: makeRect("PACKING", "Order No.:", "Date:") },
  { slug: "log-express-1", category: "Logistics", name: "Express", nameDE: "Express", shape: "round", sortOrder: 407, searchTerms: "express fast priority logistics", stateJson: makeRound("EXPRESS", "PRIORITY", "#8b6914") },
  { slug: "log-export-1", category: "Logistics", name: "Export", nameDE: "Export", shape: "rectangular", sortOrder: 408, searchTerms: "export customs logistics", stateJson: makeRect("EXPORT", "Destination:", "Date:") },
  { slug: "log-import-1", category: "Logistics", name: "Import", nameDE: "Import", shape: "rectangular", sortOrder: 409, searchTerms: "import customs logistics", stateJson: makeRect("IMPORT", "Origin:", "Date:") },
  { slug: "log-delivery-confirmed", category: "Logistics", name: "Delivery Confirmed", nameDE: "Lieferung Bestätigt", shape: "round", sortOrder: 410, searchTerms: "delivery confirmed logistics", stateJson: makeRound("DELIVERY CONFIRMED", "RECEIVED", "#2c5f2e") },
  { slug: "log-fragile-1", category: "Logistics", name: "Fragile", nameDE: "Zerbrechlich", shape: "rectangular", sortOrder: 411, searchTerms: "fragile handle care logistics", stateJson: makeRect("FRAGILE", "Handle with Care") },
  { slug: "log-return-1", category: "Logistics", name: "Return", nameDE: "Rücksendung", shape: "rectangular", sortOrder: 412, searchTerms: "return logistics", stateJson: makeRect("RETURN", "RMA No.:", "Date:") },
  { slug: "log-cargo-1", category: "Logistics", name: "Cargo", nameDE: "Fracht", shape: "rectangular", sortOrder: 413, searchTerms: "cargo freight logistics", stateJson: makeRect("CARGO", "Ref No.:", "Weight:") },
  { slug: "log-inspected-1", category: "Logistics", name: "Inspected", nameDE: "Inspiziert", shape: "round", sortOrder: 414, searchTerms: "inspected checked logistics", stateJson: makeRound("INSPECTED", "APPROVED") },
  { slug: "log-transit-1", category: "Logistics", name: "In Transit", nameDE: "In Transit", shape: "rectangular", sortOrder: 415, searchTerms: "in transit shipping logistics", stateJson: makeRect("IN TRANSIT", "Tracking No.:", "ETA:") },
  { slug: "log-cleared-customs", category: "Logistics", name: "Customs Cleared", nameDE: "Zoll Freigegeben", shape: "rectangular", sortOrder: 416, searchTerms: "customs cleared logistics", stateJson: makeRect("CUSTOMS CLEARED", "Date:", "Ref:") },
  { slug: "log-stock-check", category: "Logistics", name: "Stock Check", nameDE: "Bestandsprüfung", shape: "rectangular", sortOrder: 417, searchTerms: "stock check inventory logistics", stateJson: makeRect("STOCK CHECK", "Date:", "By:") },
  { slug: "log-packed-1", category: "Logistics", name: "Packed", nameDE: "Verpackt", shape: "rectangular", sortOrder: 418, searchTerms: "packed ready logistics", stateJson: makeRect("PACKED", "By:", "Date:") },
  { slug: "log-out-for-delivery", category: "Logistics", name: "Out for Delivery", nameDE: "Unterwegs zur Lieferung", shape: "round", sortOrder: 419, searchTerms: "out for delivery logistics", stateJson: makeRound("OUT FOR DELIVERY", "TODAY") },
  { slug: "log-received-warehouse", category: "Logistics", name: "Received at Warehouse", nameDE: "Im Lager Erhalten", shape: "rectangular", sortOrder: 420, searchTerms: "received warehouse logistics", stateJson: makeRect("RECEIVED AT WAREHOUSE", "Date:", "Location:") },
  { slug: "log-do-not-open", category: "Logistics", name: "Do Not Open", nameDE: "Nicht Öffnen", shape: "rectangular", sortOrder: 421, searchTerms: "do not open logistics", stateJson: makeRect("DO NOT OPEN", "Until:", "Authorized Only") },
  { slug: "log-keep-dry", category: "Logistics", name: "Keep Dry", nameDE: "Trocken Halten", shape: "rectangular", sortOrder: 422, searchTerms: "keep dry logistics storage", stateJson: makeRect("KEEP DRY", "Protect from moisture") },
  { slug: "log-this-side-up", category: "Logistics", name: "This Side Up", nameDE: "Diese Seite Oben", shape: "rectangular", sortOrder: 423, searchTerms: "this side up orientation logistics", stateJson: makeRect("THIS SIDE UP", "↑ Keep Upright ↑") },
  { slug: "log-hazardous-1", category: "Logistics", name: "Hazardous Material", nameDE: "Gefahrgut", shape: "round", sortOrder: 424, searchTerms: "hazardous material logistics", stateJson: makeRound("HAZARDOUS MATERIAL", "HANDLE WITH CARE", "#8b0000") },
  { slug: "log-cold-chain", category: "Logistics", name: "Cold Chain", nameDE: "Kühlkette", shape: "rectangular", sortOrder: 425, searchTerms: "cold chain temperature logistics", stateJson: makeRect("COLD CHAIN", "Keep Refrigerated", "2-8°C") },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDICAL / HEALTHCARE (22 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "med-practice-1", category: "Medical", name: "Medical Practice", nameDE: "Arztpraxis", shape: "round", sortOrder: 500, searchTerms: "medical practice doctor stamp", stateJson: makeRound("MEDICAL PRACTICE", "OFFICIAL") },
  { slug: "med-clinic-1", category: "Medical", name: "Clinic", nameDE: "Klinik", shape: "round", sortOrder: 501, searchTerms: "clinic medical stamp", stateJson: makeRound("CLINIC", "OFFICIAL") },
  { slug: "med-healthcare-1", category: "Medical", name: "Healthcare", nameDE: "Gesundheitswesen", shape: "round", sortOrder: 502, searchTerms: "healthcare medical stamp", stateJson: makeRound("HEALTHCARE", "OFFICIAL") },
  { slug: "med-pharmacy-1", category: "Medical", name: "Pharmacy", nameDE: "Apotheke", shape: "round", sortOrder: 503, searchTerms: "pharmacy drug medical stamp", stateJson: makeRound("PHARMACY", "OFFICIAL") },
  { slug: "med-patient-copy", category: "Medical", name: "Patient Copy", nameDE: "Patientenkopie", shape: "rectangular", sortOrder: 504, searchTerms: "patient copy medical document", stateJson: makeRect("PATIENT COPY", "Medical Records") },
  { slug: "med-laboratory-1", category: "Medical", name: "Laboratory", nameDE: "Labor", shape: "round", sortOrder: 505, searchTerms: "laboratory lab medical stamp", stateJson: makeRound("LABORATORY", "OFFICIAL") },
  { slug: "med-records-1", category: "Medical", name: "Medical Records", nameDE: "Krankenakte", shape: "rectangular", sortOrder: 506, searchTerms: "medical records document", stateJson: makeRect("MEDICAL RECORDS", "Patient:", "Date:") },
  { slug: "med-appointment-1", category: "Medical", name: "Appointment", nameDE: "Termin", shape: "rectangular", sortOrder: 507, searchTerms: "appointment medical schedule", stateJson: makeRect("APPOINTMENT", "Date:", "Time:") },
  { slug: "med-dental-1", category: "Medical", name: "Dental Practice", nameDE: "Zahnarztpraxis", shape: "round", sortOrder: 508, searchTerms: "dental practice dentist stamp", stateJson: makeRound("DENTAL PRACTICE", "OFFICIAL") },
  { slug: "med-therapy-1", category: "Medical", name: "Therapy Practice", nameDE: "Therapiepraxis", shape: "round", sortOrder: 509, searchTerms: "therapy practice medical stamp", stateJson: makeRound("THERAPY PRACTICE", "OFFICIAL") },
  { slug: "med-prescription-1", category: "Medical", name: "Prescription", nameDE: "Rezept", shape: "rectangular", sortOrder: 510, searchTerms: "prescription medical document", stateJson: makeRect("PRESCRIPTION", "Patient:", "Date:") },
  { slug: "med-confidential-1", category: "Medical", name: "Medical Confidential", nameDE: "Medizinisch Vertraulich", shape: "round", sortOrder: 511, searchTerms: "medical confidential private", stateJson: makeRound("MEDICAL CONFIDENTIAL", "PRIVATE", "#8b0000") },
  { slug: "med-emergency-1", category: "Medical", name: "Emergency", nameDE: "Notfall", shape: "round", sortOrder: 512, searchTerms: "emergency medical urgent", stateJson: makeRound("EMERGENCY", "URGENT", "#8b0000") },
  { slug: "med-specialist-1", category: "Medical", name: "Specialist Referral", nameDE: "Facharztüberweisung", shape: "rectangular", sortOrder: 513, searchTerms: "specialist referral medical", stateJson: makeRect("SPECIALIST REFERRAL", "Patient:", "Date:") },
  { slug: "med-health-cert", category: "Medical", name: "Health Certificate", nameDE: "Gesundheitszeugnis", shape: "round", sortOrder: 514, searchTerms: "health certificate medical", stateJson: makeRound("HEALTH CERTIFICATE", "OFFICIAL") },
  { slug: "med-vaccination-1", category: "Medical", name: "Vaccination", nameDE: "Impfung", shape: "rectangular", sortOrder: 515, searchTerms: "vaccination immunization medical", stateJson: makeRect("VACCINATION", "Vaccine:", "Date:") },
  { slug: "med-sick-leave", category: "Medical", name: "Sick Leave", nameDE: "Krankschreibung", shape: "rectangular", sortOrder: 516, searchTerms: "sick leave medical certificate", stateJson: makeRect("SICK LEAVE", "From:", "Until:") },
  { slug: "med-physiotherapy", category: "Medical", name: "Physiotherapy", nameDE: "Physiotherapie", shape: "round", sortOrder: 517, searchTerms: "physiotherapy physical therapy medical", stateJson: makeRound("PHYSIOTHERAPY", "OFFICIAL") },
  { slug: "med-radiology-1", category: "Medical", name: "Radiology", nameDE: "Radiologie", shape: "round", sortOrder: 518, searchTerms: "radiology x-ray medical imaging", stateJson: makeRound("RADIOLOGY", "OFFICIAL") },
  { slug: "med-surgery-1", category: "Medical", name: "Surgery", nameDE: "Chirurgie", shape: "round", sortOrder: 519, searchTerms: "surgery surgical medical", stateJson: makeRound("SURGERY", "OFFICIAL") },
  { slug: "med-internal-med", category: "Medical", name: "Internal Medicine", nameDE: "Innere Medizin", shape: "round", sortOrder: 520, searchTerms: "internal medicine medical", stateJson: makeRound("INTERNAL MEDICINE", "OFFICIAL") },
  { slug: "med-pediatrics-1", category: "Medical", name: "Pediatrics", nameDE: "Pädiatrie", shape: "round", sortOrder: 521, searchTerms: "pediatrics children medical", stateJson: makeRound("PEDIATRICS", "OFFICIAL") },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGAL / PROFESSIONAL (22 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "leg-law-office-1", category: "Legal", name: "Law Office", nameDE: "Anwaltskanzlei", shape: "round", sortOrder: 600, searchTerms: "law office legal stamp", stateJson: makeRound("LAW OFFICE", "OFFICIAL") },
  { slug: "leg-attorney-1", category: "Legal", name: "Attorney Office", nameDE: "Rechtsanwaltsbüro", shape: "round", sortOrder: 601, searchTerms: "attorney lawyer legal stamp", stateJson: makeRound("ATTORNEY OFFICE", "OFFICIAL") },
  { slug: "leg-consultant-1", category: "Legal", name: "Consultant", nameDE: "Berater", shape: "round", sortOrder: 602, searchTerms: "consultant professional services", stateJson: makeRound("CONSULTANT", "OFFICIAL") },
  { slug: "leg-certified-copy", category: "Legal", name: "Certified Copy", nameDE: "Beglaubigte Kopie", shape: "rectangular", sortOrder: 603, searchTerms: "certified copy legal document", stateJson: makeRect("CERTIFIED COPY", "True Copy of Original") },
  { slug: "leg-reviewed-legal", category: "Legal", name: "Legally Reviewed", nameDE: "Rechtlich Geprüft", shape: "round", sortOrder: 604, searchTerms: "legally reviewed legal", stateJson: makeRound("LEGALLY REVIEWED", "OFFICIAL") },
  { slug: "leg-document-copy", category: "Legal", name: "Document Copy", nameDE: "Dokumentenkopie", shape: "rectangular", sortOrder: 605, searchTerms: "document copy legal", stateJson: makeRect("DOCUMENT COPY", "Not Original") },
  { slug: "leg-internal-legal", category: "Legal", name: "Internal Legal", nameDE: "Interne Rechtsabteilung", shape: "round", sortOrder: 606, searchTerms: "internal legal department", stateJson: makeRound("INTERNAL LEGAL", "CONFIDENTIAL") },
  { slug: "leg-professional-1", category: "Legal", name: "Professional Services", nameDE: "Professionelle Dienstleistungen", shape: "round", sortOrder: 607, searchTerms: "professional services legal", stateJson: makeRound("PROFESSIONAL SERVICES", "OFFICIAL") },
  { slug: "leg-notarized-1", category: "Legal", name: "Notarized", nameDE: "Notariell Beglaubigt", shape: "round", sortOrder: 608, searchTerms: "notarized official legal", stateJson: makeRound("NOTARIZED", "OFFICIAL") },
  { slug: "leg-witnessed-1", category: "Legal", name: "Witnessed", nameDE: "Bezeugt", shape: "rectangular", sortOrder: 609, searchTerms: "witnessed legal document", stateJson: makeRect("WITNESSED", "By:", "Date:") },
  { slug: "leg-sworn-statement", category: "Legal", name: "Sworn Statement", nameDE: "Eidesstattliche Erklärung", shape: "round", sortOrder: 610, searchTerms: "sworn statement legal", stateJson: makeRound("SWORN STATEMENT", "OFFICIAL") },
  { slug: "leg-power-attorney", category: "Legal", name: "Power of Attorney", nameDE: "Vollmacht", shape: "rectangular", sortOrder: 611, searchTerms: "power of attorney legal", stateJson: makeRect("POWER OF ATTORNEY", "Granted to:", "Date:") },
  { slug: "leg-legal-notice", category: "Legal", name: "Legal Notice", nameDE: "Rechtliche Mitteilung", shape: "rectangular", sortOrder: 612, searchTerms: "legal notice official", stateJson: makeRect("LEGAL NOTICE", "Important Legal Document") },
  { slug: "leg-privileged-1", category: "Legal", name: "Privileged", nameDE: "Vertraulich", shape: "round", sortOrder: 613, searchTerms: "privileged confidential legal", stateJson: makeRound("PRIVILEGED", "CONFIDENTIAL", "#8b0000") },
  { slug: "leg-without-prejudice", category: "Legal", name: "Without Prejudice", nameDE: "Ohne Präjudiz", shape: "rectangular", sortOrder: 614, searchTerms: "without prejudice legal", stateJson: makeRect("WITHOUT PREJUDICE", "Confidential") },
  { slug: "leg-executed-1", category: "Legal", name: "Executed", nameDE: "Ausgeführt", shape: "rectangular", sortOrder: 615, searchTerms: "executed signed legal", stateJson: makeRect("EXECUTED", "Date:", "By:") },
  { slug: "leg-registered-deed", category: "Legal", name: "Registered Deed", nameDE: "Eingetragene Urkunde", shape: "round", sortOrder: 616, searchTerms: "registered deed legal", stateJson: makeRound("REGISTERED DEED", "OFFICIAL") },
  { slug: "leg-compliance-1", category: "Legal", name: "Compliance Approved", nameDE: "Compliance Genehmigt", shape: "round", sortOrder: 617, searchTerms: "compliance approved legal", stateJson: makeRound("COMPLIANCE APPROVED", "OFFICIAL") },
  { slug: "leg-arbitration-1", category: "Legal", name: "Arbitration", nameDE: "Schiedsverfahren", shape: "round", sortOrder: 618, searchTerms: "arbitration legal dispute", stateJson: makeRound("ARBITRATION", "OFFICIAL") },
  { slug: "leg-mediation-1", category: "Legal", name: "Mediation", nameDE: "Mediation", shape: "round", sortOrder: 619, searchTerms: "mediation legal dispute", stateJson: makeRound("MEDIATION", "OFFICIAL") },
  { slug: "leg-contract-signed", category: "Legal", name: "Contract Signed", nameDE: "Vertrag Unterzeichnet", shape: "rectangular", sortOrder: 620, searchTerms: "contract signed legal", stateJson: makeRect("CONTRACT SIGNED", "Date:", "By:") },
  { slug: "leg-legal-copy", category: "Legal", name: "Legal Copy", nameDE: "Rechtliche Kopie", shape: "rectangular", sortOrder: 621, searchTerms: "legal copy official document", stateJson: makeRect("LEGAL COPY", "Certified True Copy") },

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL ESTATE / PROPERTY (16 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "re-property-mgmt", category: "Real Estate", name: "Property Management", nameDE: "Immobilienverwaltung", shape: "round", sortOrder: 700, searchTerms: "property management real estate", stateJson: makeRound("PROPERTY MANAGEMENT", "OFFICIAL") },
  { slug: "re-real-estate-1", category: "Real Estate", name: "Real Estate", nameDE: "Immobilien", shape: "round", sortOrder: 701, searchTerms: "real estate property stamp", stateJson: makeRound("REAL ESTATE", "OFFICIAL") },
  { slug: "re-rental-1", category: "Real Estate", name: "Rental", nameDE: "Vermietung", shape: "rectangular", sortOrder: 702, searchTerms: "rental property lease", stateJson: makeRect("RENTAL", "Property:", "Date:") },
  { slug: "re-inspection-1", category: "Real Estate", name: "Property Inspection", nameDE: "Immobilieninspektion", shape: "rectangular", sortOrder: 703, searchTerms: "property inspection real estate", stateJson: makeRect("PROPERTY INSPECTION", "Date:", "Inspector:") },
  { slug: "re-property-checked", category: "Real Estate", name: "Property Checked", nameDE: "Immobilie Geprüft", shape: "round", sortOrder: 704, searchTerms: "property checked real estate", stateJson: makeRound("PROPERTY CHECKED", "OFFICIAL") },
  { slug: "re-handed-over", category: "Real Estate", name: "Handed Over", nameDE: "Übergeben", shape: "rectangular", sortOrder: 705, searchTerms: "handed over property real estate", stateJson: makeRect("HANDED OVER", "Date:", "By:") },
  { slug: "re-key-received", category: "Real Estate", name: "Key Received", nameDE: "Schlüssel Erhalten", shape: "rectangular", sortOrder: 706, searchTerms: "key received property", stateJson: makeRect("KEY RECEIVED", "Property:", "Date:") },
  { slug: "re-tenant-copy", category: "Real Estate", name: "Tenant Copy", nameDE: "Mieterkopie", shape: "rectangular", sortOrder: 707, searchTerms: "tenant copy rental real estate", stateJson: makeRect("TENANT COPY", "Property:", "Lease:") },
  { slug: "re-owner-copy", category: "Real Estate", name: "Owner Copy", nameDE: "Eigentümerkopie", shape: "rectangular", sortOrder: 708, searchTerms: "owner copy property real estate", stateJson: makeRect("OWNER COPY", "Property:", "Date:") },
  { slug: "re-sold-1", category: "Real Estate", name: "Sold", nameDE: "Verkauft", shape: "round", sortOrder: 709, searchTerms: "sold property real estate", stateJson: makeRound("SOLD", "PROPERTY", "#2c5f2e") },
  { slug: "re-for-rent-1", category: "Real Estate", name: "For Rent", nameDE: "Zu Vermieten", shape: "rectangular", sortOrder: 710, searchTerms: "for rent available property", stateJson: makeRect("FOR RENT", "Contact:", "Price:") },
  { slug: "re-lease-signed", category: "Real Estate", name: "Lease Signed", nameDE: "Mietvertrag Unterzeichnet", shape: "rectangular", sortOrder: 711, searchTerms: "lease signed property real estate", stateJson: makeRect("LEASE SIGNED", "Date:", "Tenant:") },
  { slug: "re-deposit-paid", category: "Real Estate", name: "Deposit Paid", nameDE: "Kaution Bezahlt", shape: "rectangular", sortOrder: 712, searchTerms: "deposit paid rental property", stateJson: makeRect("DEPOSIT PAID", "Amount:", "Date:") },
  { slug: "re-move-in-1", category: "Real Estate", name: "Move In", nameDE: "Einzug", shape: "rectangular", sortOrder: 713, searchTerms: "move in property rental", stateJson: makeRect("MOVE IN", "Date:", "Condition:") },
  { slug: "re-move-out-1", category: "Real Estate", name: "Move Out", nameDE: "Auszug", shape: "rectangular", sortOrder: 714, searchTerms: "move out property rental", stateJson: makeRect("MOVE OUT", "Date:", "Condition:") },
  { slug: "re-property-sold", category: "Real Estate", name: "Property Sold", nameDE: "Immobilie Verkauft", shape: "round", sortOrder: 715, searchTerms: "property sold real estate", stateJson: makeRound("PROPERTY SOLD", "COMPLETED", "#2c5f2e") },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTION / ENGINEERING (16 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "con-construction-1", category: "Construction", name: "Construction", nameDE: "Baustelle", shape: "round", sortOrder: 800, searchTerms: "construction building stamp", stateJson: makeRound("CONSTRUCTION", "OFFICIAL") },
  { slug: "con-engineering-1", category: "Construction", name: "Engineering", nameDE: "Ingenieurwesen", shape: "round", sortOrder: 801, searchTerms: "engineering technical stamp", stateJson: makeRound("ENGINEERING", "OFFICIAL") },
  { slug: "con-inspected-1", category: "Construction", name: "Inspected", nameDE: "Inspiziert", shape: "round", sortOrder: 802, searchTerms: "inspected construction approved", stateJson: makeRound("INSPECTED", "APPROVED") },
  { slug: "con-approved-drawing", category: "Construction", name: "Approved Drawing", nameDE: "Genehmigter Plan", shape: "rectangular", sortOrder: 803, searchTerms: "approved drawing plan construction", stateJson: makeRect("APPROVED DRAWING", "Rev:", "Date:") },
  { slug: "con-revision-1", category: "Construction", name: "Revision", nameDE: "Überarbeitung", shape: "rectangular", sortOrder: 804, searchTerms: "revision updated construction", stateJson: makeRect("REVISION", "Rev No.:", "Date:") },
  { slug: "con-site-copy", category: "Construction", name: "Site Copy", nameDE: "Baustellenkopie", shape: "rectangular", sortOrder: 805, searchTerms: "site copy construction", stateJson: makeRect("SITE COPY", "Project:", "Date:") },
  { slug: "con-technical-review", category: "Construction", name: "Technical Review", nameDE: "Technische Prüfung", shape: "round", sortOrder: 806, searchTerms: "technical review engineering", stateJson: makeRound("TECHNICAL REVIEW", "APPROVED") },
  { slug: "con-project-1", category: "Construction", name: "Project Stamp", nameDE: "Projektstempel", shape: "round", sortOrder: 807, searchTerms: "project stamp construction", stateJson: makeRound("PROJECT STAMP", "OFFICIAL") },
  { slug: "con-planning-1", category: "Construction", name: "Planning", nameDE: "Planung", shape: "rectangular", sortOrder: 808, searchTerms: "planning construction stamp", stateJson: makeRect("PLANNING", "Project:", "Date:") },
  { slug: "con-quality-inspection", category: "Construction", name: "Quality Inspection", nameDE: "Qualitätsprüfung", shape: "round", sortOrder: 809, searchTerms: "quality inspection construction", stateJson: makeRound("QUALITY INSPECTION", "PASSED", "#2c5f2e") },
  { slug: "con-structural-1", category: "Construction", name: "Structural Approved", nameDE: "Statik Genehmigt", shape: "round", sortOrder: 810, searchTerms: "structural approved engineering", stateJson: makeRound("STRUCTURAL APPROVED", "OFFICIAL") },
  { slug: "con-fire-safety", category: "Construction", name: "Fire Safety", nameDE: "Brandschutz", shape: "round", sortOrder: 811, searchTerms: "fire safety construction", stateJson: makeRound("FIRE SAFETY", "APPROVED") },
  { slug: "con-electrical-1", category: "Construction", name: "Electrical Approved", nameDE: "Elektro Genehmigt", shape: "round", sortOrder: 812, searchTerms: "electrical approved construction", stateJson: makeRound("ELECTRICAL APPROVED", "OFFICIAL") },
  { slug: "con-plumbing-1", category: "Construction", name: "Plumbing Approved", nameDE: "Sanitär Genehmigt", shape: "round", sortOrder: 813, searchTerms: "plumbing approved construction", stateJson: makeRound("PLUMBING APPROVED", "OFFICIAL") },
  { slug: "con-as-built-1", category: "Construction", name: "As Built", nameDE: "Wie Gebaut", shape: "rectangular", sortOrder: 814, searchTerms: "as built construction drawing", stateJson: makeRect("AS BUILT", "Date:", "Contractor:") },
  { slug: "con-permit-issued", category: "Construction", name: "Permit Issued", nameDE: "Genehmigung Erteilt", shape: "rectangular", sortOrder: 815, searchTerms: "permit issued construction", stateJson: makeRect("PERMIT ISSUED", "Permit No.:", "Date:") },

  // ═══════════════════════════════════════════════════════════════════════════
  // RETAIL / FOOD / HOSPITALITY (16 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "ret-restaurant-1", category: "Retail", name: "Restaurant", nameDE: "Restaurant", shape: "round", sortOrder: 900, searchTerms: "restaurant food stamp", stateJson: makeRound("RESTAURANT", "OFFICIAL") },
  { slug: "ret-cafe-1", category: "Retail", name: "Café", nameDE: "Café", shape: "round", sortOrder: 901, searchTerms: "cafe coffee shop stamp", stateJson: makeRound("CAFÉ", "OFFICIAL") },
  { slug: "ret-retail-1", category: "Retail", name: "Retail", nameDE: "Einzelhandel", shape: "round", sortOrder: 902, searchTerms: "retail shop store stamp", stateJson: makeRound("RETAIL", "OFFICIAL") },
  { slug: "ret-order-received", category: "Retail", name: "Order Received", nameDE: "Bestellung Erhalten", shape: "rectangular", sortOrder: 903, searchTerms: "order received retail", stateJson: makeRect("ORDER RECEIVED", "Order No.:", "Date:") },
  { slug: "ret-fresh-1", category: "Retail", name: "Fresh", nameDE: "Frisch", shape: "round", sortOrder: 904, searchTerms: "fresh food quality retail", stateJson: makeRound("FRESH", "QUALITY", "#2c5f2e") },
  { slug: "ret-handmade-1", category: "Retail", name: "Handmade", nameDE: "Handgemacht", shape: "round", sortOrder: 905, searchTerms: "handmade artisan craft retail", stateJson: makeRound("HANDMADE", "ARTISAN") },
  { slug: "ret-bakery-1", category: "Retail", name: "Bakery", nameDE: "Bäckerei", shape: "round", sortOrder: 906, searchTerms: "bakery bread fresh retail", stateJson: makeRound("BAKERY", "FRESH DAILY") },
  { slug: "ret-catering-1", category: "Retail", name: "Catering", nameDE: "Catering", shape: "round", sortOrder: 907, searchTerms: "catering food service", stateJson: makeRound("CATERING", "OFFICIAL") },
  { slug: "ret-reservation-1", category: "Retail", name: "Reservation", nameDE: "Reservierung", shape: "rectangular", sortOrder: 908, searchTerms: "reservation booking hospitality", stateJson: makeRect("RESERVATION", "Name:", "Date & Time:") },
  { slug: "ret-kitchen-1", category: "Retail", name: "Kitchen", nameDE: "Küche", shape: "round", sortOrder: 909, searchTerms: "kitchen food stamp", stateJson: makeRound("KITCHEN", "OFFICIAL") },
  { slug: "ret-organic-1", category: "Retail", name: "Organic", nameDE: "Bio", shape: "round", sortOrder: 910, searchTerms: "organic natural food retail", stateJson: makeRound("ORGANIC", "NATURAL", "#2c5f2e") },
  { slug: "ret-hotel-1", category: "Retail", name: "Hotel", nameDE: "Hotel", shape: "round", sortOrder: 911, searchTerms: "hotel hospitality stamp", stateJson: makeRound("HOTEL", "OFFICIAL") },
  { slug: "ret-spa-1", category: "Retail", name: "Spa & Wellness", nameDE: "Spa & Wellness", shape: "round", sortOrder: 912, searchTerms: "spa wellness hospitality", stateJson: makeRound("SPA & WELLNESS", "OFFICIAL") },
  { slug: "ret-takeaway-1", category: "Retail", name: "Takeaway", nameDE: "Zum Mitnehmen", shape: "rectangular", sortOrder: 913, searchTerms: "takeaway food retail", stateJson: makeRect("TAKEAWAY", "Order No.:", "Ready:") },
  { slug: "ret-delivery-food", category: "Retail", name: "Food Delivery", nameDE: "Lieferservice", shape: "rectangular", sortOrder: 914, searchTerms: "food delivery service retail", stateJson: makeRect("FOOD DELIVERY", "Order No.:", "ETA:") },
  { slug: "ret-loyalty-1", category: "Retail", name: "Loyalty Stamp", nameDE: "Treuepunkte", shape: "round", sortOrder: 915, searchTerms: "loyalty stamp retail reward", stateJson: makeRound("LOYALTY STAMP", "REWARD") },

  // ═══════════════════════════════════════════════════════════════════════════
  // EDUCATION / ORGANISATION (16 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "edu-training-1", category: "Education", name: "Training", nameDE: "Schulung", shape: "round", sortOrder: 1000, searchTerms: "training course education", stateJson: makeRound("TRAINING", "OFFICIAL") },
  { slug: "edu-course-1", category: "Education", name: "Course", nameDE: "Kurs", shape: "rectangular", sortOrder: 1001, searchTerms: "course training education", stateJson: makeRect("COURSE", "Name:", "Date:") },
  { slug: "edu-workshop-1", category: "Education", name: "Workshop", nameDE: "Workshop", shape: "round", sortOrder: 1002, searchTerms: "workshop seminar education", stateJson: makeRound("WORKSHOP", "OFFICIAL") },
  { slug: "edu-attendance-1", category: "Education", name: "Attendance", nameDE: "Anwesenheit", shape: "rectangular", sortOrder: 1003, searchTerms: "attendance education record", stateJson: makeRect("ATTENDANCE", "Name:", "Date:") },
  { slug: "edu-education-1", category: "Education", name: "Education", nameDE: "Bildung", shape: "round", sortOrder: 1004, searchTerms: "education learning stamp", stateJson: makeRound("EDUCATION", "OFFICIAL") },
  { slug: "edu-school-office", category: "Education", name: "School Office", nameDE: "Schulbüro", shape: "round", sortOrder: 1005, searchTerms: "school office education", stateJson: makeRound("SCHOOL OFFICE", "OFFICIAL") },
  { slug: "edu-internal-copy", category: "Education", name: "Internal Copy", nameDE: "Interne Kopie", shape: "rectangular", sortOrder: 1006, searchTerms: "internal copy education", stateJson: makeRect("INTERNAL COPY", "Not for External Use") },
  { slug: "edu-library-1", category: "Education", name: "Library", nameDE: "Bibliothek", shape: "round", sortOrder: 1007, searchTerms: "library books education", stateJson: makeRound("LIBRARY", "OFFICIAL") },
  { slug: "edu-certified-1", category: "Education", name: "Certified", nameDE: "Zertifiziert", shape: "round", sortOrder: 1008, searchTerms: "certified education training", stateJson: makeRound("CERTIFIED", "OFFICIAL") },
  { slug: "edu-passed-exam", category: "Education", name: "Exam Passed", nameDE: "Prüfung Bestanden", shape: "round", sortOrder: 1009, searchTerms: "exam passed education", stateJson: makeRound("EXAM PASSED", "OFFICIAL", "#2c5f2e") },
  { slug: "edu-completed-course", category: "Education", name: "Course Completed", nameDE: "Kurs Abgeschlossen", shape: "round", sortOrder: 1010, searchTerms: "course completed education", stateJson: makeRound("COURSE COMPLETED", "OFFICIAL") },
  { slug: "edu-university-1", category: "Education", name: "University", nameDE: "Universität", shape: "round", sortOrder: 1011, searchTerms: "university education stamp", stateJson: makeRound("UNIVERSITY", "OFFICIAL") },
  { slug: "edu-institute-1", category: "Education", name: "Institute", nameDE: "Institut", shape: "round", sortOrder: 1012, searchTerms: "institute education stamp", stateJson: makeRound("INSTITUTE", "OFFICIAL") },
  { slug: "edu-academy-1", category: "Education", name: "Academy", nameDE: "Akademie", shape: "round", sortOrder: 1013, searchTerms: "academy education stamp", stateJson: makeRound("ACADEMY", "OFFICIAL") },
  { slug: "edu-scholarship-1", category: "Education", name: "Scholarship", nameDE: "Stipendium", shape: "round", sortOrder: 1014, searchTerms: "scholarship award education", stateJson: makeRound("SCHOLARSHIP", "AWARDED") },
  { slug: "edu-diploma-1", category: "Education", name: "Diploma", nameDE: "Diplom", shape: "rectangular", sortOrder: 1015, searchTerms: "diploma certificate education", stateJson: makeRect("DIPLOMA", "Awarded to:", "Date:") },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONAL / CREATIVE / WEDDING (22 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "per-handmade-1", category: "Personal", name: "Handmade", nameDE: "Handgemacht", shape: "round", sortOrder: 1100, searchTerms: "handmade craft personal", stateJson: makeRound("HANDMADE", "WITH LOVE") },
  { slug: "per-with-love-1", category: "Personal", name: "With Love", nameDE: "Mit Liebe", shape: "round", sortOrder: 1101, searchTerms: "with love personal gift", stateJson: makeRound("WITH LOVE", "❤") },
  { slug: "per-thank-you-1", category: "Personal", name: "Thank You", nameDE: "Danke", shape: "round", sortOrder: 1102, searchTerms: "thank you personal gift", stateJson: makeRound("THANK YOU", "APPRECIATED") },
  { slug: "per-save-date-1", category: "Personal", name: "Save the Date", nameDE: "Save the Date", shape: "round", sortOrder: 1103, searchTerms: "save the date wedding personal", stateJson: makeRound("SAVE THE DATE", "WEDDING") },
  { slug: "per-wedding-1", category: "Personal", name: "Wedding", nameDE: "Hochzeit", shape: "round", sortOrder: 1104, searchTerms: "wedding personal stamp", stateJson: makeRound("WEDDING", "CELEBRATION") },
  { slug: "per-family-1", category: "Personal", name: "Family", nameDE: "Familie", shape: "round", sortOrder: 1105, searchTerms: "family personal stamp", stateJson: makeRound("FAMILY", "OFFICIAL") },
  { slug: "per-personal-library", category: "Personal", name: "Personal Library", nameDE: "Privatbibliothek", shape: "rectangular", sortOrder: 1106, searchTerms: "personal library book stamp", stateJson: makeRect("PERSONAL LIBRARY", "From the collection of:", "Name:") },
  { slug: "per-from-desk-1", category: "Personal", name: "From the Desk of", nameDE: "Vom Schreibtisch von", shape: "rectangular", sortOrder: 1107, searchTerms: "from the desk of personal", stateJson: makeRect("FROM THE DESK OF", "Name:") },
  { slug: "per-crafted-by-1", category: "Personal", name: "Crafted By", nameDE: "Hergestellt Von", shape: "round", sortOrder: 1108, searchTerms: "crafted by artisan personal", stateJson: makeRound("CRAFTED BY", "ARTISAN") },
  { slug: "per-small-business", category: "Personal", name: "Small Business", nameDE: "Kleines Unternehmen", shape: "round", sortOrder: 1109, searchTerms: "small business personal", stateJson: makeRound("SMALL BUSINESS", "OFFICIAL") },
  { slug: "per-wedding-oval", category: "Personal", name: "Wedding Oval", nameDE: "Hochzeit Oval", shape: "oval", sortOrder: 1110, searchTerms: "wedding oval personal stamp", stateJson: makeOval("WEDDING CELEBRATION", "OFFICIAL") },
  { slug: "per-anniversary-1", category: "Personal", name: "Anniversary", nameDE: "Jahrestag", shape: "round", sortOrder: 1111, searchTerms: "anniversary celebration personal", stateJson: makeRound("ANNIVERSARY", "CELEBRATION") },
  { slug: "per-birthday-1", category: "Personal", name: "Birthday", nameDE: "Geburtstag", shape: "round", sortOrder: 1112, searchTerms: "birthday celebration personal", stateJson: makeRound("HAPPY BIRTHDAY", "CELEBRATION") },
  { slug: "per-made-with-love", category: "Personal", name: "Made with Love", nameDE: "Mit Liebe Gemacht", shape: "round", sortOrder: 1113, searchTerms: "made with love personal", stateJson: makeRound("MADE WITH LOVE", "HOMEMADE") },
  { slug: "per-gift-1", category: "Personal", name: "Gift", nameDE: "Geschenk", shape: "round", sortOrder: 1114, searchTerms: "gift present personal", stateJson: makeRound("GIFT", "WITH LOVE") },
  { slug: "per-personal-seal", category: "Personal", name: "Personal Seal", nameDE: "Persönliches Siegel", shape: "round", sortOrder: 1115, searchTerms: "personal seal stamp", stateJson: makeRound("PERSONAL SEAL", "OFFICIAL") },
  { slug: "per-custom-1", category: "Personal", name: "Custom Stamp", nameDE: "Individueller Stempel", shape: "round", sortOrder: 1116, searchTerms: "custom stamp personal", stateJson: makeRound("CUSTOM STAMP", "PERSONAL") },
  { slug: "per-wedding-rect", category: "Personal", name: "Wedding Rectangular", nameDE: "Hochzeit Rechteckig", shape: "rectangular", sortOrder: 1117, searchTerms: "wedding rectangular stamp", stateJson: makeRect("WEDDING", "Names:", "Date:") },
  { slug: "per-engagement-1", category: "Personal", name: "Engagement", nameDE: "Verlobung", shape: "round", sortOrder: 1118, searchTerms: "engagement wedding personal", stateJson: makeRound("ENGAGEMENT", "CELEBRATION") },
  { slug: "per-christening-1", category: "Personal", name: "Christening", nameDE: "Taufe", shape: "round", sortOrder: 1119, searchTerms: "christening baptism personal", stateJson: makeRound("CHRISTENING", "CELEBRATION") },
  { slug: "per-graduation-1", category: "Personal", name: "Graduation", nameDE: "Abschluss", shape: "round", sortOrder: 1120, searchTerms: "graduation personal celebration", stateJson: makeRound("GRADUATION", "CONGRATULATIONS") },
  { slug: "per-retirement-1", category: "Personal", name: "Retirement", nameDE: "Ruhestand", shape: "round", sortOrder: 1121, searchTerms: "retirement personal celebration", stateJson: makeRound("RETIREMENT", "CONGRATULATIONS") },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATE / SIGNATURE / UTILITY (16 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "util-date-1", category: "Utility", name: "Date Stamp", nameDE: "Datumsstempel", shape: "rectangular", sortOrder: 1200, searchTerms: "date stamp utility", stateJson: makeRect("DATE", "Day / Month / Year") },
  { slug: "util-date-received", category: "Utility", name: "Date Received", nameDE: "Eingangsdatum", shape: "rectangular", sortOrder: 1201, searchTerms: "date received utility", stateJson: makeRect("DATE RECEIVED", "Date:") },
  { slug: "util-signature-1", category: "Utility", name: "Signature", nameDE: "Unterschrift", shape: "rectangular", sortOrder: 1202, searchTerms: "signature sign utility", stateJson: makeRect("SIGNATURE", "Name:", "Date:") },
  { slug: "util-initials-1", category: "Utility", name: "Initials", nameDE: "Initialen", shape: "rectangular", sortOrder: 1203, searchTerms: "initials signature utility", stateJson: makeRect("INITIALS", "Date:") },
  { slug: "util-checked-by", category: "Utility", name: "Checked By", nameDE: "Geprüft Von", shape: "rectangular", sortOrder: 1204, searchTerms: "checked by utility", stateJson: makeRect("CHECKED BY", "Name:", "Date:") },
  { slug: "util-approved-by", category: "Utility", name: "Approved By", nameDE: "Genehmigt Von", shape: "rectangular", sortOrder: 1205, searchTerms: "approved by utility", stateJson: makeRect("APPROVED BY", "Name:", "Date:") },
  { slug: "util-entered-by", category: "Utility", name: "Entered By", nameDE: "Erfasst Von", shape: "rectangular", sortOrder: 1206, searchTerms: "entered by utility", stateJson: makeRect("ENTERED BY", "Name:", "Date:") },
  { slug: "util-received-by", category: "Utility", name: "Received By", nameDE: "Erhalten Von", shape: "rectangular", sortOrder: 1207, searchTerms: "received by utility", stateJson: makeRect("RECEIVED BY", "Name:", "Date:") },
  { slug: "util-processed-by", category: "Utility", name: "Processed By", nameDE: "Bearbeitet Von", shape: "rectangular", sortOrder: 1208, searchTerms: "processed by utility", stateJson: makeRect("PROCESSED BY", "Name:", "Date:") },
  { slug: "util-prepared-by", category: "Utility", name: "Prepared By", nameDE: "Vorbereitet Von", shape: "rectangular", sortOrder: 1209, searchTerms: "prepared by utility", stateJson: makeRect("PREPARED BY", "Name:", "Date:") },
  { slug: "util-reviewed-by", category: "Utility", name: "Reviewed By", nameDE: "Geprüft Von", shape: "rectangular", sortOrder: 1210, searchTerms: "reviewed by utility", stateJson: makeRect("REVIEWED BY", "Name:", "Date:") },
  { slug: "util-authorized-by", category: "Utility", name: "Authorized By", nameDE: "Autorisiert Von", shape: "rectangular", sortOrder: 1211, searchTerms: "authorized by utility", stateJson: makeRect("AUTHORIZED BY", "Name:", "Date:") },
  { slug: "util-copy-no", category: "Utility", name: "Copy Number", nameDE: "Kopienummer", shape: "rectangular", sortOrder: 1212, searchTerms: "copy number utility", stateJson: makeRect("COPY NO.", "of") },
  { slug: "util-page-no", category: "Utility", name: "Page Number", nameDE: "Seitennummer", shape: "rectangular", sortOrder: 1213, searchTerms: "page number utility", stateJson: makeRect("PAGE", "of") },
  { slug: "util-ref-no", category: "Utility", name: "Reference Number", nameDE: "Referenznummer", shape: "rectangular", sortOrder: 1214, searchTerms: "reference number utility", stateJson: makeRect("REF NO.", "Date:") },
  { slug: "util-blank-round", category: "Utility", name: "Blank Round", nameDE: "Leer Rund", shape: "round", sortOrder: 1215, searchTerms: "blank round starter template", stateJson: makeRound("YOUR TEXT", "SUBTITLE") },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOM / MINIMAL (16 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  { slug: "min-round-1", category: "Custom", name: "Minimal Round", nameDE: "Minimal Rund", shape: "round", sortOrder: 1300, searchTerms: "minimal round starter custom", stateJson: makeRound("YOUR NAME", "OFFICIAL") },
  { slug: "min-rect-1", category: "Custom", name: "Minimal Rectangular", nameDE: "Minimal Rechteckig", shape: "rectangular", sortOrder: 1301, searchTerms: "minimal rectangular starter custom", stateJson: makeRect("YOUR TITLE", "Line 2") },
  { slug: "min-oval-1", category: "Custom", name: "Minimal Oval", nameDE: "Minimal Oval", shape: "oval", sortOrder: 1302, searchTerms: "minimal oval starter custom", stateJson: makeOval("YOUR NAME", "OFFICIAL") },
  { slug: "min-triangle-1", category: "Custom", name: "Minimal Triangle", nameDE: "Minimal Dreieck", shape: "triangular", sortOrder: 1303, searchTerms: "minimal triangle starter custom", stateJson: makeTriangle("YOUR TEXT", "SUBTITLE") },
  { slug: "min-round-2", category: "Custom", name: "Clean Round Seal", nameDE: "Sauberes Rundes Siegel", shape: "round", sortOrder: 1304, searchTerms: "clean round seal custom", stateJson: makeRound("SEAL", "OFFICIAL") },
  { slug: "min-round-3", category: "Custom", name: "Two Ring Seal", nameDE: "Doppelring Siegel", shape: "round", sortOrder: 1305, searchTerms: "two ring seal custom", stateJson: makeRoundWithSub("OUTER TEXT", "CENTER", "INNER", "#1a3a6b") },
  { slug: "min-rect-2", category: "Custom", name: "Three Line Stamp", nameDE: "Dreizeiliger Stempel", shape: "rectangular", sortOrder: 1306, searchTerms: "three line stamp custom", stateJson: makeRect("LINE ONE", "Line Two", "Line Three") },
  { slug: "min-round-4", category: "Custom", name: "Simple Round", nameDE: "Einfacher Runder Stempel", shape: "round", sortOrder: 1307, searchTerms: "simple round stamp custom", stateJson: makeRound("SIMPLE STAMP", "OFFICIAL") },
  { slug: "min-rect-3", category: "Custom", name: "Address Block", nameDE: "Adressblock", shape: "rectangular", sortOrder: 1308, searchTerms: "address block stamp custom", stateJson: makeRect("NAME", "Address", "City · Country") },
  { slug: "min-oval-2", category: "Custom", name: "Oval Minimal", nameDE: "Oval Minimal", shape: "oval", sortOrder: 1309, searchTerms: "oval minimal custom", stateJson: makeOval("YOUR TEXT", "STAMP") },
  { slug: "min-round-5", category: "Custom", name: "Bold Round", nameDE: "Fetter Runder Stempel", shape: "round", sortOrder: 1310, searchTerms: "bold round stamp custom", stateJson: makeRound("BOLD STAMP", "OFFICIAL") },
  { slug: "min-rect-4", category: "Custom", name: "Single Line", nameDE: "Einzeilig", shape: "rectangular", sortOrder: 1311, searchTerms: "single line stamp custom", stateJson: makeRect("YOUR TEXT HERE", "") },
  { slug: "min-round-6", category: "Custom", name: "Circular Text Only", nameDE: "Nur Kreistext", shape: "round", sortOrder: 1312, searchTerms: "circular text only custom", stateJson: makeRound("YOUR CIRCULAR TEXT", "CENTER") },
  { slug: "min-round-7", category: "Custom", name: "Starter Template", nameDE: "Startvorlage", shape: "round", sortOrder: 1313, searchTerms: "starter template custom blank", stateJson: makeRound("YOUR COMPANY", "YOUR TEXT") },
  { slug: "min-rect-5", category: "Custom", name: "Blank Rectangular", nameDE: "Leer Rechteckig", shape: "rectangular", sortOrder: 1314, searchTerms: "blank rectangular starter custom", stateJson: makeRect("TITLE", "Subtitle") },
  { slug: "min-oval-3", category: "Custom", name: "Starter Oval", nameDE: "Start Oval", shape: "oval", sortOrder: 1315, searchTerms: "starter oval custom blank", stateJson: makeOval("YOUR TEXT", "OFFICIAL") },
];

// ─── Seed function ─────────────────────────────────────────────────────────────
async function seed() {
  console.log(`[Seed] Starting template seed — ${TEMPLATES.length} templates`);
  let inserted = 0;
  let skipped = 0;

  for (const t of TEMPLATES) {
    // Idempotency: check by slug
    const existing = await db.select().from(templates).where(eq(templates.slug as any, t.slug)).limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(templates).values({
      category: t.category,
      name: t.name,
      nameDE: t.nameDE,
      slug: t.slug,
      shape: t.shape,
      stateJson: t.stateJson,
      sortOrder: t.sortOrder,
      searchTerms: t.searchTerms,
      isActive: true,
    } as any);
    inserted++;
  }

  console.log(`[Seed] Done — inserted: ${inserted}, skipped (already exists): ${skipped}`);
  console.log(`[Seed] Total templates in catalogue: ${TEMPLATES.length}`);

  // Count by category
  const cats: Record<string, number> = {};
  for (const t of TEMPLATES) {
    cats[t.category] = (cats[t.category] || 0) + 1;
  }
  console.log("[Seed] Category breakdown:");
  for (const [cat, count] of Object.entries(cats).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  // Count by shape
  const shapes: Record<string, number> = {};
  for (const t of TEMPLATES) {
    shapes[t.shape] = (shapes[t.shape] || 0) + 1;
  }
  console.log("[Seed] Shape breakdown:");
  for (const [shape, count] of Object.entries(shapes).sort()) {
    console.log(`  ${shape}: ${count}`);
  }

  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
