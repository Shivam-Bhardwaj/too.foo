import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Navigation from '../components/Navigation';

// Dynamically import with SSR disabled to prevent hydration errors
// This component relies heavily on browser APIs (WebGL, canvas) and should not be server-rendered
const HeliosphereDemoClient = dynamic(
  () => import('../heliosphere-demo/HeliosphereDemoClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="relative h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="mb-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
          </div>
          <p className="text-xl">Loading Sun-Centric Heliosphere...</p>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Heliosphere Research Visualization — Scientific Accuracy',
  description: 'Sun-centric, dataset-driven visualization of the heliosphere across the Sun\'s entire lifetime (0-12 Gyr)',
  openGraph: {
    title: 'Sun-Centric Heliosphere Visualization',
    description: 'Scientifically accurate heliosphere simulation with precomputed datasets',
    images: ['/img/heliosphere-research.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sun-Centric Heliosphere Visualization',
    description: 'Scientifically accurate heliosphere simulation with precomputed datasets',
    images: ['/img/heliosphere-research.png'],
  },
};

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navigation />
      {/* 1. Header */}
      <header className="flex-shrink-0 py-4 px-4 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold text-white/90">
          Sun-Centric Heliosphere
        </h1>
        <p className="text-sm text-white/70 mt-1">
          Dataset-Driven • Precomputed Parameters • 0-12 Gyr Timeline
        </p>
      </header>

      {/* 2. Simulation Section */}
      <section className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <HeliosphereDemoClient />
        </div>
      </section>

      {/* 3. Footer */}
      <footer className="flex-shrink-0 py-4 px-4 border-t border-white/10 flex justify-between items-center text-xs text-white/40">
        <div>
          <p>Data: Precomputed Heliosphere Parameters</p>
          <p>Model: Sun-Centric Architecture (HEE/J2000 Frame)</p>
        </div>
        <div className="text-right">
          <p>Mouse: Rotate • Scroll: Zoom • Drag: Pan</p>
          <p>Time: Slider controls • Validation: Toggle overlay</p>
        </div>
      </footer>

      {/* Scientific disclaimer */}
      <div className="sr-only">
        This visualization uses precomputed heliosphere parameters spanning the Sun's lifetime
        from Zero Age Main Sequence (ZAMS) to White Dwarf phase. All geometry is expressed
        in Sun-centric coordinates (HEE/J2000 frame) with distances in Astronomical Units (AU).
        Validation overlays confirm scientific accuracy of scales and orientations.
      </div>
    </main>
  );
}
