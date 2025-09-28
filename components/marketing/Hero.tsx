import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8 md:p-12">
      <div className="relative z-10 max-w-3xl space-y-4 animate-fade-up">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Learn faster with evidence‑first practice.
        </h1>
        <p className="text-lg leading-relaxed text-slate-600">
          Studyin brings OMS‑1 Upper Limb mastery into focus with deterministic exams, per‑choice rationales, and analytics that tell you exactly what to do next.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/study" className="rounded bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Start studying</Link>
          <Link href="/exam" className="rounded border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400">Try an exam</Link>
          <Link href="/drills" className="rounded border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400">See drills</Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(40%_30%_at_70%_10%,rgba(59,130,246,0.15),transparent)]" />
    </section>
  );
}
