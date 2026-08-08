import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Legal from "./pages/Legal";
import PdfEditor from "./pages/PdfEditor";
import DownloadPage from "./pages/Download";
import Editor from "./pages/Editor";
import Home from "./pages/Home";
import {
  AboutPage, PricingPage, TemplatesPage, BusinessStampsPage, NotaryStampsPage,
  MedicalStampsPage, DigitalStampGuidePage, PdfGuidePage, FormatsGuidePage,
  CompanyRequirementsGuidePage, FAQPage,
} from "./pages/SeoContent";
import {
  StatusStampsPage, ApprovedStampPage, ReceivedStampPage, PaidStampPage,
  ConfidentialStampPage, DigitalVsRubberGuidePage, ShapeGuidePage,
  TransparentPngGuidePage,
} from "./pages/SeoExpansion";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/editor" component={Editor} />
      <Route path="/pdf-editor" component={PdfEditor} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/templates/business-stamps" component={BusinessStampsPage} />
      <Route path="/templates/notary-stamps" component={NotaryStampsPage} />
      <Route path="/templates/medical-stamps" component={MedicalStampsPage} />
      <Route path="/templates/status-stamps" component={StatusStampsPage} />
      <Route path="/templates/approved-stamp" component={ApprovedStampPage} />
      <Route path="/templates/received-stamp" component={ReceivedStampPage} />
      <Route path="/templates/paid-stamp" component={PaidStampPage} />
      <Route path="/templates/confidential-stamp" component={ConfidentialStampPage} />
      <Route path="/guides/what-is-a-digital-stamp" component={DigitalStampGuidePage} />
      <Route path="/guides/how-to-add-a-stamp-to-a-pdf" component={PdfGuidePage} />
      <Route path="/guides/png-vs-svg-vs-pdf-stamp" component={FormatsGuidePage} />
      <Route path="/guides/company-stamp-requirements" component={CompanyRequirementsGuidePage} />
      <Route path="/guides/digital-vs-rubber-stamp" component={DigitalVsRubberGuidePage} />
      <Route path="/guides/round-vs-rectangular-stamp" component={ShapeGuidePage} />
      <Route path="/guides/transparent-png-stamp" component={TransparentPngGuidePage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/download" component={DownloadPage} />
      <Route path="/account" component={Account} />
      <Route path="/privacy" component={Legal} />
      <Route path="/terms" component={Legal} />
      <Route path="/refund" component={Legal} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider><Toaster /><Router /></TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;
