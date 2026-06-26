import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const ENGINES = ["ChatGPT", "Perplexity", "Gemini", "Google AI Overviews"];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">Vantage</span>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Dashboard
          </Link>
          <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
            Run an audit
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
        <section className="max-w-3xl">
          <p className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            SEO + GEO audit platform
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            See your brand the way{" "}
            <span className="text-primary">AI engines</span> do.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Vantage audits your site for classic SEO health and — the part the
            incumbents miss — whether you actually show up in AI answers. One
            domain in, a full report out.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
              Start a free audit
            </Link>
            <span className="text-sm text-muted-foreground">
              No credit card required
            </span>
          </div>
        </section>

        <section className="mt-24">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tracks your visibility across
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
            {ENGINES.map((engine) => (
              <li key={engine} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                {engine}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Vantage · SEO + AI visibility for growing
        teams
      </footer>
    </div>
  );
}
