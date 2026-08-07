import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stamp } from "lucide-react";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "January 1, 2024",
    content: `
## 1. Information We Collect

Stampelo collects only the minimum information necessary to provide our stamp design and download service. We collect your email address when you make a purchase, which is used solely to deliver your download link. We do not require account creation to use the service.

## 2. Payment Information

All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor. Stampelo never stores, processes, or has access to your credit card details. Stripe's privacy policy governs the handling of your payment information.

## 3. Cookies

We use essential cookies for session management and authentication. We use analytics cookies (Umami) to understand aggregate usage patterns. No personally identifiable information is included in analytics data.

## 4. Data Retention

Your stamp designs are stored on our servers for a minimum of 12 months to allow repeat downloads. You may request deletion of your data at any time by contacting support@stampelo.com.

## 5. Third-Party Services

We use the following third-party services: Stripe (payments), Resend (email delivery), and AWS S3 (file storage). Each service has its own privacy policy.

## 6. Contact

For privacy-related inquiries, contact: support@stampelo.com
    `,
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "January 1, 2024",
    content: `
## 1. Acceptance of Terms

By using Stampelo, you agree to these Terms of Service. If you do not agree, please do not use our service.

## 2. Service Description

Stampelo provides an online stamp design tool that allows users to create, preview, and download custom stamp designs in various digital formats (PNG, SVG, PDF, DOCX).

## 3. Intellectual Property

You retain full ownership of the stamp designs you create. By using our service, you grant Stampelo a limited license to store and process your designs solely for the purpose of providing the service.

## 4. Acceptable Use

You may not use Stampelo to create stamps that impersonate official government seals, notary seals, or other regulated official marks. You are solely responsible for ensuring your stamp designs comply with applicable laws.

## 5. Payment and Refunds

Payments are processed securely via Stripe. Due to the digital nature of our products, all sales are final once the download link has been generated. Please see our Refund Policy for exceptions.

## 6. Limitation of Liability

Stampelo is provided "as is" without warranty of any kind. Our liability is limited to the amount paid for the specific transaction giving rise to the claim.

## 7. Changes to Terms

We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of the updated terms.
    `,
  },
  refund: {
    title: "Refund Policy",
    lastUpdated: "January 1, 2024",
    content: `
## Our Refund Policy

Due to the digital nature of our products, all sales are generally final once the download link has been generated and delivered. However, we are committed to customer satisfaction.

## When We Issue Refunds

We will issue a full refund in the following circumstances:

- The download link was not delivered within 24 hours of payment
- The downloaded files are corrupted or unusable
- A technical error on our part prevented you from receiving the correct files
- You were charged more than once for the same order

## How to Request a Refund

To request a refund, contact us at support@stampelo.com within 7 days of your purchase. Please include your order ID and a description of the issue. We aim to respond within 24 hours.

## Processing Time

Approved refunds are processed within 5-10 business days and will be returned to your original payment method.
    `,
  },
};

export default function Legal() {
  const [, params] = useRoute("/privacy") || useRoute("/terms") || useRoute("/refund") || [false, {}];
  const path = window.location.pathname.replace("/", "") as keyof typeof LEGAL_CONTENT;
  const page = LEGAL_CONTENT[path] ?? LEGAL_CONTENT.privacy;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-[#1a3a6b]" />
          <span className="font-bold text-[#1a3a6b]">Stampelo</span>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{page.title}</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {page.lastUpdated}</p>
        <div className="prose prose-slate max-w-none">
          {page.content.split("\n\n").map((block, i) => {
            if (block.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-semibold text-slate-900 mt-8 mb-3">{block.replace("## ", "")}</h2>;
            }
            if (block.startsWith("# ")) {
              return <h1 key={i} className="text-2xl font-bold text-slate-900 mt-8 mb-3">{block.replace("# ", "")}</h1>;
            }
            if (block.startsWith("- ")) {
              return <ul key={i} className="list-disc pl-6 space-y-1 text-slate-700">{block.split("\n").map((li, j) => <li key={j}>{li.replace("- ", "")}</li>)}</ul>;
            }
            return <p key={i} className="text-slate-700 leading-relaxed mb-4">{block}</p>;
          })}
        </div>
      </div>
    </div>
  );
}

