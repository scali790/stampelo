# Parity Matrix (DEPRECATED)

This file is superseded by `PARITY_MATRIX_FINAL.md`.

See `PARITY_MATRIX_FINAL.md` for the current canonical feature parity matrix.

---

## 1. Stamp Shapes

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Round stamp | ✓ | ✓ | ✅ |
| Triangle stamp | ✓ | ✓ | ✅ |
| Rectangle stamp | ✓ | ✓ | ✅ |
| Oval stamp | — | ✓ | ✅ (extra) |
| Big/Small size toggle | ✓ | ⚠️ slider only | ⚠️ |

## 2. Element Types

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Text around circle (text-on-path, round) | ✓ | ✓ | ✅ |
| Text around triangle (text-on-path, triangle) | ✓ | ✓ | ✅ |
| Text around rectangle (text-on-path, rect) | ✓ | ✓ | ✅ |
| Text in centre (center text) | ✓ | ✓ | ✅ |
| Circle/Frame element | ✓ | ✓ | ✅ |
| Image/Figure element | ✓ | ✓ | ✅ |

## 3. Text-on-Path Properties

| Property | Reference label | Stampelo | Status |
|---|---|---|---|
| Font family | (font selector) | ✓ | ✅ |
| Font size | Size | ✓ | ✅ |
| Bold | Bold | ✓ | ✅ |
| Italic | Italic | ✓ | ✅ |
| Alignment (left/center/right) | (align) | ✓ | ✅ |
| Inverse (flip to inside) | (inverse) | ✓ | ✅ |
| Radius text | Radius text (t44) | ✓ | ✅ |
| Spacing | Spacing (t45) | ✓ | ✅ |
| Start point | Start point (t46) | ✓ | ✅ |
| Rotation | Rotation (t194) | ❌ | ❌ |
| Line break | Line break (t195) | ❌ | ❌ |
| Margin | Margin (t47/t48) | ❌ | ❌ |

## 4. Frame/Circle Properties

| Property | Reference label | Stampelo | Status |
|---|---|---|---|
| Radius | Radius (t49) | ✓ | ✅ |
| Stroke width | Stroke width (t50) | ✓ | ✅ |
| Line break gap | Line break (t195) | ❌ | ❌ |
| Triangle size | Triangle size (t51) | ❌ | ❌ |
| Triangle stroke width | Stroke width (t52) | ❌ | ❌ |
| Rectangle size | Rectangle size (t53) | ❌ | ❌ |
| Rectangle stroke width | Stroke width (t54) | ❌ | ❌ |

## 5. Center Text Properties

| Property | Reference label | Stampelo | Status |
|---|---|---|---|
| Horizontal position | Horizontal position (t55) | ✓ | ✅ |
| Vertical position | Vertical position (t56) | ✓ | ✅ |
| Size | Size (t57) | ✓ | ✅ |
| Font family | (font selector) | ✓ | ✅ |
| Bold/Italic | Bold/Italic | ✓ | ✅ |

## 6. Image/Figure Properties

| Property | Reference label | Stampelo | Status |
|---|---|---|---|
| Horizontal position | Horizontal position (t58) | ✓ | ✅ |
| Vertical position | Vertical position (t59) | ✓ | ✅ |
| Scale/Size | Size | ✓ | ✅ |
| Upload own SVG (max 50 KB) | Upload own (t85) | ✓ client-side | ⚠️ (server-side sanitisation missing) |

## 7. Icon/Graphics Library Categories

| Category | Reference | Stampelo | Status |
|---|---|---|---|
| All | ✓ | ✓ | ✅ |
| Architecture | ✓ (t172) | ❌ | ❌ |
| Business finance | ✓ (t173) | ⚠️ Business only | ⚠️ |
| Food, Drinks | ✓ (t174) | ❌ | ❌ |
| Medicine | ✓ (t175) | ✓ | ✅ |
| Science, Studies | ✓ (t176) | ❌ | ❌ |
| Recreation, Entertainment | ✓ (t177) | ❌ | ❌ |
| Law, Economics | ✓ (t178) | ✓ Legal | ✅ |
| Religion | ✓ (t179) | ❌ | ❌ |
| Agriculture, Construction | ✓ (t180) | ⚠️ Agriculture only | ⚠️ |
| Communication | ✓ (t181) | ❌ | ❌ |
| Sport | ✓ (t182) | ⚠️ Sports only | ⚠️ |
| Engineering, Subjects | ✓ (t183) | ⚠️ Technology only | ⚠️ |
| Transport | ✓ (t184) | ✓ | ✅ |
| Tourism, Travels | ✓ (t185) | ✓ Travel | ✅ |
| Fauna | ✓ (t186) | ⚠️ Animals only | ⚠️ |
| Flora | ✓ (t187) | ❌ | ❌ |
| Elements of decoration | ✓ (t188) | ⚠️ Symbols only | ⚠️ |
| People | ✓ (t189) | ❌ | ❌ |
| Icon count | 200+ | ~20 | ❌ |

