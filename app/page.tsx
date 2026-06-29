"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TRUSTED_LOGOS = [
  {
    name: "Nexus",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFLy-uVQfNDHsPjcFo0g2nJIQnXjoMnvLIdQdIQJxH8vCNKHd6nOExEJvsMjal7pjfkajdtNzcDvWmmIFqVrklYsysq5aL1_TMItfoqAGrFsZ7EOkgXhW78ZOlGbsfUlm1gPHeuWJ_3AXO20EAN5Z4yYyK58Ki-yOEZUWXHhjwHtZUB_2UxwtHFhKj6zQXHgwZB8IY6-VL7ONvIfKMb7V8KahsDmBl1fTq956e_v9l7Lot2D8ezGc6u0aJB0kXoA9LgCLgYviqDzzZ",
  },
  {
    name: "Velocity",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOmA6zsaxqlRbkQbAnVzWvS9W9GzUPmBg4XW8gt5XkKH2eupqbFeC1KS3jzXBhvf7GGRuUiObcdHtFZ8N7ZY26eIY5IbUW9_Lj6XLuzTcPtpqiRd2rY5lBOCWWVLwa9sM2tB96qqboF9Ho4hdFpnVAbhY4b_mR_DLUH0sc9PM3MvlpWnFPQESVJMUBJsd31eV9kga7qBJ1diCuLN2xIYWG4WOVhTE0nuRg6bcai0sISWOFBFkFHBgdXxOLrcwXuxL4LNxTIgWxtgVx",
  },
  {
    name: "Stratus",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuALX4MJGHvB7_GaqhqAKXw63eFY6k_hnVfqdmN_8G-icjMmFqT3FEMmCvpoctefEq6z0ZPduufwbA3LHOOmVzo2xtxlU3ZjuGlkhvQrTL74APm8PTLXJGG9OC6E-5F6z58Y63ELyVUlAuHPbXNXXEIcxJA5zRRBIyxnhswoXOfD-1GCrH5dJkD-Mti3sGiNqlaM9_-YbqUm3irGiBNbm2TVnAxPeaOiUDC-Y-Lbpz4Uvt9oAjif0cXtZzC8EWvVHu0WfZbgHSYZuKx4",
  },
  {
    name: "Quantum",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFi2hV00mW5JLSzgOaJ4WkTRXa5CEpuzAvyzXpp0IBZG-cNlxHcMBe6dx_R1-aeJ4YhuEXGdjQTfye3s1LBjJjk9evnR7GS13gVwGRo3ZudXUALezkSTuTiCclfos8h0xvpnYfAPEMDWmwaxLBijwYYKV7TIvtJn_3n2zSMOxlrsntY-ldp8ltpqfy5jfYbxz9n5nLOln16kYFWiH1X7vWv8rZyiRWvv4DpKbnxtAKtKtF_jszV6pPmokNNSTmuK15Ed9w1dB8QvGn",
  },
];

