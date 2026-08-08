import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useEditorStore } from "@/editor/store";
import { Check, ChevronRight, FileText, Image, Layers, Menu, Shield, Sparkles, Stamp, Type, X } from "lucide-react";
import { useState } from "react";

const features = [
  ["300+ customizable templates", "Start from a business, professional or administrative stamp layout and customize it in the editor."],
  ["Four stamp shapes", "Create round, oval, rectangular and triangular stamp designs."],
  ["Icons and SVG uploads", "Use built-in icons or upload your own SVG artwork."],
  ["PNG, SVG, EPS, PDF and DOCX", "Choose the output format that fits your document, web or print workflow."],
  ["Transparent backgrounds", "Create digital stamp files that can be placed cleanly into documents and layouts."],
  ["PDF Stamp Editor", "Place a created stamp directly onto an uploaded PDF and export the resulting document."],
];

const steps = [
  ["1", "Choose a starting point", "Open a template or start a stamp from scratch."],
  ["2", "Customize the design", "Edit text, shape, dimensions, icons, uploaded SVG artwork and visual effects."],
  ["3", "Preview the stamp", "Review the result and make sure the content and layout match your use case."],
  ["4", "Choose a file format", "Select PNG, SVG, EPS, PDF or DOCX according to the download package you need."],
  ["5", "Download or stamp a PDF", "Use the exported file directly or continue into the PDF Stamp Editor."],
];