## 8. Template Library

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| India seals | ✓ | ❌ | ❌ |
| Company seals | ✓ | ❌ | ❌ |
| Design seals | ✓ | ❌ | ❌ |
| Custom stamps | ✓ | ❌ | ❌ |
| Bank stamps | ✓ | ❌ | ❌ |
| Medical stamps | ✓ | ❌ | ❌ |
| Business stamps | ✓ | ❌ | ❌ |
| Wedding stamps | ✓ | ❌ | ❌ |
| Justice stamps | ✓ | ❌ | ❌ |
| Notary stamps | ✓ | ❌ | ❌ |
| Library seal | ✓ | ❌ | ❌ |
| Government seal | ✓ | ❌ | ❌ |
| Corporate seal | ✓ | ❌ | ❌ |
| Stamp received | ✓ | ❌ | ❌ |
| School stamp | ✓ | ❌ | ❌ |
| Text stamp | ✓ | ❌ | ❌ |
| Date stamp | ✓ | ❌ | ❌ |
| Logo stamp | ✓ | ❌ | ❌ |
| Red stamp | ✓ | ❌ | ❌ |
| Square seal | ✓ | ❌ | ❌ |
| Rectangular stamp | ✓ | ❌ | ❌ |
| Triangular stamp | ✓ | ❌ | ❌ |
| Blank round stamp | ✓ | ❌ | ❌ |
| Template count | 300+ | 0 seeded | ❌ |
| Load template into editor | ✓ | ✓ (code ready) | ⚠️ |
| Search templates | ✓ | ✓ | ✅ |
| Category filter | ✓ | ✓ | ✅ |

## 9. Effects

| Effect | Reference | Stampelo | Status |
|---|---|---|---|
| Shabby/aged filter | ✓ | ✓ | ✅ |
| Gold metallic | ✓ | ⚠️ toggle exists, rendering incomplete | ⚠️ |
| Silver metallic | ✓ | ⚠️ toggle exists, rendering incomplete | ⚠️ |

## 10. Export & Download

| Format | Reference | Stampelo | Status |
|---|---|---|---|
| PNG (transparent, high-res) | ✓ | ✓ (Sharp) | ✅ |
| SVG | ✓ | ✓ | ✅ |
| EPS | ✓ | ⚠️ pseudo-EPS | ⚠️ |
| PDF | ✓ | ✓ (pdf-lib) | ✅ |
| DOCX | ✓ | ✓ (docx) | ✅ |
| Shabby version included free | ✓ | ❌ | ❌ |
| Download via email | ✓ | ✓ | ✅ |
| Secure signed URLs | ✓ | ✓ | ✅ |

## 11. Share & Save

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Send layout by email (t197) | ✓ | ⚠️ placeholder only | ⚠️ |
| Save design | ✓ | ✓ | ✅ |
| Share link | ✓ | ✓ | ✅ |
| Restore from share link | ✓ | ⚠️ URL param exists, restore logic incomplete | ⚠️ |

## 12. Multi-stamp Canvas

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Multiple stamps in one session | ✓ | ✓ | ✅ |
| Thumbnail list | ✓ | ✓ | ✅ |
| Add new stamp | ✓ | ✓ | ✅ |
| Delete stamp | ✓ | ❌ | ❌ |

## 13. PDF Editor

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| PDF upload | ✓ | ✓ | ✅ |
| Page rendering | ✓ | ✓ | ✅ |
| Stamp placement (drag) | ✓ | ✓ | ✅ |
| Scale stamp | ✓ | ✓ | ✅ |
| Rotate stamp | ✓ | ✓ | ✅ |
| Multi-page selection | ✓ | ✓ (nav) | ⚠️ |
| Server-side PDF merge | ✓ | ❌ | ❌ |
| Download stamped PDF | ✓ | ❌ | ❌ |

## 14. Payments

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Stripe checkout | ✓ | ✓ | ✅ |
| 4 pricing plans | ✓ | ✓ | ✅ |
| Webhook handling | ✓ | ✓ | ✅ |
| Idempotent fulfillment | ✓ | ✓ | ✅ |
| Email delivery | ✓ | ⚠️ Resend wired, domain not configured | ⚠️ |
| Repeat download | ✓ | ✓ | ✅ |

## 15. Admin Panel

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Order management | ✓ | ❌ | ❌ |
| Customer management | ✓ | ❌ | ❌ |
| Design management | ✓ | ❌ | ❌ |
| Template management | ✓ | ❌ | ❌ |
| Fulfillment failure review | ✓ | ❌ | ❌ |
| Export management | ✓ | ❌ | ❌ |

## 16. i18n

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| English | ✓ | ✓ | ✅ |
| German | — | ✓ | ✅ (extra) |
| Language switcher | ✓ | ✓ | ✅ |

## 17. Mobile

| Feature | Reference | Stampelo | Status |
|---|---|---|---|
| Responsive landing page | ✓ | ✓ | ✅ |
| Mobile editor usability | ✓ | ❌ not tested | ❌ |

---

## Summary of Material Gaps (Must Fix Before Production)

1. **Template catalogue** — 0 seeded templates (need 50+)
2. **Icon library** — ~20 icons (need 100+)
3. **PDF editor** — no server-side stamp merge / download
4. **Admin panel** — not built
5. **EPS export** — pseudo-EPS, not valid PostScript
6. **Text-on-path** — missing Rotation, Line break, Margin controls
7. **Frame element** — missing Line break, Triangle/Rectangle size+stroke controls
8. **Metallic effects** — toggle exists but rendering not applied to elements
9. **Share/restore** — email send is placeholder; URL restore logic incomplete
10. **Shabby free version** — not included in download flow
11. **Delete stamp** from multi-stamp canvas — missing
12. **Mobile editor** — not tested or optimised
