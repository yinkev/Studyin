const features = [
  {
    title: 'Evidence‑first items',
    body: 'Per‑choice rationales with figure/page/crops and citations for trust you can inspect.',
  },
  {
    title: 'Deterministic engines',
    body: 'Blueprint fitter, Elo‑lite mastery, and personal spacing — no black boxes.',
  },
  {
    title: 'Blueprint‑true exams',
    body: 'Forms that respect LO weight targets; evidence locked; feedback on submit.'
  },
  {
    title: 'Actionable analytics',
    body: 'TTM per LO, ELG/min ranking, confusion edges, and speed–accuracy insights.'
  }
];

export function Features() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-100 shadow-lg shadow-slate-900/20"
        >
          <h3 className="text-lg font-semibold text-white">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-200/90">{f.body}</p>
        </div>
      ))}
    </section>
  );
}
