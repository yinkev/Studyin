import Link from 'next/link';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/20 via-blue-500/10 to-fuchsia-500/10 p-10 shadow-2xl backdrop-blur">
      <div className="relative z-10 max-w-3xl space-y-5 animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-100/90">Local-first mastery engine</p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Learn faster with evidence‑anchored practice and transparent temporal RAG.
        </h1>
        <p className="text-base leading-relaxed text-slate-100/80">
          Studyin keeps blueprint weights, Elo-lite mastery, and evidence crops deterministic. Author lessons with the Codex CLI, publish MCQs with validator gates, and surface “why this next” backed by analytics.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/study"><Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200">Start studying</Button></Link>
          <Link href="/summary"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">View analytics</Button></Link>
          <Link href="/docs"><Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">Read SOP</Button></Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_65%_at_100%_0%,rgba(104,211,245,0.25),transparent_60%)]" />
    </section>
  );
}
