export function OKCFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-3"><span className="text-3xl">📚</span> Studyin</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Playful interface. Deterministic analytics. Evidence anchored learning.
          </p>
        </div>
        <div className="border-t border-gray-800 pt-6 text-gray-500 text-sm">
          © {new Date().getFullYear()} Studyin
        </div>
      </div>
    </footer>
  );
}

