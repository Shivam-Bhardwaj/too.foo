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
    <footer
      className="fixed inset-x-0 bottom-0 z-30 pointer-events-none"
      style={{ height: 'calc(var(--viewport-height, 100vh) * var(--footer-ratio, 0.05))' }}
    >
      <div className="pointer-events-auto h-full bg-black/90 border-t border-white/10">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/60">
          <div className="flex flex-col gap-1">
            <span className="text-[0.55rem] uppercase tracking-[0.4em] text-white/40">Tech Stack</span>
            <div className="flex flex-wrap gap-2 text-sm text-white/80">
              {TECH_STACK.map((tech) => (
                <span key={tech} className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[0.55rem] uppercase tracking-[0.35em] text-white/40 text-center sm:text-right">
            AGPL-3.0-or-later • TooFoo Continuum License v0.1
          </div>
        </div>
      </div>
    </footer>
  );
}
