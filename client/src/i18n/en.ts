export const en = {
  nav: {
    home: "Home",
    editor: "Create Stamp",
    pdfEditor: "PDF Stamp",
    account: "My Account",
    pricing: "Pricing",
    signIn: "Sign In",
    signOut: "Sign Out",
  },
  hero: {
    badge: "Professional Stamp Maker",
    title: "Design Custom Stamps",
    titleHighlight: "in Minutes",
    subtitle: "Create professional rubber stamps, corporate seals, and custom logos with our powerful online editor. Download in PNG, SVG, PDF, or DOCX format. Trusted by businesses across Switzerland and Europe.",
    cta: "Create Your Stamp — Free",
    ctaSecondary: "View Templates",
    trustBadge: "Trusted by businesses across Switzerland and Europe",
  },
  features: {
    title: "Everything You Need",
    subtitle: "A complete stamp design platform with professional-grade tools",
    items: [
      { title: "4 Stamp Shapes", desc: "Round, oval, rectangular, and triangular stamps for every use case." },
      { title: "300+ Templates", desc: "Start from a professional template and customise to your brand." },
      { title: "SVG Icon Library", desc: "200+ built-in icons across 18 categories, plus custom SVG upload." },
      { title: "Text on Path", desc: "Circular text that follows the stamp border perfectly." },
      { title: "Special Effects", desc: "Shabby aged, gold metallic, and silver metallic finish options." },
      { title: "All Formats", desc: "Download as PNG (600 DPI), SVG, EPS, PDF, or Word DOCX." },
      { title: "PDF Editor", desc: "Place your stamp on any existing PDF document." },
      { title: "Instant Delivery", desc: "Files sent to your email immediately after payment." },
    ],
  },
  pricing: {
    title: "Simple, Transparent Pricing",
    subtitle: "Pay once, download forever. No subscriptions.",
    plans: [
      { name: "PROMO", price: "CHF 2.50", formats: ["PNG"], desc: "High-quality PNG with transparent background" },
      { name: "ECONOM", price: "CHF 3.50", formats: ["SVG", "PNG"], desc: "Scalable vector + PNG" },
      { name: "PREMIUM", price: "CHF 4.50", formats: ["PDF", "SVG", "PNG"], desc: "PDF + SVG + PNG — print-ready", popular: true },
      { name: "VIP WORD", price: "CHF 5.50", formats: ["DOCX", "PDF", "SVG", "PNG"], desc: "Word document + all formats" },
    ],
    included: "All plans include: Transparent background · High resolution · Free Shabby version",
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      { q: "What file formats do I receive?", a: "Depending on your plan: PNG (600 DPI, transparent background), SVG (scalable vector), PDF (print-ready), and DOCX (Microsoft Word). All files have transparent backgrounds." },
      { q: "Can I edit my stamp after downloading?", a: "Your design is saved with a permanent share link. You can return to the editor at any time to make changes and purchase a new download." },
      { q: "Is my payment secure?", a: "Yes. All payments are processed by Stripe, a PCI-DSS Level 1 certified payment processor. We never store your card details." },
      { q: "How quickly will I receive my files?", a: "Your download link is generated immediately after payment confirmation and sent to your email within minutes." },
      { q: "Can I use the stamp for commercial purposes?", a: "Yes. All downloaded stamps are yours to use for personal and commercial purposes without restriction." },
      { q: "What is the Shabby effect?", a: "The Shabby effect adds an aged, worn appearance to your stamp — as if it has been used many times. It is included free with all paid plans." },
      { q: "Do I need to create an account?", a: "No account is required to create and download a stamp. Creating an account lets you save your designs and access your purchase history." },
      { q: "Can I place my stamp on a PDF document?", a: "Yes! Use our PDF Stamp Editor to upload any PDF, position your stamp on any page, and export the stamped document." },
    ],
  },
  testimonials: {
    title: "What Our Customers Say",
    items: [
      { name: "Sarah M.", role: "Small Business Owner", text: "Stampelo saved me hours. I created a professional stamp for my invoices in under 5 minutes. The quality is outstanding." },
      { name: "Dr. James K.", role: "Medical Practice", text: "The medical templates are exactly what I needed. Clean, professional, and the SVG format works perfectly with my documents." },
      { name: "Anna L.", role: "Notary Public", text: "I've tried many stamp makers. Stampelo is by far the best — the text-on-path feature is flawless and the export quality is superb." },
    ],
  },
  cta: {
    title: "Ready to Create Your Stamp?",
    subtitle: "Join thousands of businesses who trust Stampelo for their custom stamp needs.",
    button: "Start Designing — It's Free",
  },
  footer: {
    tagline: "Professional online stamp maker",
    links: {
      product: "Product",
      editor: "Stamp Editor",
      pdfEditor: "PDF Editor",
      templates: "Templates",
      pricing: "Pricing",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      refund: "Refund Policy",
      support: "Support",
      contact: "Contact Us",
      faq: "FAQ",
    },
    copyright: "© 2025 Stampelo. All rights reserved.",
  },
} as const;

// Use a deep partial/string type so German translations can use different string values
export type Translations = {
  nav: Record<string, string>;
  hero: Record<string, string>;
  features: { title: string; subtitle: string; items: Array<{ title: string; desc: string }> };
  pricing: { title: string; subtitle: string; plans: Array<{ name: string; price: string; formats: string[]; desc: string; popular?: boolean }>; included: string };
  faq: { title: string; items: Array<{ q: string; a: string }> };
  testimonials: { title: string; items: Array<{ name: string; role: string; text: string }> };
  cta: Record<string, string>;
  footer: { tagline: string; links: Record<string, string>; copyright: string };
};
