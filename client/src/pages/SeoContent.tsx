import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stamp, ArrowRight, Check, FileText, Layers } from "lucide-react";

const formats = [
  ["PNG", "Raster image with transparent background, suitable for documents, websites and everyday digital use."],
  ["SVG", "Scalable vector format that stays sharp at any size and is useful for design and print workflows."],
  ["EPS", "Vector export for professional design and print workflows that support EPS files."],
  ["PDF", "Print-ready document format for sharing or placing the stamp in document workflows."],
  ["DOCX", "Microsoft Word document output for workflows that need the stamp inside a Word file."],
];

const categories = [
  { href: "/templates/business-stamps", title: "Business stamps", desc: "Company names, addresses, approval and administrative stamp layouts." },
  { href: "/templates/notary-stamps", title: "Notary stamps", desc: "Formal seal-style layouts for notarial and professional document workflows." },
  { href: "/templates/medical-stamps", title: "Medical stamps", desc: "Practice, doctor and healthcare administration layouts." },
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-[#1a3a6b]"><Stamp className="h-5 w-5" /> Stampelo</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/templates" className="text-slate-600 hover:text-[#1a3a6b]">Templates</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-[#1a3a6b]">Pricing</Link>
            <Link href="/faq" className="text-slate-600 hover:text-[#1a3a6b]">FAQ</Link>
            <Link href="/editor"><Button size="sm">Create stamp</Button></Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-20 border-t bg-slate-950 py-10 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          <div><div className="font-semibold text-white">Stampelo</div><p className="mt-2 text-sm">Online digital stamp and seal creator.</p></div>
          <div className="text-sm"><Link href="/about">About</Link><br/><Link href="/templates">Templates</Link><br/><Link href="/pricing">Pricing</Link></div>
          <div className="text-sm"><Link href="/guides/what-is-a-digital-stamp">Digital stamp guide</Link><br/><Link href="/guides/how-to-add-a-stamp-to-a-pdf">PDF stamping guide</Link><br/><Link href="/faq">FAQ</Link></div>
        </div>
      </footer>
    </div>
  );
}

function Hero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return <section className="bg-slate-50 py-16"><div className="mx-auto max-w-4xl px-4"><p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1a3a6b]">{eyebrow}</p><h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p></div></section>;
}

function CTA({ label = "Create a stamp" }: { label?: string }) {
  return <div className="mt-8"><Link href="/editor"><Button className="gap-2">{label}<ArrowRight className="h-4 w-4" /></Button></Link></div>;
}

function ExampleStamp({ label }: { label: string }) {
  return <div className="flex h-44 items-center justify-center rounded-xl border bg-white"><svg viewBox="0 0 180 120" className="h-32 w-44" aria-label={`${label} example preview`}><rect x="18" y="20" width="144" height="80" rx="8" fill="none" stroke="#1a3a6b" strokeWidth="4"/><rect x="25" y="27" width="130" height="66" rx="5" fill="none" stroke="#1a3a6b" strokeWidth="2"/><text x="90" y="58" textAnchor="middle" fill="#1a3a6b" fontSize="14" fontWeight="700">{label.toUpperCase()}</text><text x="90" y="77" textAnchor="middle" fill="#1a3a6b" fontSize="9">STAMP TEMPLATE</text></svg></div>;
}

export function AboutPage() {
  return <Shell><Hero eyebrow="About Stampelo" title="An online digital stamp and seal creator" intro="Stampelo is an online digital stamp and seal creator. It provides a browser-based editor with 300+ customizable templates, multiple stamp shapes, custom icon/SVG uploads, and export in PNG, SVG, EPS, PDF, and DOCX with transparent backgrounds — plus a built-in tool to apply stamps directly to PDF documents."/><main className="mx-auto max-w-4xl px-4 py-12"><h2 className="text-2xl font-bold">What Stampelo is for</h2><p className="mt-4 leading-7 text-slate-600">Stampelo is used by businesses, freelancers, notaries, administrators and other users who need a digital or print-ready company stamp without separate design software. The editor runs in a web browser and supports round, oval, rectangular and triangular stamp designs.</p><h2 className="mt-10 text-2xl font-bold">What Stampelo does not claim</h2><p className="mt-4 leading-7 text-slate-600">A digital stamp is a visual document element. Whether a stamp has legal or evidentiary effect depends on the document, organisation and jurisdiction. Stampelo does not replace a qualified electronic signature, notarisation or legal advice.</p><CTA /></main></Shell>;
}

