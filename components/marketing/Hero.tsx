import Link from 'next/link';
import { Button } from '../ui/button';

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
          <Link href="/study"><Button size="lg">Start studying</Button></Link>
          <Link href="/exam"><Button size="lg" variant="outline">Try an exam</Button></Link>
          <Link href="/drills"><Button size="lg" variant="outline">See drills</Button></Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(40%_30%_at_70%_10%,rgba(59,130,246,0.15),transparent)]" />
    </section>
  );
}
