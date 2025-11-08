const TECH_STACK = [
  'Next.js',
  'React 18',
  'Three.js',
  'TypeScript',
  'Tailwind CSS',
  'Vitest',
  'Playwright',
];

export default function TechStackFooter() {
  return (
    <footer className="relative z-30 bg-black/85 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-white/60">
        <div className="flex flex-wrap gap-2 text-sm text-white/80">
          {TECH_STACK.map((tech) => (
            <span key={tech} className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5">
              {tech}
            </span>
          ))}
        </div>
        <div className="text-[0.6rem] uppercase tracking-[0.35em] text-white/40 text-center sm:text-right">
          AGPL-3.0-or-later • TooFoo Continuum License v0.1
        </div>
      </div>
    </footer>
  );
}
