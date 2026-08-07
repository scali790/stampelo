import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useT } from "@/i18n";
import { useEditorStore } from "@/editor/store";
import {
  Circle, Square, Layers, Type, Image, Sparkles, FileDown,
  FileText, Zap, Globe, Check, Star, ChevronRight, Stamp,
  Users, Shield, Menu, X
} from "lucide-react";
import { useState } from "react";

const FEATURE_ICONS = [Circle, Layers, Image, Type, Sparkles, FileDown, FileText, Zap];

export default function Home() {
  const t = useT();
  const { isAuthenticated, logout } = useAuth();
  const { locale, setLocale } = useEditorStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a3a6b] rounded-lg flex items-center justify-center">
                <Stamp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-[#1a3a6b]">Stampelo</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/editor" className="text-sm text-slate-600 hover:text-[#1a3a6b] transition-colors">{t.nav.editor}</Link>
              <Link href="/pdf-editor" className="text-sm text-slate-600 hover:text-[#1a3a6b] transition-colors">{t.nav.pdfEditor}</Link>
              <a href="#pricing" className="text-sm text-slate-600 hover:text-[#1a3a6b] transition-colors">{t.nav.pricing}</a>
              <button
                className="text-xs border rounded px-2 py-1 text-slate-500 hover:bg-slate-50"
                onClick={() => setLocale(locale === "en" ? "de" : "en")}
              >
                {locale === "en" ? "🇩🇪 DE" : "🇬🇧 EN"}
              </button>
              {isAuthenticated ? (
                <>
                  <Link href="/account" className="text-sm text-slate-600 hover:text-[#1a3a6b]">{t.nav.account}</Link>
                  <Button size="sm" variant="outline" onClick={() => logout()}>{t.nav.signOut}</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startLogin()}>{t.nav.signIn}</Button>
              )}
              <Link href="/editor">
                <Button size="sm" className="bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white">{t.nav.editor}</Button>
              </Link>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
            <Link href="/editor" className="block py-2 text-sm">{t.nav.editor}</Link>
            <Link href="/pdf-editor" className="block py-2 text-sm">{t.nav.pdfEditor}</Link>
            <Link href="/account" className="block py-2 text-sm">{t.nav.account}</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-[#1a3a6b]/10 text-[#1a3a6b] border-[#1a3a6b]/20 hover:bg-[#1a3a6b]/10">
              {t.hero.badge}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
              {t.hero.title}{" "}
              <span className="text-[#1a3a6b]">{t.hero.titleHighlight}</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/editor">
                <Button size="lg" className="bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white px-8 gap-2 text-base h-12">
                  {t.hero.cta} <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="px-8 text-base h-12 border-[#1a3a6b]/30 text-[#1a3a6b]">
                  {t.hero.ctaSecondary}
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4" /> {t.hero.trustBadge}
            </p>
          </div>

          {/* Sample stamps */}
          <div className="mt-16 flex justify-center gap-6 flex-wrap">
            {[
              { shape: "round" as const, label: "Round Seal" },
              { shape: "rect" as const, label: "Rectangular" },
              { shape: "oval" as const, label: "Oval Stamp" },
            ].map((s) => (
              <div key={s.shape} className="flex flex-col items-center gap-2">
                <div className="w-28 h-28 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center p-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {s.shape === "round" && <>
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#1a3a6b" strokeWidth="3"/>
                      <circle cx="50" cy="50" r="36" fill="none" stroke="#1a3a6b" strokeWidth="1.5"/>
                      <text x="50" y="54" textAnchor="middle" fill="#1a3a6b" fontSize="10" fontWeight="bold">COMPANY</text>
                      <path id="tp1" d="M 6,50 A 44,44 0 0,1 94,50" fill="none"/>
                      <text fill="#1a3a6b" fontSize="7"><textPath href="#tp1" startOffset="50%" textAnchor="middle">YOUR COMPANY NAME</textPath></text>
                    </>}
                    {s.shape === "rect" && <>
                      <rect x="5" y="20" width="90" height="60" rx="3" fill="none" stroke="#1a3a6b" strokeWidth="3"/>
                      <rect x="10" y="25" width="80" height="50" rx="2" fill="none" stroke="#1a3a6b" strokeWidth="1"/>
                      <text x="50" y="52" textAnchor="middle" fill="#1a3a6b" fontSize="10" fontWeight="bold">APPROVED</text>
                      <text x="50" y="64" textAnchor="middle" fill="#1a3a6b" fontSize="7">AUTHORIZED</text>
                    </>}
                    {s.shape === "oval" && <>
                      <ellipse cx="50" cy="50" rx="44" ry="34" fill="none" stroke="#1a3a6b" strokeWidth="3"/>
                      <ellipse cx="50" cy="50" rx="37" ry="27" fill="none" stroke="#1a3a6b" strokeWidth="1.5"/>
                      <text x="50" y="54" textAnchor="middle" fill="#1a3a6b" fontSize="9" fontWeight="bold">CERTIFIED</text>
                    </>}
                  </svg>
                </div>
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">{t.features.title}</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.items.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] ?? Zap;
              return (
                <Card key={i} className="border-slate-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-[#1a3a6b]/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#1a3a6b]" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">{t.pricing.title}</h2>
            <p className="text-xl text-slate-600">{t.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {t.pricing.plans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all hover:shadow-lg ${
                  (plan as any).popular ? "border-[#1a3a6b] shadow-md" : "border-slate-100"
                }`}
              >
                {(plan as any).popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#1a3a6b] text-white text-xs px-3">Most Popular</Badge>
                  </div>
                )}
                <div className="font-bold text-sm text-slate-500 mb-1">{plan.name}</div>
                <div className="text-3xl font-bold text-[#1a3a6b] mb-4">{plan.price}</div>
                <div className="space-y-2 mb-6">
                  {plan.formats.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                <Link href="/editor">
                  <Button
                    className={`w-full ${(plan as any).popular ? "bg-[#1a3a6b] text-white hover:bg-[#1a3a6b]/90" : ""}`}
                    variant={(plan as any).popular ? "default" : "outline"}
                    size="sm"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">{t.pricing.included}</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">{t.testimonials.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.testimonials.items.map((item, i) => (
              <Card key={i} className="border-slate-100">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed italic">"{item.text}"</p>
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">{item.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">{t.faq.title}</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {t.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-lg border border-slate-100 px-4">
                <AccordionTrigger className="text-left font-medium text-slate-900 hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-4 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#1a3a6b] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">{t.cta.title}</h2>
          <p className="text-xl text-blue-100 mb-10">{t.cta.subtitle}</p>
          <Link href="/editor">
            <Button size="lg" className="bg-white text-[#1a3a6b] hover:bg-white/90 px-10 text-base h-12 font-semibold">
              {t.cta.button} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                  <Stamp className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white">Stampelo</span>
              </div>
              <p className="text-sm">{t.footer.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">{t.footer.links.product}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/editor" className="hover:text-white transition-colors">{t.footer.links.editor}</Link></li>
                <li><Link href="/pdf-editor" className="hover:text-white transition-colors">{t.footer.links.pdfEditor}</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t.footer.links.pricing}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">{t.footer.links.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t.footer.links.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{t.footer.links.terms}</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">{t.footer.links.refund}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">{t.footer.links.support}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@stampelo.com" className="hover:text-white transition-colors">{t.footer.links.contact}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{t.footer.links.faq}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">{t.footer.copyright}</p>
            <div className="flex items-center gap-4 text-sm">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
              <span>·</span>
              <span>Stripe Payments</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
