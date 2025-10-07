export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-10 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Studyin</p>
        <p>Evidence‑first • Deterministic • Accessible</p>
      </div>
    </footer>
  );
}

