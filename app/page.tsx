import type { Metadata } from 'next';
import ClientWrapper from './components/ClientWrapper';

export const metadata: Metadata = {
  title: 'too.foo — Solar Memory Online',
  description: 'A minimal prelaunch portal for too.foo — encoding our planet\'s living memory. Uploading before GTA 6.',
  openGraph: {
    title: 'too.foo — Solar Memory Online',
    description: 'A minimal prelaunch portal for too.foo — encoding our planet\'s living memory. Uploading before GTA 6.',
    images: ['/img/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'too.foo — Solar Memory Online',
    description: 'A minimal prelaunch portal for too.foo — encoding our planet\'s living memory. Uploading before GTA 6.',
    images: ['/img/og.png'],
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Subtle radial vignette - very minimal for deep space */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.2) 80%, rgba(0, 0, 0, 0.4) 100%)',
      }} />

      {/* Header - Controls and Menu */}
      <header className="relative z-30 w-full">
        <ClientWrapper />
      </header>

      {/* Middle Section - Date, Quote, and Simulation */}
      <section className="flex-1 relative min-h-screen">
        {/* WebGL Canvas - Simulation (rendered by ClientWrapper) */}
        
        {/* Fallback image (hidden by default, shown if WebGL fails) */}
        <noscript>
          <img
            src="/img/heliosphere-still.png"
            alt="Stylized, scientifically-informed heliosphere; apex direction implied."
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
          />
        </noscript>

        {/* Quote */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 text-center px-4 pointer-events-none">
          <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto drop-shadow-md">
            Uploading before GTA 6. Learning the tech and philosophy to encode our planet's DNA.
          </p>
        </div>

        {/* Subtle "not to scale" note */}
        <p className="sr-only">Illustrative; not to scale.</p>
      </section>

      {/* Footer - Information and License */}
      <footer className="relative z-20 bg-black/60 backdrop-blur-sm border-t border-white/10 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-sm text-white/40 space-y-1">
            <div>
              AGPL-3.0-or-later • TooFoo Continuum License v0.1
            </div>
            <div className="text-xs text-white/30">
              Built with Three.js, Next.js, NASA/JPL Ephemerides, Voyager Mission Data
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

