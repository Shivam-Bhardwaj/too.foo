'use client';

const TECH_STACK = [
  { name: 'Next.js', version: '14.2.33', url: 'https://nextjs.org' },
  { name: 'React', version: '18.3.1', url: 'https://react.dev' },
  { name: 'Three.js', version: '0.181.0', url: 'https://threejs.org' },
  { name: 'TypeScript', version: '5.7.2', url: 'https://www.typescriptlang.org' },
  { name: 'Tailwind CSS', version: '3.4.17', url: 'https://tailwindcss.com' },
  { name: 'Vitest', version: '4.0.7', url: 'https://vitest.dev' },
  { name: 'Playwright', version: '1.56.1', url: 'https://playwright.dev' },
];

export default function Footer() {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-20 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/10 bg-black/55 backdrop-blur px-2 py-1.5 sm:px-4 sm:py-2.5 pointer-events-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              {/* Tech Stack */}
              <div className="flex flex-col gap-1 sm:gap-1.5">
                <span className="text-[0.6rem] sm:text-[0.45rem] lg:text-[0.5rem] uppercase tracking-[0.35em] text-white/40">
                  Tech Stack
                </span>
                <div className="flex flex-wrap gap-1 sm:gap-1.5 lg:gap-2">
                  {TECH_STACK.map((tech) => (
                    <a
                      key={tech.name}
                      href={tech.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-baseline gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:bg-white/15 transition-colors min-h-[44px] sm:min-h-0"
                      title={`${tech.name} v${tech.version}`}
                    >
                      <span className="text-[0.7rem] sm:text-[0.6rem] lg:text-[0.65rem] text-white/70 group-hover:text-white/90">
                        {tech.name}
                      </span>
                      <span className="text-[0.6rem] sm:text-[0.5rem] lg:text-[0.55rem] font-mono text-white/40 group-hover:text-white/60">
                        {tech.version}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* License */}
              <div className="text-[0.6rem] sm:text-[0.45rem] lg:text-[0.5rem] uppercase tracking-[0.3em] text-white/30 text-center sm:text-right">
                <div>AGPL-3.0-or-later</div>
                <div>TooFoo Continuum License v0.1</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