export default function Home() {
  const [domain, setDomain] = useState("");
  const router = useRouter();

  function handleFreeAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    router.push(`/dashboard?run=${encodeURIComponent(domain.trim())}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      {/* TopNavBar */}
      <header className="absolute top-0 w-full flex justify-between items-center px-6 md:px-12 py-4 max-w-7xl mx-auto z-50 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-on-surface">Vantage</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a className="text-text-secondary hover:text-primary transition-colors" href="#features">Features</a>
          <Link className="text-text-secondary hover:text-primary transition-colors" href="/pricing">Pricing</Link>
          <a className="text-text-secondary hover:text-primary transition-colors" href="#faq">FAQ</a>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-text-secondary hover:text-primary transition-colors font-medium">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-36 pb-20 px-6 md:px-12 overflow-hidden max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary border border-primary-fixed-dim/30 px-3 py-1 rounded-full mb-6">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-[11px] font-bold tracking-widest uppercase">New: AI Answer Engine Optimization</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight text-on-surface">
              See if AI knows <br /> <span className="text-primary">your business</span>
            </h1>
            <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              Vantage audits your SEO health and checks if ChatGPT, Perplexity, and Gemini are recommending you — or your competitors.
            </p>

            <form onSubmit={handleFreeAudit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 p-2 bg-white border border-slate-200 shadow-sm rounded-xl">
              <input
                className="flex-1 border-none focus:ring-0 text-sm px-4 py-3 bg-transparent outline-none"
                placeholder="Enter your domain (e.g. acme.com)"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap shadow-sm"
              >
                Run Free Audit
              </button>
            </form>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl text-left hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-primary mb-3 text-2xl">memory</span>
                <div className="text-lg font-bold mb-1">4 AI Engines Checked</div>
                <div className="text-sm text-text-secondary">ChatGPT, Claude, Gemini, and Perplexity index analysis.</div>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl text-left hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-primary mb-3 text-2xl">checklist</span>
                <div className="text-lg font-bold mb-1">140+ SEO Checks</div>
                <div className="text-sm text-text-secondary">Comprehensive technical and content performance audit.</div>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl text-left hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-primary mb-3 text-2xl">timer</span>
                <div className="text-lg font-bold mb-1">Results in 60 seconds</div>
                <div className="text-sm text-text-secondary">Instant report generation with actionable next steps.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-12 border-y border-slate-200 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 grayscale opacity-60">
            <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase whitespace-nowrap">Trusted by founders at —&gt;</span>
            <div className="flex flex-wrap justify-center items-center gap-12">
              {TRUSTED_LOGOS.map((logo) => (
                <img key={logo.name} className="h-6" alt={logo.name} src={logo.url} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Section */}
        <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Precision insights for the AI era</h2>
            <p className="text-text-secondary max-w-md mx-auto">The technical precision of a developer tool with small business simplicity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* SEO Audit Card */}
            <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-xl flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-slate-700">search_check</span>
                </div>
                <h3 className="text-lg font-bold mb-3">Comprehensive SEO Audit</h3>
                <p className="text-sm text-text-secondary leading-relaxed">Deep-crawl technology that identifies every technical blocker, from slow LCP to missing schema markup.</p>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-4">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-4/5 rounded-full"></div>
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-2">
                  <span>Audit completion</span>
                  <span>80%</span>
                </div>
              </div>
            </div>

            {/* AI Visibility Score Card */}
            <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-4 right-4 bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-cyan-200">New</div>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-primary border-t-slate-100 flex items-center justify-center mb-6 shadow-inner animate-spin-slow">
                  <span className="text-2xl font-bold text-slate-800">84</span>
                </div>
                <h3 className="text-lg font-bold mb-3">AI Visibility Score</h3>
                <p className="text-sm text-text-secondary">Proprietary index tracking how often LLMs cite your website as a source for user queries.</p>
              </div>
              <div className="mt-8 bg-slate-50 p-4 rounded-lg flex items-center justify-between text-sm">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Real-time Rank</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span> +12%
                </span>
              </div>
            </div>

            {/* Fix Recommendations Card */}
            <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-slate-700">auto_awesome</span>
                </div>
                <h3 className="text-lg font-bold mb-3">Fix Recommendations</h3>
                <p className="text-sm text-text-secondary leading-relaxed">Stop guessing. Get step-by-step instructions on how to improve your rankings and LLM visibility.</p>
              </div>
              <div className="space-y-3 mt-8">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                  <span className="text-sm font-medium">Optimize Metadata for Gemini</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 opacity-50">
                  <span className="material-symbols-outlined text-slate-400">radio_button_unchecked</span>
                  <span className="text-sm font-medium">Update Sitemap.xml structure</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 bg-slate-50/50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Choose your visibility path</h2>
              <p className="text-text-secondary">Scale your reach as your business grows.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Card */}
              <div className="bg-white border border-slate-200 shadow-sm p-10 rounded-2xl flex flex-col h-full">
                <div className="mb-8">
                  <div className="text-lg font-bold mb-2">Free</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">$0</span>
                    <span className="text-text-secondary text-sm">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> Basic SEO Audit
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> 1 Website
                  </li>
                  <li className="flex items-center gap-3 text-text-secondary opacity-50">
                    <span className="material-symbols-outlined text-[20px]">close</span> AI Visibility Report
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="w-full py-3 px-4 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors text-center text-sm"
                >
                  Start for free
                </Link>
              </div>

              {/* Pro Card (Active) */}
              <div className="bg-white border-2 border-primary shadow-sm p-10 rounded-2xl flex flex-col h-full relative md:scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold shadow-sm">Most Popular</div>
                <div className="mb-8">
                  <div className="text-lg font-bold mb-2">Pro</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">$99</span>
                    <span className="text-text-secondary text-sm">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> Advanced SEO &amp; AI Audit
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> 3 Websites
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> Competitor Benchmarking
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> Weekly Reports
                  </li>
                </ul>
                <Link
                  href="/signup?plan=pro"
                  className="w-full py-3 px-4 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 active:scale-95 transition-all text-center text-sm shadow-sm"
                >
                  Start Pro Trial
                </Link>
              </div>

              {/* Agency Card */}
              <div className="bg-white border border-slate-200 shadow-sm p-10 rounded-2xl flex flex-col h-full">
                <div className="mb-8">
                  <div className="text-lg font-bold mb-2">Agency</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">$199</span>
                    <span className="text-text-secondary text-sm">/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> 15 Websites
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> White-label Reports
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check</span> Competitor Tracking
                  </li>
                </ul>
                <Link
                  href="/signup?plan=agency"
                  className="w-full py-3 px-4 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors text-center text-sm"
                >
                  Start Agency Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 md:px-12 overflow-hidden relative max-w-7xl mx-auto">
          <div className="bg-slate-900 text-white rounded-3xl p-12 md:p-20 text-center shadow-lg relative">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to rank in the age of AI?</h2>
              <p className="text-slate-300 mb-10 max-w-md mx-auto text-sm md:text-base">Join 12,000+ businesses using Vantage to capture the next wave of traffic.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all text-center text-sm shadow-sm"
                >
                  Start Free Audit Now
                </Link>
                <Link
                  href="/pricing"
                  className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all text-center text-sm"
                >
                  View Pricing Table
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
              <span className="text-xl font-extrabold text-on-surface block mb-4">Vantage</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                The high-performance AI Visibility platform for modern digital presence. Built for precision and clarity.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24 text-sm">
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-6">Product</h4>
                <ul className="space-y-4 text-slate-600">
                  <li><Link className="hover:text-primary transition-all" href="#features">Features</Link></li>
                  <li><Link className="hover:text-primary transition-all" href="/pricing">Pricing</Link></li>
                  <li><a className="hover:text-primary transition-all" href="#">Changelog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-6">Company</h4>
                <ul className="space-y-4 text-slate-600">
                  <li><a className="hover:text-primary transition-all" href="#">About</a></li>
                  <li><a className="hover:text-primary transition-all" href="#">Blog</a></li>
                  <li><a className="hover:text-primary transition-all" href="#">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-text-secondary uppercase mb-6">Legal</h4>
                <ul className="space-y-4 text-slate-600">
                  <li><a className="hover:text-primary transition-all" href="#">Privacy</a></li>
                  <li><a className="hover:text-primary transition-all" href="#">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200">
            <p className="text-xs text-text-secondary">© {new Date().getFullYear()} Vantage. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/pricing" className="text-xs text-text-secondary hover:text-primary transition-all">Pricing</Link>
              <Link href="/dashboard" className="text-xs text-text-secondary hover:text-primary transition-all">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
