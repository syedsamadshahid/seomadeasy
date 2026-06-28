import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-6 overflow-hidden">
      {/* Auth Shell */}
      <main className="w-full h-screen md:h-[800px] max-w-5xl flex flex-col md:flex-row bg-white rounded-none md:rounded-2xl overflow-hidden shadow-md border border-slate-200">
        {/* Left Indigo Panel (Identity & Tagline) */}
        <section className="relative w-full md:w-1/2 bg-indigo-600 p-12 flex flex-col justify-between text-white overflow-hidden">
          {/* Ambient Background Gradient (Mocking the mesh) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950 to-pink-950 opacity-95"></div>

          {/* Branding Overlay */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-300" style={{ fontVariationSettings: "'FILL' 1" }}>
              insights
            </span>
            <Link href="/" className="text-lg font-bold tracking-tight">
              Vantage
            </Link>
          </div>

          {/* AI Visibility Score Component */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center py-6">
            <div className="relative w-44 h-44 md:w-56 md:h-56 mb-8 group">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.08)" strokeWidth="6"></circle>
                <circle
                  className="transition-all duration-1000"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="#22d3ee"
                  strokeLinecap="round"
                  strokeWidth="6"
                  style={{
                    strokeDasharray: "283",
                    strokeDashoffset: `${283 - (283 * 67) / 100}`,
                  }}
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none">67</span>
                <span className="text-[10px] font-bold tracking-wider text-cyan-300 uppercase mt-2">Visibility Score</span>
              </div>
              {/* Atmosphere glow */}
              <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl rounded-full -z-10 animate-pulse"></div>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight max-w-xs mx-auto">
              See what AI says about you.
            </h1>
            <p className="text-sm text-indigo-200 max-w-xs mx-auto leading-relaxed">
              Real-time analysis of how LLMs and search engines perceive your business identity.
            </p>
          </div>

          {/* Bottom Content */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold font-mono">AR</div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold font-mono">SS</div>
              <div className="w-9 h-9 rounded-full bg-indigo-500 text-white border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold">+12k</div>
            </div>
            <p className="text-xs text-indigo-200">Joined by top-performing agencies</p>
          </div>

          {/* Grid dots texture */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
        </section>

        {/* Right Form (Auth Logic) */}
        <section className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
