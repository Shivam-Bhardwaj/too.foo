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
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ minHeight: 'var(--viewport-height, 100vh)' }}>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.2) 80%, rgba(0, 0, 0, 0.4) 100%)',
        }}
        aria-hidden="true"
      />

      <main id="main-content" className="relative flex-1" style={{ minHeight: 'var(--viewport-height, 100vh)' }}>
        <ClientWrapper />

        <noscript>
          <img
            src="/img/heliosphere-still.png"
            alt="Stylized, scientifically-informed heliosphere; apex direction implied."
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
          />
        </noscript>

        <div className="absolute inset-x-4 sm:left-1/2 sm:-translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:bottom-32 z-20 pointer-events-none">
          <h1 className="sr-only">too.foo — Solar Memory Online</h1>
          <p className="text-base md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto text-center drop-shadow-md">
            Uploading before GTA 6. Learning the tech and philosophy to encode our planet's DNA.
          </p>
        </div>
        <p className="sr-only">Illustrative; not to scale.</p>
      </main>
    </div>
  );
}
