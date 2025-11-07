import type { Metadata } from 'next';
import Hero from './components/Hero';
import Controls from './components/Controls';
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
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Subtle radial vignette - very minimal for deep space */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.2) 80%, rgba(0, 0, 0, 0.4) 100%)',
      }} />

      {/* Hero section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        {/* WebGL Canvas and Controls - Background layer */}
        <div className="absolute inset-0 z-0">
          <ClientWrapper />
        </div>

        {/* Fallback image (hidden by default, shown if WebGL fails) */}
        <noscript>
          <img
            src="/img/heliosphere-still.png"
            alt="Stylized, scientifically-informed heliosphere; apex direction implied."
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
          />
        </noscript>

        {/* Content - Minimal text, positioned at bottom to avoid simulation */}
        <div className="fixed bottom-20 left-0 right-0 z-20 text-center px-4">
          <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto drop-shadow-md">
            Uploading before GTA 6. Learning the tech and philosophy to encode our planet's DNA.
          </p>
        </div>

        {/* Subtle "not to scale" note */}
        <p className="sr-only">Illustrative; not to scale.</p>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm border-t border-white/10 py-3 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-white/40">
          AGPL-3.0-or-later • TooFoo Continuum License v0.1
        </div>
      </footer>
    </main>
  );
}

