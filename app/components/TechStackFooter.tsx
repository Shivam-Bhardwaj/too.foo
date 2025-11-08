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
    <footer className="relative z-30 bg-black/80 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs uppercase tracking-[0.4em] text-white/40">
          Stack
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-white/80">
          {TECH_STACK.map((tech) => (
            <span key={tech} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">
              {tech}
            </span>
          ))}
        </div>
        <div className="text-xs text-white/40">
          AGPL-3.0-or-later • TooFoo Continuum License v0.1
        </div>
      </div>
    </footer>
  );
}