const facts = [
  ["What is Stampelo?", "Stampelo is an online digital stamp and seal creator. It provides a browser-based editor with 300+ customizable templates, multiple stamp shapes, custom icon/SVG uploads, and export in PNG, SVG, EPS, PDF, and DOCX with transparent backgrounds — plus a built-in tool to apply stamps directly to PDF documents."],
  ["Which stamp shapes are supported?", "Stampelo supports round, oval, rectangular and triangular stamp designs."],
  ["Which formats can Stampelo export?", "Depending on the selected download package, Stampelo supports PNG, SVG, EPS, PDF and DOCX output."],
  ["Can Stampelo add a stamp to a PDF?", "Yes. The PDF Stamp Editor lets you upload a PDF, position a Stampelo stamp on a page, adjust it and export the stamped document."],
  ["Is a digital stamp the same as an electronic signature?", "No. A visual digital stamp is not automatically equivalent to an electronic signature, digital certificate or qualified electronic signature. Requirements depend on the document and jurisdiction."],
];

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const { locale, setLocale } = useEditorStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-[#1a3a6b]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3a6b]"><Stamp className="h-4 w-4 text-white" /></span>Stampelo</Link>
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/templates" className="text-sm text-slate-600 hover:text-[#1a3a6b]">Templates</Link>
            <Link href="/pdf-editor" className="text-sm text-slate-600 hover:text-[#1a3a6b]">PDF Stamp</Link>
            <Link href="/pricing" className="text-sm text-slate-600 hover:text-[#1a3a6b]">Pricing</Link>
            <Link href="/guides/what-is-a-digital-stamp" className="text-sm text-slate-600 hover:text-[#1a3a6b]">Guides</Link>
            <button className="rounded border px-2 py-1 text-xs text-slate-500" onClick={() => setLocale(locale === "en" ? "de" : "en")}>{locale === "en" ? "DE" : "EN"}</button>
            {isAuthenticated ? <Button size="sm" variant="outline" onClick={() => logout()}>Sign out</Button> : <Button size="sm" variant="outline" onClick={() => startLogin()}>Sign in</Button>}
            <Link href="/editor"><Button size="sm">Create stamp</Button></Link>
          </div>
          <button className="md:hidden" aria-label="Open navigation" onClick={() => setMobileMenuOpen(v => !v)}>{mobileMenuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
        </div>
        {mobileMenuOpen && <div className="space-y-2 border-t px-4 py-4 md:hidden"><Link href="/templates" className="block">Templates</Link><Link href="/pdf-editor" className="block">PDF Stamp</Link><Link href="/pricing" className="block">Pricing</Link><Link href="/editor" className="block">Create stamp</Link></div>}
      </nav>

      <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1a3a6b]">Online digital stamp & seal creator</p>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Create a professional digital stamp online</h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-slate-600">Design a digital stamp or seal in your browser from 300+ customizable templates or from scratch. Export PNG, SVG, EPS, PDF or DOCX and place a stamp directly onto PDF documents.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/editor"><Button size="lg" className="gap-2">Create your stamp <ChevronRight className="h-4 w-4"/></Button></Link><Link href="/templates"><Button size="lg" variant="outline">Browse templates</Button></Link></div>
          <p className="mt-6 text-sm text-slate-500">No separate design software required. Browser-based editor.</p>
        </div>
      </section>

      <section className="py-20"><div className="mx-auto max-w-6xl px-4"><div className="text-center"><h2 className="text-3xl font-bold">What Stampelo provides</h2><p className="mt-3 text-slate-600">Concrete product capabilities, without inflated customer or rating claims.</p></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(([title,desc],i)=>{const icons=[Layers,Stamp,Image,FileText,Sparkles,FileText]; const Icon=icons[i] ?? Type; return <Card key={title}><CardContent className="p-6"><Icon className="h-6 w-6 text-[#1a3a6b]"/><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></CardContent></Card>})}</div></div></section>

      <section className="bg-slate-50 py-20"><div className="mx-auto max-w-5xl px-4"><div className="text-center"><h2 className="text-3xl font-bold">How it works</h2><p className="mt-3 text-slate-600">From template to usable file in five clear steps.</p></div><div className="mt-10 space-y-4">{steps.map(([n,title,desc])=><div key={n} className="flex gap-5 rounded-xl bg-white p-6 shadow-sm"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a3a6b] font-bold text-white">{n}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-slate-600">{desc}</p></div></div>)}</div></div></section>

      <section className="py-20"><div className="mx-auto max-w-5xl px-4"><div className="text-center"><h2 className="text-3xl font-bold">Stampelo facts</h2><p className="mt-3 text-slate-600">Short, extractable answers for users and answer engines.</p></div><div className="mt-10 space-y-5">{facts.map(([q,a])=><article key={q} className="rounded-xl border p-6"><h3 className="text-xl font-bold">{q}</h3><p className="mt-3 leading-7 text-slate-600">{a}</p></article>)}</div><div className="mt-8 flex flex-wrap gap-3"><Link href="/about"><Button variant="outline">About Stampelo</Button></Link><Link href="/faq"><Button variant="outline">Read FAQ</Button></Link><Link href="/guides/what-is-a-digital-stamp"><Button variant="outline">Digital stamp guide</Button></Link></div></div></section>

      <section className="bg-slate-50 py-20"><div className="mx-auto max-w-5xl px-4"><div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"><div><h2 className="text-3xl font-bold">Simple one-time pricing</h2><p className="mt-3 text-slate-600">Packages currently start at CHF 2.50 and differ by included output formats.</p></div><Link href="/pricing"><Button>See pricing</Button></Link></div><div className="mt-8 grid gap-4 md:grid-cols-4">{[["PROMO","CHF 2.50","PNG"],["ECONOM","CHF 3.50","SVG + PNG"],["PREMIUM","CHF 4.50","PDF + SVG + PNG"],["VIP WORD","CHF 5.50","DOCX + PDF + SVG + PNG"]].map(([name,price,files])=><Card key={name}><CardContent className="p-5"><p className="text-xs font-semibold text-slate-500">{name}</p><p className="mt-2 text-2xl font-bold text-[#1a3a6b]">{price}</p><p className="mt-3 text-sm text-slate-600">{files}</p></CardContent></Card>)}</div></div></section>

      <section className="bg-[#1a3a6b] py-16 text-white"><div className="mx-auto max-w-4xl px-4 text-center"><h2 className="text-3xl font-bold">Create a stamp or stamp a PDF</h2><p className="mx-auto mt-4 max-w-2xl text-blue-100">Use the stamp editor for the design, then continue into the PDF Stamp Editor if you need the stamp placed directly on a document.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/editor"><Button size="lg" className="bg-white text-[#1a3a6b] hover:bg-slate-100">Create stamp</Button></Link><Link href="/pdf-editor"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Stamp a PDF</Button></Link></div></div></section>

      <footer className="bg-slate-950 py-12 text-slate-300"><div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4"><div><div className="flex items-center gap-2 font-bold text-white"><Stamp className="h-4 w-4"/>Stampelo</div><p className="mt-3 text-sm">Online digital stamp and seal creator.</p></div><div className="text-sm"><h3 className="mb-2 font-semibold text-white">Product</h3><Link href="/editor">Stamp Editor</Link><br/><Link href="/pdf-editor">PDF Stamp Editor</Link><br/><Link href="/templates">Templates</Link><br/><Link href="/pricing">Pricing</Link></div><div className="text-sm"><h3 className="mb-2 font-semibold text-white">Learn</h3><Link href="/about">About</Link><br/><Link href="/guides/what-is-a-digital-stamp">What is a digital stamp?</Link><br/><Link href="/guides/how-to-add-a-stamp-to-a-pdf">How to stamp a PDF</Link><br/><Link href="/faq">FAQ</Link></div><div className="text-sm"><h3 className="mb-2 font-semibold text-white">Legal</h3><Link href="/privacy">Privacy</Link><br/><Link href="/terms">Terms</Link><br/><Link href="/refund">Refund policy</Link><p className="mt-4 flex items-center gap-2"><Shield className="h-4 w-4"/>Secure payments via Stripe</p></div></div></footer>
    </div>
  );
}
