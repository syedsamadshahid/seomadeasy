"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const FAQ_ITEMS = [
  {
    q: "Can I change plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time from your account settings. If you upgrade, the new features will be available immediately. If you downgrade, your current plan remains active until the end of the billing cycle.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "We keep your data stored securely for 30 days after cancellation. You can export all your reports, keyword data, and auditor history as CSV or PDF files before your subscription ends.",
  },
  {
    q: "Do you offer a free trial of the Pro plan?",
    a: "Yes, we offer a 14-day free trial for both our Pro and Agency plans. No credit card is required to start your trial and experience the full power of Vantage AI.",
  },
  {
    q: "How does the AI visibility check work?",
    a: "We run real-time queries against ChatGPT, Perplexity, Gemini, and Google AIO using industry-specific prompts to check if your brand is mentioned, cited, and recommended.",
  },
  {
    q: "Do you support US sales tax handling?",
    a: "Yes. Vantage uses Stripe Tax to automatically handle US sales tax calculation, invoice generation, and tax filing compliance.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isAnnual = billingCycle === "annual";

  // Calculate pricing based on cycle
  const proPrice = isAnnual ? 79 : 99;
  const agencyPrice = isAnnual ? 159 : 199;

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface antialiased">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 right-0 h-16 w-full bg-white border-b border-slate-200 z-40 flex justify-between items-center px-6 md:px-12">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-on-surface">Vantage</Link>
          <span className="bg-primary-light text-primary text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">UPGRADE</span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link className="text-text-secondary hover:text-primary transition-colors" href="/#features">Features</Link>
            <span className="text-primary font-bold border-b-2 border-primary pb-1">Pricing</span>
            <Link className="text-text-secondary hover:text-primary transition-colors" href="/#faq">About</Link>
          </nav>
          <Link
            href="/login"
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-on-surface">
            Scale your visibility with AI
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto mb-10 text-base md:text-lg">
            Precise SEO tools and AI-driven insights designed for modern businesses. Choose the plan that fits your growth trajectory.
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? "text-on-surface" : "text-text-secondary"}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(isAnnual ? "monthly" : "annual")}
              className="relative w-14 h-7 bg-slate-200 rounded-full p-1 transition-colors duration-200 focus:outline-none"
            >
              <div
                className={`w-5 h-5 bg-primary rounded-full transition-transform duration-200 ${
                  isAnnual ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isAnnual ? "text-on-surface" : "text-text-secondary"}`}>Annual</span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold border border-emerald-200 animate-pulse">
                SAVE 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
          {/* Free Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-secondary mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-on-surface">$0</span>
                <span className="text-text-secondary text-sm">/mo</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-8">Essential tools for individuals and side projects.</p>
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>1 Active Website</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>2 audits/mo · 50 pages/mo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>10 Keywords Tracked</span>
              </li>
              <li className="flex items-start gap-3 opacity-40">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">cancel</span>
                <span>AI Visibility (ChatGPT/Gemini/etc)</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="w-full py-3 px-4 border border-slate-200 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors text-center"
            >
              Start for free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white border-2 border-primary rounded-xl p-8 shadow-md flex flex-col relative md:scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] px-4 py-1 rounded-full font-bold tracking-wider">
              MOST POPULAR
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-primary mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-on-surface">${proPrice}</span>
                <span className="text-text-secondary text-sm">/mo</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-8">The complete visibility suite for growing businesses.</p>
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>3 Websites</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>Unlimited audits · 3,000 pages/mo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>400 Keywords Tracked</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>3 AI Engines checked</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>Weekly GEO re-checks</span>
              </li>
            </ul>
            <Link
              href={`/signup?plan=pro&cycle=${billingCycle}`}
              className="w-full py-3 px-4 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:opacity-90 transition-all active:scale-95 text-center shadow-md"
            >
              Start Pro Trial
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-secondary mb-2">Agency</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-on-surface">${agencyPrice}</span>
                <span className="text-text-secondary text-sm">/mo</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-8">Whitelabel reports and multi-tenant management.</p>
            <ul className="space-y-4 mb-10 flex-grow text-sm">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>15 Websites</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>Unlimited audits · 40,000 pages/mo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>1,300 Keywords Tracked</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>All 4 AI Engines + Claude Sonnet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>Competitor Tracking &amp; Weekly Audits</span>
              </li>
            </ul>
            <Link
              href={`/signup?plan=agency&cycle=${billingCycle}`}
              className="w-full py-3 px-4 border border-slate-200 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors text-center"
            >
              Start Agency Trial
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-24 overflow-x-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-on-surface">Full feature comparison</h2>
            <p className="text-text-secondary text-sm mt-1">Everything you need to master your search presence.</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-6 px-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Feature</th>
                <th className="text-center py-6 px-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Free</th>
                <th className="text-center py-6 px-4 text-xs font-bold text-text-secondary uppercase tracking-widest bg-primary-light/30">Pro</th>
                <th className="text-center py-6 px-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Agency</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">Websites Limit</td>
                <td className="text-center py-5 px-4 text-text-secondary">1</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">3</td>
                <td className="text-center py-5 px-4">15</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">Full Audits / Month</td>
                <td className="text-center py-5 px-4 text-text-secondary">2</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">Unlimited</td>
                <td className="text-center py-5 px-4">Unlimited</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">Pages Crawled / Month</td>
                <td className="text-center py-5 px-4 text-text-secondary">50</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">3,000</td>
                <td className="text-center py-5 px-4">40,000</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">Keywords Tracked</td>
                <td className="text-center py-5 px-4 text-text-secondary">10</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">400</td>
                <td className="text-center py-5 px-4">1,300</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">AI Visibility Engines</td>
                <td className="text-center py-5 px-4 text-text-secondary">1 (Gemini)</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">3 (Gemini, Perplexity, GPT)</td>
                <td className="text-center py-5 px-4">All 4 (+ Google AIO)</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">GEO Re-checks</td>
                <td className="text-center py-5 px-4 text-text-secondary">—</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">Weekly</td>
                <td className="text-center py-5 px-4">Weekly</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">Competitor Tracking</td>
                <td className="text-center py-5 px-4 text-text-secondary">—</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 text-text-secondary">—</td>
                <td className="text-center py-5 px-4 font-semibold text-emerald-600">Included</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-5 px-4 font-medium text-on-surface">Whitelabeling &amp; custom color</td>
                <td className="text-center py-5 px-4 text-text-secondary">—</td>
                <td className="text-center py-5 px-4 bg-primary-light/30 font-semibold text-primary">PDF Logo</td>
                <td className="text-center py-5 px-4">Full PDF + Custom Hex</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FAQ Accordion */}
        <section className="max-w-3xl mx-auto mb-24">
          <h2 className="text-2xl font-bold text-on-surface mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                  >
                    <span className="font-semibold text-on-surface text-sm md:text-base">{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-text-secondary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-48 border-t border-slate-100" : "max-h-0"
                    }`}
                  >
                    <div className="p-5 text-sm text-text-secondary leading-relaxed bg-slate-50/40">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary rounded-2xl p-12 text-center text-on-primary relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-20 -mb-20 blur-3xl"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 relative z-10 tracking-tight">Ready to dominate your market?</h2>
          <p className="text-sm md:text-base mb-10 opacity-90 max-w-xl mx-auto relative z-10">
            Join over 12,000 businesses using Vantage to drive search growth and improve technical performance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/signup"
              className="bg-white text-primary px-8 py-3 rounded-lg font-bold shadow-xl hover:bg-slate-50 transition-colors active:scale-95 text-center text-sm"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/#features"
              className="bg-primary-container text-on-primary-container px-8 py-3 rounded-lg font-bold border border-white/20 hover:bg-white/10 transition-colors text-center text-sm"
            >
              Learn More
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 gap-4 max-w-7xl mx-auto text-xs text-text-secondary uppercase tracking-widest font-semibold">
          <span>© {new Date().getFullYear()} VANTAGE. ALL RIGHTS RESERVED.</span>
          <div className="flex items-center gap-8 normal-case font-medium">
            <Link className="hover:text-primary transition-colors" href="/#features">Features</Link>
            <Link className="hover:text-primary transition-colors" href="/pricing">Pricing</Link>
            <Link className="hover:text-primary transition-colors" href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