export function PricingPage() {
  const plans = [
    ["PROMO", "CHF 2.50", "PNG"], ["ECONOM", "CHF 3.50", "SVG + PNG"], ["PREMIUM", "CHF 4.50", "PDF + SVG + PNG"], ["VIP WORD", "CHF 5.50", "DOCX + PDF + SVG + PNG"],
  ];
  return <Shell><Hero eyebrow="Pricing" title="One-time stamp downloads" intro="Choose the output package that matches the file formats you need. Prices are shown in Swiss francs and are paid per download package, not as a subscription."/><main className="mx-auto max-w-6xl px-4 py-12"><div className="grid gap-5 md:grid-cols-4">{plans.map(([name,price,files])=><Card key={name}><CardContent className="p-6"><p className="text-sm font-semibold text-slate-500">{name}</p><p className="mt-2 text-3xl font-bold text-[#1a3a6b]">{price}</p><p className="mt-4 text-sm text-slate-600">{files}</p><CTA label="Open editor" /></CardContent></Card>)}</div><h2 className="mt-14 text-2xl font-bold">Which format should you choose?</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{formats.map(([name,desc])=><div key={name} className="rounded-xl border p-5"><strong>{name}</strong><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></div>)}</div></main></Shell>;
}

export function TemplatesPage() {
  return <Shell><Hero eyebrow="Stamp templates" title="Browse stamp templates by use case" intro="Stampelo includes 300+ customizable templates inside the editor. Public template pages are grouped by real use case instead of publishing hundreds of thin pages for minor colour or font variations."/><main className="mx-auto max-w-6xl px-4 py-12"><div className="grid gap-6 md:grid-cols-3">{categories.map(c=><Link href={c.href} key={c.href}><Card className="h-full hover:shadow-md"><CardContent className="p-6"><ExampleStamp label={c.title.split(" ")[0]}/><h2 className="mt-5 text-xl font-bold">{c.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{c.desc}</p><p className="mt-4 text-sm font-medium text-[#1a3a6b]">View category →</p></CardContent></Card></Link>)}</div><div className="mt-12 rounded-2xl bg-slate-50 p-8"><h2 className="text-2xl font-bold">Need a different style?</h2><p className="mt-3 text-slate-600">Open the full in-app template library to browse the complete catalogue and customize a design.</p><CTA label="Browse all templates in editor" /></div></main></Shell>;
}

function CategoryPage({ title, intro, uses }: { title: string; intro: string; uses: string[] }) {
  return <Shell><Hero eyebrow="Template category" title={title} intro={intro}/><main className="mx-auto max-w-5xl px-4 py-12"><div className="grid gap-6 md:grid-cols-3">{uses.slice(0,3).map((u)=><Card key={u}><CardContent className="p-5"><ExampleStamp label={u}/><h2 className="mt-4 font-semibold">{u}</h2><p className="mt-2 text-sm text-slate-600">Use this layout as a starting point, then change text, icons, shape and styling in the Stampelo editor.</p></CardContent></Card>)}</div><h2 className="mt-12 text-2xl font-bold">Common uses</h2><ul className="mt-5 grid gap-3 md:grid-cols-2">{uses.map(u=><li key={u} className="flex gap-2 text-slate-700"><Check className="mt-1 h-4 w-4 text-green-600"/>{u}</li>)}</ul><p className="mt-8 leading-7 text-slate-600">Templates are design starting points. Users should verify any industry, regulatory or document requirements that apply to their own use case.</p><CTA label="Customize a template" /></main></Shell>;
}
export const BusinessStampsPage = () => <CategoryPage title="Business stamp templates" intro="Create a company or administrative stamp from a customizable business template. Typical layouts combine a business name with address, registration, approval or workflow text." uses={["Company name stamp","Approved stamp","Received stamp","Paid stamp","Invoice stamp","Address stamp"]}/>;
export const NotaryStampsPage = () => <CategoryPage title="Notary stamp templates" intro="Browse formal seal-style template layouts for notarial and professional document workflows. Template appearance does not itself confer notarial authority or legal validity." uses={["Notary seal layout","Certified copy layout","Document acknowledgement","Professional seal","Date and signature block","Official-style round seal"]}/>;
export const MedicalStampsPage = () => <CategoryPage title="Medical stamp templates" intro="Create practice and healthcare administration stamp designs for routine document workflows. Users remain responsible for professional and regulatory requirements that apply to medical records." uses={["Doctor name stamp","Medical practice stamp","Received document stamp","Reviewed stamp","Clinic address stamp","Administrative approval stamp"]}/>;

export function DigitalStampGuidePage() {
  return <Shell><Hero eyebrow="Guide" title="What is a digital stamp?" intro="A digital stamp is a visual stamp or seal graphic used in electronic documents. It can reproduce information normally shown in a physical rubber stamp, such as a company name, status, date, address or approval label."/><main className="mx-auto max-w-4xl px-4 py-12"><h2 className="text-2xl font-bold">Digital stamp vs. physical rubber stamp</h2><p className="mt-4 leading-7 text-slate-600">A physical stamp applies ink to paper. A digital stamp is an image or vector element placed in a digital document. The visual design can be similar, but the method of application and the technical file format are different.</p><h2 className="mt-10 text-2xl font-bold">Digital stamp vs. electronic signature</h2><p className="mt-4 leading-7 text-slate-600">A digital stamp should not automatically be treated as an electronic signature. Electronic-signature laws and trust services can require identity verification, certificates or other controls that a visual stamp image does not provide.</p><h2 className="mt-10 text-2xl font-bold">Common file formats</h2><div className="mt-5 space-y-4">{formats.map(([n,d])=><div key={n}><strong>{n}</strong><p className="text-slate-600">{d}</p></div>)}</div><h2 className="mt-10 text-2xl font-bold">How to create one</h2><ol className="mt-5 space-y-3 text-slate-700"><li>1. Choose a template or start from scratch.</li><li>2. Select the stamp shape and dimensions.</li><li>3. Add or edit text, icons and uploaded SVG artwork.</li><li>4. Preview the result and choose the needed export format.</li><li>5. Download the stamp or use it in a PDF workflow.</li></ol><CTA /></main></Shell>;
}

export function PdfGuidePage() {
  return <Shell><Hero eyebrow="Guide" title="How to add a stamp to a PDF" intro="Stampelo includes a PDF Stamp Editor for placing a digital stamp on an existing PDF document. The basic workflow is to create or select a stamp, upload the PDF, position the stamp, and export the resulting document."/><main className="mx-auto max-w-4xl px-4 py-12"><ol className="space-y-6">{[["1","Create or select your stamp","Use the Stampelo editor to prepare the stamp design you want to place on the document."],["2","Open the PDF Stamp Editor","Go to the PDF tool and upload the PDF document you want to stamp."],["3","Choose the page and position","Place the stamp on the required page and adjust its position, size or rotation as needed."],["4","Export the stamped PDF","Generate the resulting PDF and review it before using or sharing the document."]].map(([n,t,d])=><li key={n} className="flex gap-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a3a6b] font-bold text-white">{n}</span><div><h2 className="text-xl font-bold">{t}</h2><p className="mt-2 leading-7 text-slate-600">{d}</p></div></li>)}</ol><div className="mt-10 rounded-xl border p-6"><h2 className="font-bold">Important</h2><p className="mt-2 text-slate-600">Adding a visual stamp to a PDF does not automatically create a qualified electronic signature or make a document legally valid. Requirements depend on the document and jurisdiction.</p></div><div className="mt-8 flex gap-3"><Link href="/editor"><Button variant="outline">Create stamp</Button></Link><Link href="/pdf-editor"><Button>Open PDF Stamp Editor</Button></Link></div></main></Shell>;
}

export function FormatsGuidePage() {
  return <Shell><Hero eyebrow="Guide" title="PNG vs SVG vs EPS vs PDF vs DOCX for stamps" intro="The best stamp file format depends on where the stamp will be used. Raster formats are convenient for everyday documents; vector formats are better when the design must scale without losing sharpness."/><main className="mx-auto max-w-5xl px-4 py-12"><div className="overflow-x-auto"><table className="w-full border-collapse text-left"><thead><tr><th className="border p-3">Format</th><th className="border p-3">Best for</th><th className="border p-3">Key characteristic</th></tr></thead><tbody>{[["PNG","Documents, websites, presentations","Raster; supports transparent background"],["SVG","Web, design tools, scalable graphics","Vector; scales without pixelation"],["EPS","Professional print/design workflows","Vector; widely used in print tooling"],["PDF","Print and document exchange","Document container with consistent layout"],["DOCX","Microsoft Word workflows","Editable Word document container"]].map(r=><tr key={r[0]}>{r.map(c=><td className="border p-3" key={c}>{c}</td>)}</tr>)}</tbody></table></div><CTA /></main></Shell>;
}

export function CompanyRequirementsGuidePage() {
  return <Shell><Hero eyebrow="Guide" title="Company stamps: what information belongs on one?" intro="There is no single universal company-stamp layout. A practical business stamp usually includes only the information needed for its document workflow, while legal or regulatory requirements vary by jurisdiction and use case."/><main className="mx-auto max-w-4xl px-4 py-12"><h2 className="text-2xl font-bold">Common information</h2><ul className="mt-5 space-y-3 text-slate-700"><li>• Company or trading name</li><li>• Business address</li><li>• Registration or reference number when relevant</li><li>• Department or workflow label such as Approved, Paid or Received</li><li>• Date or signature space when needed</li></ul><h2 className="mt-10 text-2xl font-bold">Check local requirements</h2><p className="mt-4 leading-7 text-slate-600">Some countries, professions and document types have specific requirements for seals, signatures or company identification. A Stampelo template is a design aid, not a legal determination of what your organisation must use.</p><CTA /></main></Shell>;
}

export function FAQPage() {
  const qs = [
    ["What is Stampelo?","Stampelo is an online digital stamp and seal creator with a browser-based editor, 300+ customizable templates, multiple stamp shapes and export options including PNG, SVG, EPS, PDF and DOCX."],
    ["Do I need design software?","No. The editor runs in a web browser and is designed for users who want to create a stamp without separate graphics software."],
    ["Which stamp shapes are supported?","The editor supports round, oval, rectangular and triangular stamp designs."],
    ["Can I upload my own icon?","Yes. Stampelo supports custom SVG uploads in addition to its built-in icon library."],
    ["Can I stamp a PDF?","Yes. The PDF Stamp Editor lets you upload a PDF, position a Stampelo stamp and export a stamped document."],
    ["Is a digital stamp the same as an electronic signature?","No. A visual digital stamp is not automatically equivalent to an electronic signature, digital certificate or qualified electronic signature."],
    ["Are templates legally approved?","No such general claim is made. Templates are design starting points; users must check requirements that apply to their own industry, document and jurisdiction."],
  ];
  return <Shell><Hero eyebrow="FAQ" title="Frequently asked questions about Stampelo" intro="Concise answers about the editor, file formats, templates and PDF stamping."/><main className="mx-auto max-w-4xl px-4 py-12"><div className="space-y-6">{qs.map(([q,a])=><section key={q} className="rounded-xl border p-6"><h2 className="text-xl font-bold">{q}</h2><p className="mt-3 leading-7 text-slate-600">{a}</p></section>)}</div></main></Shell>;
}
